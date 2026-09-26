import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import JSZip from 'jszip';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import sharp from 'sharp';

const FIXED_ZIP_DATE = new Date('2020-01-01T00:00:00.000Z');
const REPOSITORY_URL = 'https://github.com/pnp/sharepoint-skills';

function assert(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

function isExternalTarget(target) {
	return /^(?:[a-z]+:|#)/i.test(target);
}

function repositoryTarget(slug, target, raw) {
	if (isExternalTarget(target)) {
		return target;
	}

	const [fileTarget, fragment = ''] = target.split('#', 2);
	const repositoryPath = path.posix.normalize(
		path.posix.join('Skills', slug, fileTarget.replaceAll('\\', '/')),
	);
	assert(
		repositoryPath === 'Skills' || repositoryPath.startsWith('Skills/'),
		`Unsafe README link in ${slug}: ${target}`,
	);
	const encodedPath = repositoryPath.split('/').map(encodeURIComponent).join('/');
	const base = raw
		? 'https://raw.githubusercontent.com/pnp/sharepoint-skills/main'
		: `${REPOSITORY_URL}/blob/main`;
	return `${base}/${encodedPath}${fragment ? `#${fragment}` : ''}`;
}

function renderReadme(slug, markdown) {
	const withoutDuplicateHeader = markdown
		.replace(/^# .+\r?\n/, '')
		.replace(/^!\[[^\]]*\]\(\.\/assets\/preview\.png\)\s*$/im, '')
		.replace(/<img[^>]+m365-visitor-stats[^>]*\/?>(?:\s*)/gi, '');
	const linkedMarkdown = withoutDuplicateHeader.replace(
		/(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
		(_match, imageMarker, label, target) =>
			`${imageMarker}[${label}](${repositoryTarget(slug, target, imageMarker === '!')})`,
	);
	const rendered = marked.parse(linkedMarkdown, { gfm: true });

	return sanitizeHtml(rendered, {
		allowedTags: [
			...sanitizeHtml.defaults.allowedTags,
			'img',
			'h1',
			'h2',
			'h3',
			'h4',
			'table',
			'thead',
			'tbody',
			'tr',
			'th',
			'td',
		],
		allowedAttributes: {
			a: ['href', 'title'],
			img: ['src', 'alt', 'title', 'width', 'height'],
			code: ['class'],
		},
		allowedSchemes: ['http', 'https', 'mailto'],
		transformTags: {
			a: (_tagName, attributes) => {
				const external = attributes.href?.startsWith('http');
				return {
					tagName: 'a',
					attribs: external
						? { ...attributes, target: '_blank', rel: 'noopener noreferrer' }
						: attributes,
				};
			},
		},
	});
}

async function packageFiles(packageRoot) {
	const files = [];

	async function visit(directory) {
		for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
			a.name.localeCompare(b.name),
		)) {
			const absolutePath = path.join(directory, entry.name);
			const stat = await lstat(absolutePath);
			assert(!stat.isSymbolicLink(), `Package contains a symbolic link: ${absolutePath}`);
			if (entry.isDirectory()) {
				await visit(absolutePath);
			} else if (entry.isFile()) {
				files.push({
					absolutePath,
					relativePath: path.relative(packageRoot, absolutePath).replaceAll('\\', '/'),
				});
			}
		}
	}

	await visit(packageRoot);
	return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

export async function createDeterministicZip(slug, packageRoot) {
	const zip = new JSZip();
	const files = await packageFiles(packageRoot);
	assert(files.length > 0, `Package is empty: ${slug}`);

	for (const file of files) {
		zip.file(`${slug}/${file.relativePath}`, await readFile(file.absolutePath), {
			createFolders: false,
			date: FIXED_ZIP_DATE,
			unixPermissions: 0o100644,
		});
	}

	return zip.generateAsync({
		type: 'nodebuffer',
		platform: 'UNIX',
		compression: 'DEFLATE',
		compressionOptions: { level: 9 },
	});
}

export function normalizeSample(slug, sample, readmeMarkdown, skillMarkdown, packageInfo) {
	assert(sample && typeof sample === 'object', `Missing sample metadata for ${slug}`);
	assert(typeof sample.title === 'string', `Missing title for ${slug}`);
	assert(Array.isArray(sample.authors) && sample.authors.length > 0, `Missing authors for ${slug}`);
	const category = sample.metadata?.find((item) => item.key === 'SKILL-CATEGORY')?.value;
	assert(category, `Missing SKILL-CATEGORY for ${slug}`);
	const status = sample.metadata?.find((item) => item.key === 'SKILL-STATUS')?.value ?? 'stable';
	const thumbnail = [...(sample.thumbnails ?? [])].sort((a, b) => a.order - b.order)[0];

	return {
		slug,
		name: sample.name,
		title: sample.title,
		shortDescription: sample.shortDescription,
		longDescription: sample.longDescription ?? [],
		createdAt: sample.creationDateTime,
		updatedAt: sample.updateDateTime,
		category,
		status,
		products: sample.products ?? [],
		authors: sample.authors,
		references: sample.references ?? [],
		sourceUrl: sample.url,
		preview: {
			alt: thumbnail?.alt ?? `${sample.title} preview`,
			width: 1280,
			height: 720,
			src640: `/generated/previews/${slug}-640.webp`,
			src960: `/generated/previews/${slug}-960.webp`,
		},
		package: packageInfo,
		readmeHtml: renderReadme(slug, readmeMarkdown),
		skillMarkdown,
		searchText: [
			slug,
			sample.title,
			sample.shortDescription,
			...(sample.longDescription ?? []),
			category,
			...(sample.products ?? []),
			...sample.authors.flatMap((author) => [author.name, author.gitHubAccount]),
		]
			.filter(Boolean)
			.join(' ')
			.toLocaleLowerCase('en-US'),
	};
}

function publicRecord(skill) {
	const { readmeHtml: _readmeHtml, skillMarkdown: _skillMarkdown, searchText: _searchText, ...record } =
		skill;
	return record;
}

export async function generateGallery({ repositoryRoot, siteRoot }) {
	const skillsRoot = path.join(repositoryRoot, 'Skills');
	const schemaRoot = path.join(repositoryRoot, '.github', 'schemas');
	const generatedRoot = path.join(siteRoot, 'src', 'generated');
	const publicRoot = path.join(siteRoot, 'public');
	const previewRoot = path.join(publicRoot, 'generated', 'previews');
	const downloadRoot = path.join(publicRoot, 'downloads');

	await Promise.all([
		rm(generatedRoot, { recursive: true, force: true }),
		rm(path.join(publicRoot, 'generated'), { recursive: true, force: true }),
		rm(downloadRoot, { recursive: true, force: true }),
	]);
	await Promise.all([
		mkdir(generatedRoot, { recursive: true }),
		mkdir(previewRoot, { recursive: true }),
		mkdir(downloadRoot, { recursive: true }),
	]);

	const directoryEntries = await readdir(skillsRoot, { withFileTypes: true });
	const slugs = directoryEntries
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort((left, right) => left.localeCompare(right));
	const skills = [];
	const ajv = new Ajv2020({ allErrors: true });
	addFormats(ajv);
	const validateSample = ajv.compile(JSON.parse(await readFile(path.join(schemaRoot, 'sample.schema.json'), 'utf8')));
	const validateCatalog = ajv.compile(JSON.parse(await readFile(path.join(schemaRoot, 'catalog.schema.json'), 'utf8')));

	for (const slug of slugs) {
		const skillRoot = path.join(skillsRoot, slug);
		const samplePath = path.join(skillRoot, 'assets', 'sample.json');
		let sampleDocument;
		try {
			sampleDocument = JSON.parse(await readFile(samplePath, 'utf8'));
		} catch (error) {
			if (error.code === 'ENOENT') {
				continue;
			}
			throw error;
		}
		assert(
			validateSample(sampleDocument),
			`${slug} sample.json failed schema validation: ${ajv.errorsText(validateSample.errors)}`,
		);

		const packageRoot = path.join(skillRoot, slug);
		const zipBuffer = await createDeterministicZip(slug, packageRoot);
		const packageInfo = {
			url: `/downloads/${slug}.zip`,
			bytes: zipBuffer.length,
			sha256: createHash('sha256').update(zipBuffer).digest('hex'),
		};
		await writeFile(path.join(downloadRoot, `${slug}.zip`), zipBuffer);

		const sourcePreview = path.join(skillRoot, 'assets', 'preview.png');
		await Promise.all([
			sharp(sourcePreview)
				.resize({ width: 640, withoutEnlargement: true })
				.webp({ quality: 78 })
				.toFile(path.join(previewRoot, `${slug}-640.webp`)),
			sharp(sourcePreview)
				.resize({ width: 960, withoutEnlargement: true })
				.webp({ quality: 82 })
				.toFile(path.join(previewRoot, `${slug}-960.webp`)),
		]);

		skills.push(
			normalizeSample(
				slug,
				sampleDocument[0],
				await readFile(path.join(skillRoot, 'README.md'), 'utf8'),
				await readFile(path.join(packageRoot, 'SKILL.md'), 'utf8'),
				packageInfo,
			),
		);
	}

	const categories = [...new Set(skills.map((skill) => skill.category))].sort((left, right) =>
		left.localeCompare(right),
	);
	const products = [...new Set(skills.flatMap((skill) => skill.products))].sort((left, right) =>
		left.localeCompare(right),
	);
	const generatedAt = `${skills.reduce(
		(latest, skill) => skill.updatedAt.localeCompare(latest) > 0 ? skill.updatedAt : latest,
		'1970-01-01',
	)}T00:00:00.000Z`;
	const internalCatalog = { version: 1, generatedAt, skills, categories, products };
	const publicCatalog = { version: 1, generatedAt, skills: skills.map(publicRecord), categories, products };
	assert(
		validateCatalog(publicCatalog),
		`Generated catalog failed schema validation: ${ajv.errorsText(validateCatalog.errors)}`,
	);

	await Promise.all([
		writeFile(path.join(generatedRoot, 'catalog.json'), `${JSON.stringify(internalCatalog, null, 2)}\n`),
		writeFile(path.join(publicRoot, 'catalog.json'), `${JSON.stringify(publicCatalog, null, 2)}\n`),
	]);

	return {
		skillCount: skills.length,
		categoryCount: categories.length,
		packageBytes: skills.reduce((total, skill) => total + skill.package.bytes, 0),
	};
}