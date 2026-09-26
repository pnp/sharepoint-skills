import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/i;

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

function catalogHash(content) {
	return createHash('sha256').update(content).digest('hex');
}

function siteBaseUrl(siteUrl) {
	const baseUrl = new URL(siteUrl);
	if (!baseUrl.pathname.endsWith('/')) baseUrl.pathname += '/';
	return baseUrl;
}

function siteUrl(baseUrl, target) {
	return new URL(target.replace(/^\/+/, ''), baseUrl);
}

function cacheBusted(url, expectedCommitSha, attempt) {
	const requestUrl = new URL(url);
	requestUrl.searchParams.set('deployment', `${expectedCommitSha.slice(0, 12)}-${attempt}-${Date.now()}`);
	return requestUrl;
}

async function checkedFetch(fetchImpl, url, expectedCommitSha, attempt, method = 'GET') {
	const response = await fetchImpl(cacheBusted(url, expectedCommitSha, attempt), {
		method,
		cache: 'no-store',
		headers: { 'cache-control': 'no-cache' },
	});
	assert(response.ok, `${method} ${url} returned ${response.status}`);
	return response;
}

export async function createDeploymentMarker({ distRoot, commitSha }) {
	assert(COMMIT_SHA_PATTERN.test(commitSha), `Invalid deployment commit SHA: ${commitSha}`);
	const catalogContent = await readFile(path.join(distRoot, 'catalog.json'));
	const catalog = JSON.parse(catalogContent.toString('utf8'));
	assert(Array.isArray(catalog.skills), 'Built catalog does not contain a skills array');

	const marker = {
		version: 1,
		commitSha: commitSha.toLowerCase(),
		catalogSha256: catalogHash(catalogContent),
		skillCount: catalog.skills.length,
		generatedAt: catalog.generatedAt,
	};
	await writeFile(path.join(distRoot, 'deployment.json'), `${JSON.stringify(marker, null, 2)}\n`);
	return marker;
}

async function verifyAttempt({ siteUrl: deployedSiteUrl, expectedCommitSha, attempt, fetchImpl }) {
	const baseUrl = siteBaseUrl(deployedSiteUrl);
	const markerResponse = await checkedFetch(
		fetchImpl,
		siteUrl(baseUrl, 'deployment.json'),
		expectedCommitSha,
		attempt,
	);
	const marker = await markerResponse.json();
	assert(marker.version === 1, `Unsupported deployment marker version: ${marker.version}`);
	assert(
		marker.commitSha === expectedCommitSha.toLowerCase(),
		`Deployed commit ${marker.commitSha ?? 'unknown'} does not match ${expectedCommitSha}`,
	);

	const catalogResponse = await checkedFetch(
		fetchImpl,
		siteUrl(baseUrl, 'catalog.json'),
		expectedCommitSha,
		attempt,
	);
	const catalogContent = await catalogResponse.text();
	assert(catalogHash(catalogContent) === marker.catalogSha256, 'Deployed catalog hash does not match the build marker');
	const catalog = JSON.parse(catalogContent);
	assert(catalog.skills.length === marker.skillCount, 'Deployed catalog count does not match the build marker');
	assert(catalog.generatedAt === marker.generatedAt, 'Deployed catalog timestamp does not match the build marker');

	const targets = [baseUrl];
	for (const skill of catalog.skills) {
		targets.push(siteUrl(baseUrl, `skills/${encodeURIComponent(skill.slug)}/`));
		targets.push(siteUrl(baseUrl, skill.preview.src640));
		targets.push(siteUrl(baseUrl, skill.package.url));
	}
	await Promise.all(
		targets.map((target) => checkedFetch(fetchImpl, target, expectedCommitSha, attempt, 'HEAD')),
	);

	return marker;
}

export async function verifyDeployment({
	siteUrl: deployedSiteUrl,
	expectedCommitSha,
	maxAttempts = 10,
	retryDelayMs = 5_000,
	fetchImpl = globalThis.fetch,
}) {
	assert(deployedSiteUrl, 'SITE_URL is required');
	assert(COMMIT_SHA_PATTERN.test(expectedCommitSha), `Invalid expected commit SHA: ${expectedCommitSha}`);
	assert(maxAttempts > 0, 'maxAttempts must be greater than zero');

	let lastError;
	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			const marker = await verifyAttempt({
				siteUrl: deployedSiteUrl,
				expectedCommitSha,
				attempt,
				fetchImpl,
			});
			console.log(`Verified ${marker.skillCount} skills from deployment ${marker.commitSha}`);
			return marker;
		} catch (error) {
			lastError = error;
			console.warn(`Deployment verification attempt ${attempt}/${maxAttempts} failed: ${error.message}`);
			if (attempt < maxAttempts) {
				await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
			}
		}
	}

	throw new Error(`Deployment verification failed: ${lastError.message}`);
}

async function run() {
	const command = process.argv[2];
	if (command === 'create') {
		const marker = await createDeploymentMarker({
			distRoot: path.resolve(process.argv[3] ?? 'dist'),
			commitSha: process.env.EXPECTED_COMMIT_SHA ?? '',
		});
		console.log(`Recorded ${marker.skillCount} skills for deployment ${marker.commitSha}`);
		return;
	}
	if (command === 'verify') {
		await verifyDeployment({
			siteUrl: process.env.SITE_URL,
			expectedCommitSha: process.env.EXPECTED_COMMIT_SHA ?? '',
		});
		return;
	}
	throw new Error('Expected command: create or verify');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
	run().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}