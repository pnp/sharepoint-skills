import catalogData from '../generated/catalog.json';

export interface Author {
	gitHubAccount: string;
	pictureUrl: string;
	name: string;
	company?: string;
}

export interface Reference {
	name: string;
	description: string;
	url: string;
}

export interface Skill {
	slug: string;
	name: string;
	title: string;
	shortDescription: string;
	longDescription: string[];
	createdAt: string;
	updatedAt: string;
	category: string;
	status: string;
	products: string[];
	authors: Author[];
	references: Reference[];
	sourceUrl: string;
	preview: {
		alt: string;
		width: number;
		height: number;
		src640: string;
		src960: string;
	};
	package: {
		url: string;
		bytes: number;
		sha256: string;
	};
	readmeHtml: string;
	skillMarkdown: string;
	searchText: string;
}

export interface Catalog {
	version: number;
	generatedAt: string;
	skills: Skill[];
	categories: string[];
	products: string[];
}

export const catalog = catalogData as Catalog;

export function sitePath(value: string) {
	const base = import.meta.env.BASE_URL.replace(/\/$/, '');
	return `${base}${value.startsWith('/') ? value : `/${value}`}`;
}

export function categorySlug(category: string) {
	return category
		.toLocaleLowerCase('en-US')
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

export function formatDate(value: string) {
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(`${value}T00:00:00Z`));
}

export function formatBytes(value: number) {
	if (value < 1024) return `${value} B`;
	return `${(value / 1024).toFixed(value < 10 * 1024 ? 1 : 0)} KB`;
}