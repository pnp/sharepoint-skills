import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('filters the catalog and preserves the query in the URL', async ({ page }) => {
	await page.goto('./');
	await expect(page.getByRole('heading', { level: 1, name: 'SharePoint Skills' })).toBeVisible();
	await expect(page.locator('[data-skill-card]:visible')).toHaveCount(18);
	const filters = page.locator('.filters');
	if (!(await filters.evaluate((element: HTMLDetailsElement) => element.open))) {
		await filters.getByText('Filters', { exact: true }).click();
	}

	await page.getByRole('searchbox', { name: 'Search' }).fill('Analyze Document Library');
	await expect(page.getByRole('link', { name: 'Analyze Document Library' })).toBeVisible();
	await expect(page.locator('#result-count')).toContainText('1 matching skill');
	await expect(page).toHaveURL(/q=Analyze(?:\+|%20)Document(?:\+|%20)Library/);

	await page.getByRole('button', { name: 'Clear all' }).click();
	await page.locator('#category-filter').selectOption('Document Management');
	await expect(page.locator('#result-count')).toContainText('12 matching skills');
});

test('renders a generated skill page, package, and public catalog', async ({ page, request }) => {
	await page.goto('skills/analyze-document-library/');
	await expect(page.getByRole('heading', { level: 1, name: 'Analyze Document Library' })).toBeVisible();
	const download = page.getByRole('link', { name: /Download skill/i }).first();
	await expect(download).toHaveAttribute('href', '/sharepoint-skills/downloads/analyze-document-library.zip');
	await expect(page.getByText(/^[a-f0-9]{64}$/)).toBeVisible();

	const catalogResponse = await request.get('catalog.json');
	expect(catalogResponse.ok()).toBeTruthy();
	const catalog = await catalogResponse.json();
	expect(catalog.version).toBe(1);
	expect(catalog.skills).toHaveLength(47);
});

test('presents the SharePoint product story and contributor recognition', async ({ page }) => {
	await page.goto('./');
	await expect(page.locator('.brand img')).toHaveAttribute('src', '/sharepoint-skills/images/SharePoint_512.png');
	await expect(page.locator('.copilot-story__mark')).toHaveAttribute('src', '/sharepoint-skills/images/copilot.png');
	await expect(page.getByRole('heading', { name: 'Turn shared expertise into repeatable help' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Explore all community samples' })).toHaveAttribute('href', 'https://aka.ms/community/samples');
	await expect(page.getByRole('link', { name: 'Visit Community Home' })).toHaveAttribute('href', 'https://aka.ms/community/home');

	await page.goto('contributors/');
	await expect(page.getByRole('heading', { name: 'Share your skill. Earn the badge.' })).toBeVisible();
	await expect(page.getByAltText('SharePoint Skills 2026 community contributor badge')).toHaveAttribute(
		'src',
		'/sharepoint-skills/images/sharepoint-skills-badge.png',
	);
	await expect(page.getByRole('link', { name: 'Register for recognition' })).toHaveAttribute(
		'href',
		'https://aka.ms/community/recognition',
	);
});

test('has no automatically detectable accessibility violations', async ({ page }) => {
	await page.goto('./');
	const homeResults = await new AxeBuilder({ page }).analyze();
	expect(homeResults.violations).toEqual([]);

	await page.goto('skills/analyze-document-library/');
	const detailResults = await new AxeBuilder({ page }).analyze();
	expect(detailResults.violations).toEqual([]);
});