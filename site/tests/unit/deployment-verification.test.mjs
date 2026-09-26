import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import {
	createDeploymentMarker,
	verifyDeployment,
} from '../../scripts/deployment-verification.mjs';

const COMMIT_SHA = '0123456789abcdef0123456789abcdef01234567';
const catalog = {
	version: 1,
	generatedAt: '2026-08-28T00:00:00.000Z',
	skills: [{
		slug: 'demo',
		preview: { src640: '/generated/previews/demo-640.webp' },
		package: { url: '/downloads/demo.zip' },
	}],
};
const temporaryDirectories = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
	);
});

describe('deployment verification', () => {
	test('records the commit and exact catalog content in the build artifact', async () => {
		const distRoot = await mkdtemp(path.join(tmpdir(), 'gallery-deployment-'));
		temporaryDirectories.push(distRoot);
		const catalogContent = `${JSON.stringify(catalog)}\n`;
		await writeFile(path.join(distRoot, 'catalog.json'), catalogContent);

		const marker = await createDeploymentMarker({ distRoot, commitSha: COMMIT_SHA });
		const writtenMarker = JSON.parse(await readFile(path.join(distRoot, 'deployment.json'), 'utf8'));

		expect(writtenMarker).toEqual(marker);
		expect(marker).toMatchObject({
			commitSha: COMMIT_SHA,
			skillCount: 1,
			generatedAt: catalog.generatedAt,
			catalogSha256: createHash('sha256').update(catalogContent).digest('hex'),
		});
	});

	test('verifies the live count and every generated asset under the site base path', async () => {
		const catalogContent = `${JSON.stringify(catalog)}\n`;
		const marker = {
			version: 1,
			commitSha: COMMIT_SHA,
			skillCount: 1,
			generatedAt: catalog.generatedAt,
			catalogSha256: createHash('sha256').update(catalogContent).digest('hex'),
		};
		const requestedPaths = [];
		const fetchImpl = async (request, options) => {
			const pathname = new URL(request).pathname;
			requestedPaths.push(`${options.method}:${pathname}`);
			if (options.method === 'HEAD') return new Response(null, { status: 200 });
			if (pathname.endsWith('/deployment.json')) return Response.json(marker);
			return new Response(catalogContent, { status: 200 });
		};

		await verifyDeployment({
			siteUrl: 'https://example.com/gallery/',
			expectedCommitSha: COMMIT_SHA,
			maxAttempts: 1,
			retryDelayMs: 0,
			fetchImpl,
		});

		expect(requestedPaths).toEqual(expect.arrayContaining([
			'HEAD:/gallery/',
			'HEAD:/gallery/skills/demo/',
			'HEAD:/gallery/generated/previews/demo-640.webp',
			'HEAD:/gallery/downloads/demo.zip',
		]));
	});

	test('rejects a stale deployment even when all requests return successfully', async () => {
		const catalogContent = `${JSON.stringify(catalog)}\n`;
		const marker = {
			version: 1,
			commitSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
			skillCount: 1,
			generatedAt: catalog.generatedAt,
			catalogSha256: createHash('sha256').update(catalogContent).digest('hex'),
		};
		const fetchImpl = async (request, options) => {
			const pathname = new URL(request).pathname;
			if (options.method === 'HEAD') return new Response(null, { status: 200 });
			if (pathname.endsWith('/deployment.json')) return Response.json(marker);
			return new Response(catalogContent, { status: 200 });
		};

		await expect(verifyDeployment({
			siteUrl: 'https://example.com/gallery/',
			expectedCommitSha: COMMIT_SHA,
			maxAttempts: 1,
			retryDelayMs: 0,
			fetchImpl,
		})).rejects.toThrow(`Deployed commit ${marker.commitSha} does not match ${COMMIT_SHA}`);
	});
});