import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { afterEach, describe, expect, test } from 'vitest';
import { createDeterministicZip, normalizeSample } from '../../scripts/gallery-model.mjs';

const temporaryDirectories = [];

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

function sample(overrides = {}) {
	return {
		name: 'pnp-sharepoint-skills-example-skill',
		source: 'pnp',
		title: 'Example Skill',
		shortDescription: 'A focused example.',
		url: 'https://github.com/pnp/sharepoint-skills/tree/main/Skills/example-skill',
		longDescription: ['A longer description.'],
		creationDateTime: '2026-08-01',
		updateDateTime: '2026-08-02',
		products: ['SharePoint'],
		metadata: [
			{ key: 'SAMPLE-TYPE', value: 'SharePoint-AI-Skill' },
			{ key: 'SKILL-CATEGORY', value: 'Testing' },
		],
		thumbnails: [{ type: 'image', order: 100, url: 'https://example.com/preview.png', alt: 'Preview' }],
		authors: [{ gitHubAccount: 'octocat', pictureUrl: 'https://github.com/octocat.png', name: 'Octocat' }],
		references: [],
		...overrides,
	};
}

describe('normalizeSample', () => {
	test('derives gallery fields and sanitizes authored Markdown', () => {
		const result = normalizeSample(
			'example-skill',
			sample(),
			'# Example Skill\n\n<script>alert(1)</script>\n\n[Guide](./guide.md)',
			'# Skill instructions',
			{ url: '/downloads/example-skill.zip', bytes: 100, sha256: 'a'.repeat(64) },
		);

		expect(result.category).toBe('Testing');
		expect(result.status).toBe('stable');
		expect(result.readmeHtml).not.toContain('<script');
		expect(result.readmeHtml).not.toContain('<h1>');
		expect(result.readmeHtml).toContain('/blob/main/Skills/example-skill/guide.md');
	});

	test('rejects README links that leave the Skills tree', () => {
		expect(() =>
			normalizeSample(
				'example-skill',
				sample(),
				'[Unsafe](../../README.md)',
				'# Skill instructions',
				{ url: '/downloads/example-skill.zip', bytes: 100, sha256: 'a'.repeat(64) },
			),
		).toThrow(/Unsafe README link/);
	});
});

describe('createDeterministicZip', () => {
	test('creates byte-identical archives containing only the package root', async () => {
		const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'sharepoint-skill-'));
		temporaryDirectories.push(temporaryRoot);
		await mkdir(path.join(temporaryRoot, 'references'), { recursive: true });
		await writeFile(path.join(temporaryRoot, 'SKILL.md'), '# Example');
		await writeFile(path.join(temporaryRoot, 'references', 'guide.md'), '# Guide');

		const first = await createDeterministicZip('example-skill', temporaryRoot);
		const second = await createDeterministicZip('example-skill', temporaryRoot);
		expect(createHash('sha256').update(first).digest('hex')).toBe(
			createHash('sha256').update(second).digest('hex'),
		);

		const archive = await JSZip.loadAsync(first);
		expect(Object.keys(archive.files).sort()).toEqual([
			'example-skill/SKILL.md',
			'example-skill/references/guide.md',
		]);
	});
});