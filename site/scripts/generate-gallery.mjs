import path from 'node:path';
import { generateGallery } from './gallery-model.mjs';

const siteRoot = path.resolve(import.meta.dirname, '..');
const repositoryRoot = path.resolve(siteRoot, '..');

try {
	const result = await generateGallery({ repositoryRoot, siteRoot });
	console.log(
		`Generated ${result.skillCount} skills across ${result.categoryCount} categories (${result.packageBytes.toLocaleString('en-US')} package bytes).`,
	);
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
}