const COMMENT_MARKER = '<!-- skill-structure-preflight -->';
const MANAGED_LABEL_MARKER = '<!-- skill-structure-preflight-label:author-feedback -->';
const LEGACY_MANAGED_LABEL_MARKER = '<!-- skill-structure-preflight-label:managed -->';
const AUTHOR_FEEDBACK_LABEL = 'Needs: Author Feedback';
const LEGACY_NEEDS_CHANGES_LABEL = 'Needs: Changes';
const TRIAGE_LABEL = 'Needs: Triage :mag:';
const CONTRIBUTING_URL = 'https://github.com/pnp/sharepoint-skills/blob/main/CONTRIBUTING.md';
const MAX_REPORTED_ERRORS = 40;

function changedSkillSlugs(changedFiles) {
	return [...new Set(changedFiles.flatMap((file) => {
		const filename = typeof file === 'string' ? file : file.filename;
		const match = /^Skills\/([^/]+)\//.exec(filename || '');
		return match ? [match[1]] : [];
	}))].sort();
}

function frontmatterName(text) {
	const lines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/);
	if (lines[0] !== '---') return null;
	const closingIndex = lines.indexOf('---', 1);
	if (closingIndex === -1) return null;
	const match = /^name:\s*['"]?([^'"\r\n]+?)['"]?\s*$/m.exec(lines.slice(1, closingIndex).join('\n'));
	return match?.[1]?.trim() || null;
}

async function inspectSkillStructure({ changedFiles, treeEntries, readBlob }) {
	const errors = [];
	const entries = new Map(treeEntries.map((entry) => [entry.path, entry]));
	const slugs = changedSkillSlugs(changedFiles);

	for (const slug of slugs) {
		const outerPath = `Skills/${slug}`;
		const outerExists = entries.get(outerPath)?.type === 'tree';
		if (!outerExists) continue;

		if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug)) {
			errors.push({ path: outerPath, message: 'outer folder name must be lowercase kebab-case' });
		}

		const allowedDirectories = new Set(['assets', 'demo', slug]);
		for (const entry of treeEntries) {
			if (entry.type !== 'tree' || !entry.path.startsWith(`${outerPath}/`)) continue;
			const relativePath = entry.path.slice(outerPath.length + 1);
			if (!relativePath.includes('/') && !allowedDirectories.has(relativePath)) {
				errors.push({ path: entry.path, message: 'unexpected outer subfolder' });
			}
		}

		const innerPath = `${outerPath}/${slug}`;
		const expectedManifestPath = `${innerPath}/SKILL.md`;
		const rootManifestPath = `${outerPath}/SKILL.md`;
		const innerExists = entries.get(innerPath)?.type === 'tree';
		const expectedManifest = entries.get(expectedManifestPath);
		const rootManifest = entries.get(rootManifestPath);

		if (!innerExists) {
			errors.push({ path: outerPath, message: `missing exact same-name inner package: ${slug}/` });
		} else if (expectedManifest?.type !== 'blob') {
			errors.push({ path: expectedManifestPath, message: 'inner package must contain exact-case SKILL.md' });
		}

		if (rootManifest?.type === 'blob') {
			errors.push({
				path: rootManifestPath,
				message: `move SKILL.md into the same-name inner package at ${expectedManifestPath}`,
			});
		}

		const manifest = expectedManifest?.type === 'blob' ? expectedManifest : rootManifest;
		if (manifest?.type === 'blob') {
			const name = frontmatterName(await readBlob(manifest));
			if (name === null) {
				errors.push({ path: manifest.path, message: 'SKILL.md frontmatter name is missing or malformed' });
			} else if (name !== slug) {
				errors.push({ path: manifest.path, message: `frontmatter name must exactly match folder '${slug}'` });
			}
		}

		for (const [relativePath, message] of [
			['README.md', 'required outer README.md is missing'],
			['assets/sample.json', 'required sample.json is missing'],
			['assets/preview.png', 'required preview.png is missing'],
		]) {
			const path = `${outerPath}/${relativePath}`;
			if (entries.get(path)?.type !== 'blob') errors.push({ path, message });
		}
	}

	return { errors, slugs };
}

function inlineCode(value) {
	return `\`${String(value).replace(/[\r\n]/g, ' ').replace(/`/g, "'")}\``;
}

function escapeMarkdown(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/@/g, '@<!-- -->');
}

function formatStructureComment(errors, managesLabel = false) {
	const lines = [COMMENT_MARKER];
	if (managesLabel) lines.push(MANAGED_LABEL_MARKER);
	lines.push('## Skill structure preflight', '');

	if (errors.length === 0) {
		lines.push('All changed skill folders follow the required package structure.');
		return lines.join('\n');
	}

	lines.push(
		`Found **${errors.length}** structure ${errors.length === 1 ? 'issue' : 'issues'}:`,
		'',
	);
	for (const error of errors.slice(0, MAX_REPORTED_ERRORS)) {
		lines.push(`- ${inlineCode(error.path)}: ${escapeMarkdown(error.message)}`);
	}
	if (errors.length > MAX_REPORTED_ERRORS) {
		lines.push(`- ${errors.length - MAX_REPORTED_ERRORS} additional issues were omitted.`);
	}

	lines.push(
		'',
		'The required structure is:',
		'',
		'```text',
		'Skills/skill-name/',
		'|-- README.md',
		'|-- assets/',
		'|   |-- sample.json',
		'|   `-- preview.png',
		'`-- skill-name/',
		'    `-- SKILL.md',
		'```',
		'',
		`See the [contribution guide](${CONTRIBUTING_URL}) for templates and complete requirements.`,
	);
	return lines.join('\n');
}

async function resolvePullRequest(github, context) {
	if (context.payload.pull_request) return context.payload.pull_request;

	let pullRequestNumber = Number(context.payload.inputs?.pull_request_number) || null;
	const workflowRun = context.payload.workflow_run;
	if (!pullRequestNumber && workflowRun?.event === 'pull_request') {
		pullRequestNumber = workflowRun.pull_requests?.[0]?.number || null;
		if (!pullRequestNumber) {
			const headOwner = workflowRun.head_repository?.owner?.login;
			const headBranch = workflowRun.head_branch;
			const pullRequests = await github.paginate(github.rest.pulls.list, {
				...context.repo,
				state: 'open',
				head: headOwner && headBranch ? `${headOwner}:${headBranch}` : undefined,
				per_page: 100,
			});
			const repositoryName = `${context.repo.owner}/${context.repo.repo}`;
			const pullRequest = pullRequests.find((candidate) =>
				candidate.head?.sha === workflowRun.head_sha &&
				candidate.base?.repo?.full_name === repositoryName);
			pullRequestNumber = pullRequest?.number || null;
		}
	}

	if (!pullRequestNumber) return null;
	const response = await github.rest.pulls.get({
		...context.repo,
		pull_number: pullRequestNumber,
	});
	return response.data;
}

async function findExistingComment(github, context, pullRequestNumber) {
	const comments = await github.paginate(github.rest.issues.listComments, {
		...context.repo,
		issue_number: pullRequestNumber,
		per_page: 100,
	});
	return comments.find((comment) =>
		comment.user?.login === 'github-actions[bot]' && comment.body?.includes(COMMENT_MARKER));
}

async function upsertComment(github, context, pullRequestNumber, existingComment, body) {
	if (existingComment) {
		await github.rest.issues.updateComment({
			...context.repo,
			comment_id: existingComment.id,
			body,
		});
		return;
	}
	await github.rest.issues.createComment({
		...context.repo,
		issue_number: pullRequestNumber,
		body,
	});
}

async function removeLabel(github, context, pullRequestNumber, name) {
	try {
		await github.rest.issues.removeLabel({
			...context.repo,
			issue_number: pullRequestNumber,
			name,
		});
	} catch (error) {
		if (error.status !== 404) throw error;
	}
}

async function runStructurePreflight({ github, context }) {
	const pullRequest = await resolvePullRequest(github, context);
	if (!pullRequest) return { errors: [], slugs: [], skipped: true };
	const changedFiles = await github.paginate(github.rest.pulls.listFiles, {
		...context.repo,
		pull_number: pullRequest.number,
		per_page: 100,
	});
	const slugs = changedSkillSlugs(changedFiles);
	const existingComment = await findExistingComment(github, context, pullRequest.number);

	if (slugs.length === 0 && !existingComment) return { errors: [], slugs };

	let errors = [];
	if (slugs.length > 0) {
		const headRepository = pullRequest.head.repo;
		if (!headRepository) throw new Error('The pull request head repository is unavailable.');
		const headOwner = headRepository.owner.login;
		const headRepo = headRepository.name;
		const treeResponse = await github.rest.git.getTree({
			owner: headOwner,
			repo: headRepo,
			tree_sha: pullRequest.head.sha,
			recursive: 'true',
		});
		if (treeResponse.data.truncated) {
			throw new Error('The pull request tree is too large for the structure preflight.');
		}
		({ errors } = await inspectSkillStructure({
			changedFiles,
			treeEntries: treeResponse.data.tree,
			readBlob: async (entry) => {
				const response = await github.rest.git.getBlob({
					owner: headOwner,
					repo: headRepo,
					file_sha: entry.sha,
				});
				return Buffer.from(response.data.content, response.data.encoding).toString('utf8');
			},
		}));
	}

	const labels = new Set((pullRequest.labels || []).map((label) => label.name || label));
	const previouslyManagedLabel = existingComment?.body?.includes(MANAGED_LABEL_MARKER) || false;
	const previouslyManagedLegacyLabel =
		existingComment?.body?.includes(LEGACY_MANAGED_LABEL_MARKER) || false;
	let managesLabel = previouslyManagedLabel;

	if (errors.length > 0) {
		if (!labels.has(AUTHOR_FEEDBACK_LABEL)) {
			await github.rest.issues.addLabels({
				...context.repo,
				issue_number: pullRequest.number,
				labels: [AUTHOR_FEEDBACK_LABEL],
			});
			managesLabel = true;
		}
		if (labels.has(TRIAGE_LABEL)) {
			await removeLabel(github, context, pullRequest.number, TRIAGE_LABEL);
		}
		if (previouslyManagedLegacyLabel && labels.has(LEGACY_NEEDS_CHANGES_LABEL)) {
			await removeLabel(github, context, pullRequest.number, LEGACY_NEEDS_CHANGES_LABEL);
		}
		await upsertComment(
			github,
			context,
			pullRequest.number,
			existingComment,
			formatStructureComment(errors, managesLabel),
		);
	} else if (existingComment) {
		if (previouslyManagedLabel && labels.has(AUTHOR_FEEDBACK_LABEL)) {
			await removeLabel(github, context, pullRequest.number, AUTHOR_FEEDBACK_LABEL);
		}
		if (previouslyManagedLegacyLabel && labels.has(LEGACY_NEEDS_CHANGES_LABEL)) {
			await removeLabel(github, context, pullRequest.number, LEGACY_NEEDS_CHANGES_LABEL);
		}
		await upsertComment(github, context, pullRequest.number, existingComment, formatStructureComment([]));
	}

	return { errors, slugs };
}

module.exports = {
	AUTHOR_FEEDBACK_LABEL,
	COMMENT_MARKER,
	LEGACY_MANAGED_LABEL_MARKER,
	LEGACY_NEEDS_CHANGES_LABEL,
	MANAGED_LABEL_MARKER,
	TRIAGE_LABEL,
	changedSkillSlugs,
	formatStructureComment,
	inspectSkillStructure,
	resolvePullRequest,
	runStructurePreflight,
};