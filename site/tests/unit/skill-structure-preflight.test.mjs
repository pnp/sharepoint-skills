import { describe, expect, test, vi } from 'vitest';
import preflight from '../../../.github/scripts/skill_structure_preflight.cjs';

const {
	AUTHOR_FEEDBACK_LABEL,
	COMMENT_MARKER,
	LEGACY_MANAGED_LABEL_MARKER,
	LEGACY_NEEDS_CHANGES_LABEL,
	MANAGED_LABEL_MARKER,
	TRIAGE_LABEL,
	formatStructureComment,
	inspectSkillStructure,
	resolvePullRequest,
	runStructurePreflight,
} = preflight;

function validTree(slug = 'example-skill') {
	return [
		{ path: `Skills/${slug}`, type: 'tree' },
		{ path: `Skills/${slug}/README.md`, type: 'blob' },
		{ path: `Skills/${slug}/assets`, type: 'tree' },
		{ path: `Skills/${slug}/assets/sample.json`, type: 'blob' },
		{ path: `Skills/${slug}/assets/preview.png`, type: 'blob' },
		{ path: `Skills/${slug}/${slug}`, type: 'tree' },
		{ path: `Skills/${slug}/${slug}/SKILL.md`, type: 'blob', sha: 'manifest' },
	];
}

function githubMock({ tree, manifest, comments = [] }) {
	const rest = {
		pulls: {
			get: vi.fn().mockResolvedValue({ data: context().payload.pull_request }),
			list: vi.fn(),
			listFiles: vi.fn(),
		},
		git: {
			getTree: vi.fn().mockResolvedValue({ data: { tree, truncated: false } }),
			getBlob: vi.fn().mockResolvedValue({
				data: { content: Buffer.from(manifest).toString('base64'), encoding: 'base64' },
			}),
		},
		issues: {
			listComments: vi.fn(),
			addLabels: vi.fn(),
			removeLabel: vi.fn(),
			createComment: vi.fn(),
			updateComment: vi.fn(),
		},
	};
	return {
		rest,
		paginate: vi.fn(async (endpoint) => {
			if (endpoint === rest.pulls.listFiles) {
				return [{ filename: 'Skills/example-skill/README.md' }];
			}
			if (endpoint === rest.pulls.list) {
				return [context().payload.pull_request];
			}
			return comments;
		}),
	};
}

function context(labels = []) {
	return {
		repo: { owner: 'pnp', repo: 'sharepoint-skills' },
		payload: {
			pull_request: {
				number: 52,
				labels,
				base: { repo: { full_name: 'pnp/sharepoint-skills' } },
				head: {
					sha: '0123456789abcdef',
					repo: { name: 'sharepoint-skills', owner: { login: 'contributor' } },
				},
			},
		},
	};
}

describe('skill structure inspection', () => {
	test('accepts the required outer and same-name inner layout', async () => {
		const result = await inspectSkillStructure({
			changedFiles: [{ filename: 'Skills/example-skill/README.md' }],
			treeEntries: validTree(),
			readBlob: async () => '---\nname: example-skill\ndescription: Example\n---',
		});

		expect(result.errors).toEqual([]);
		expect(result.slugs).toEqual(['example-skill']);
	});

	test('reports the structural problems represented by PR 52', async () => {
		const result = await inspectSkillStructure({
			changedFiles: [{ filename: 'Skills/sharepoint-page-governance/SKILL.md' }],
			treeEntries: [
				{ path: 'Skills/sharepoint-page-governance', type: 'tree' },
				{ path: 'Skills/sharepoint-page-governance/README.md', type: 'blob' },
				{ path: 'Skills/sharepoint-page-governance/SKILL.md', type: 'blob', sha: 'manifest' },
				{ path: 'Skills/sharepoint-page-governance/assets', type: 'tree' },
				{ path: 'Skills/sharepoint-page-governance/assets/preview.png', type: 'blob' },
			],
			readBlob: async () => '---\nname: intranet-page-lifecycle-review\ndescription: Example\n---',
		});

		expect(result.errors.map(({ message }) => message)).toEqual(expect.arrayContaining([
			'missing exact same-name inner package: sharepoint-page-governance/',
			'move SKILL.md into the same-name inner package at Skills/sharepoint-page-governance/sharepoint-page-governance/SKILL.md',
			"frontmatter name must exactly match folder 'sharepoint-page-governance'",
			'required sample.json is missing',
		]));
	});

	test('does not reject an intentionally deleted skill folder', async () => {
		const result = await inspectSkillStructure({
			changedFiles: [{ filename: 'Skills/retired-skill/README.md' }],
			treeEntries: [],
			readBlob: async () => '',
		});

		expect(result.errors).toEqual([]);
	});
});

describe('skill structure guidance', () => {
	test('renders file names and the example tree without stripped placeholders', () => {
		const comment = formatStructureComment([
			{ path: 'Skills/example-skill/assets/sample.json', message: 'required sample.json is missing' },
		]);

		expect(comment).toContain('required sample.json is missing');
		expect(comment).not.toContain('sample\\.json');
		expect(comment).toContain('Skills/skill-name/');
		expect(comment).toContain('`-- skill-name/');
	});
});

describe('pull request resolution', () => {
	test('resolves a fork pull request after its validation workflow completes', async () => {
		const github = githubMock({ tree: [], manifest: '' });
		const workflowContext = {
			repo: { owner: 'pnp', repo: 'sharepoint-skills' },
			payload: {
				workflow_run: {
					event: 'pull_request',
					head_branch: 'main',
					head_repository: { owner: { login: 'contributor' } },
					head_sha: '0123456789abcdef',
					pull_requests: [],
				},
			},
		};

		const pullRequest = await resolvePullRequest(github, workflowContext);

		expect(github.paginate).toHaveBeenCalledWith(github.rest.pulls.list, expect.objectContaining({
			head: 'contributor:main',
			state: 'open',
		}));
		expect(github.rest.pulls.get).toHaveBeenCalledWith(expect.objectContaining({
			pull_number: 52,
		}));
		expect(pullRequest.number).toBe(52);
	});

	test('posts feedback using the resolved workflow-run pull request number', async () => {
		const tree = validTree().filter(({ path }) => path !== 'Skills/example-skill/assets/sample.json');
		const github = githubMock({
			tree,
			manifest: '---\nname: example-skill\ndescription: Example\n---',
		});
		const workflowContext = {
			repo: { owner: 'pnp', repo: 'sharepoint-skills' },
			payload: {
				workflow_run: {
					event: 'pull_request',
					head_branch: 'main',
					head_repository: { owner: { login: 'contributor' } },
					head_sha: '0123456789abcdef',
					pull_requests: [],
				},
			},
		};

		await runStructurePreflight({ github, context: workflowContext });

		expect(github.rest.issues.createComment).toHaveBeenCalledWith(expect.objectContaining({
			issue_number: 52,
		}));
	});

	test('resolves a manually dispatched pull request number', async () => {
		const github = githubMock({ tree: [], manifest: '' });
		const dispatchContext = {
			repo: { owner: 'pnp', repo: 'sharepoint-skills' },
			payload: { inputs: { pull_request_number: '52' } },
		};

		const pullRequest = await resolvePullRequest(github, dispatchContext);

		expect(github.rest.pulls.get).toHaveBeenCalledWith(expect.objectContaining({
			pull_number: 52,
		}));
		expect(pullRequest.number).toBe(52);
	});
});

describe('skill structure pull request feedback', () => {
	test('requests author feedback, removes triage, and posts guidance for an invalid layout', async () => {
		const tree = validTree().filter(({ path }) =>
			path !== 'Skills/example-skill/example-skill' &&
			path !== 'Skills/example-skill/example-skill/SKILL.md' &&
			!path.endsWith('/assets/sample.json'));
		tree.push({ path: 'Skills/example-skill/SKILL.md', type: 'blob', sha: 'manifest' });
		const github = githubMock({
			tree,
			manifest: '---\nname: other-name\ndescription: Example\n---',
		});

		const result = await runStructurePreflight({
			github,
			context: context([{ name: TRIAGE_LABEL }]),
		});

		expect(result.errors.length).toBeGreaterThan(0);
		expect(github.rest.issues.addLabels).toHaveBeenCalledWith(expect.objectContaining({
			labels: [AUTHOR_FEEDBACK_LABEL],
		}));
		expect(github.rest.issues.removeLabel).toHaveBeenCalledWith(expect.objectContaining({
			name: TRIAGE_LABEL,
		}));
		expect(github.rest.issues.createComment).toHaveBeenCalledWith(expect.objectContaining({
			body: expect.stringContaining('The required structure is:'),
		}));
		expect(github.rest.issues.createComment.mock.calls[0][0].body).toContain(MANAGED_LABEL_MARKER);
	});

	test('migrates the legacy bot-managed label while requesting author feedback', async () => {
		const tree = validTree().filter(({ path }) => path !== 'Skills/example-skill/assets/sample.json');
		const comments = [{
			id: 123,
			body: `${COMMENT_MARKER}\n${LEGACY_MANAGED_LABEL_MARKER}\nPrevious errors`,
			user: { login: 'github-actions[bot]' },
		}];
		const github = githubMock({
			tree,
			manifest: '---\nname: example-skill\ndescription: Example\n---',
			comments,
		});

		await runStructurePreflight({
			github,
			context: context([
				{ name: LEGACY_NEEDS_CHANGES_LABEL },
				{ name: TRIAGE_LABEL },
			]),
		});

		expect(github.rest.issues.addLabels).toHaveBeenCalledWith(expect.objectContaining({
			labels: [AUTHOR_FEEDBACK_LABEL],
		}));
		expect(github.rest.issues.removeLabel).toHaveBeenCalledWith(expect.objectContaining({
			name: LEGACY_NEEDS_CHANGES_LABEL,
		}));
		expect(github.rest.issues.removeLabel).toHaveBeenCalledWith(expect.objectContaining({
			name: TRIAGE_LABEL,
		}));
		expect(github.rest.issues.updateComment.mock.calls[0][0].body).toContain(MANAGED_LABEL_MARKER);
		expect(github.rest.issues.updateComment.mock.calls[0][0].body).not.toContain(
			LEGACY_MANAGED_LABEL_MARKER,
		);
	});

	test('removes a bot-managed author feedback label after the structure is corrected', async () => {
		const comments = [{
			id: 123,
			body: `${COMMENT_MARKER}\n${MANAGED_LABEL_MARKER}\nPrevious errors`,
			user: { login: 'github-actions[bot]' },
		}];
		const github = githubMock({
			tree: validTree(),
			manifest: '---\nname: example-skill\ndescription: Example\n---',
			comments,
		});

		await runStructurePreflight({
			github,
			context: context([{ name: AUTHOR_FEEDBACK_LABEL }]),
		});

		expect(github.rest.issues.removeLabel).toHaveBeenCalledWith(expect.objectContaining({
			name: AUTHOR_FEEDBACK_LABEL,
		}));
		expect(github.rest.issues.updateComment).toHaveBeenCalledWith(expect.objectContaining({
			body: formatStructureComment([]),
		}));
	});
});