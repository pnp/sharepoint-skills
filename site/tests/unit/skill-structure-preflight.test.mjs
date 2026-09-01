import { describe, expect, test, vi } from 'vitest';
import preflight from '../../../.github/scripts/skill_structure_preflight.cjs';

const {
	COMMENT_MARKER,
	MANAGED_LABEL_MARKER,
	formatStructureComment,
	inspectSkillStructure,
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
		pulls: { listFiles: vi.fn() },
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

describe('skill structure pull request feedback', () => {
	test('adds Needs: Changes and posts actionable guidance for an invalid layout', async () => {
		const tree = validTree().filter(({ path }) =>
			path !== 'Skills/example-skill/example-skill' &&
			path !== 'Skills/example-skill/example-skill/SKILL.md' &&
			!path.endsWith('/assets/sample.json'));
		tree.push({ path: 'Skills/example-skill/SKILL.md', type: 'blob', sha: 'manifest' });
		const github = githubMock({
			tree,
			manifest: '---\nname: other-name\ndescription: Example\n---',
		});

		const result = await runStructurePreflight({ github, context: context() });

		expect(result.errors.length).toBeGreaterThan(0);
		expect(github.rest.issues.addLabels).toHaveBeenCalledWith(expect.objectContaining({
			labels: ['Needs: Changes'],
		}));
		expect(github.rest.issues.createComment).toHaveBeenCalledWith(expect.objectContaining({
			body: expect.stringContaining('The required structure is:'),
		}));
		expect(github.rest.issues.createComment.mock.calls[0][0].body).toContain(MANAGED_LABEL_MARKER);
	});

	test('removes a bot-managed label after the structure is corrected', async () => {
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
			context: context([{ name: 'Needs: Changes' }]),
		});

		expect(github.rest.issues.removeLabel).toHaveBeenCalledWith(expect.objectContaining({
			name: 'Needs: Changes',
		}));
		expect(github.rest.issues.updateComment).toHaveBeenCalledWith(expect.objectContaining({
			body: formatStructureComment([]),
		}));
	});
});