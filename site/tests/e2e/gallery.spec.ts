import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('filters the catalog and preserves the query in the URL', async ({ page, request }) => {
	const catalogResponse = await request.get('catalog.json');
	expect(catalogResponse.ok()).toBeTruthy();
	const catalog = (await catalogResponse.json()) as { skills: Array<{ category: string }> };
	const documentManagementCount = catalog.skills.filter(
		(skill) => skill.category === 'Document Management',
	).length;

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
	await expect(page.locator('#result-count')).toContainText(`${documentManagementCount} matching skills`);
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

	await page.goto('./');
	await expect(page.locator('.catalog-stat strong')).toHaveText(String(catalog.skills.length));
	await expect(page.locator('[data-skill-card]')).toHaveCount(catalog.skills.length);

	const contributionCounts = new Map<string, number>();
	for (const skill of catalog.skills) {
		for (const author of skill.authors) {
			const account = author.gitHubAccount.toLocaleLowerCase('en-US');
			contributionCounts.set(account, (contributionCounts.get(account) ?? 0) + 1);
		}
	}

	await page.goto('contributors/');
	await expect(page.locator('.page-heading')).toContainText(`${contributionCounts.size} people`);
	await expect(page.locator('.contributor-card')).toHaveCount(contributionCounts.size);
	for (const [account, count] of contributionCounts) {
		const contributor = page.locator('.contributor-card').filter({
			has: page.getByRole('link', { name: `@${account}`, exact: false }),
		});
		await expect(contributor.locator('.contribution-count')).toHaveText(`${count} ${count === 1 ? 'skill' : 'skills'}`);
	}
});

test('presents the SharePoint product story and contributor recognition', async ({ page }) => {
	await page.goto('./');
	await expect(page.locator('.brand img')).toHaveAttribute('src', '/sharepoint-skills/images/SharePoint_512.png');
	await expect(page.locator('.copilot-story__mark')).toHaveAttribute('src', '/sharepoint-skills/images/copilot.png');
	await expect(page.getByRole('heading', { name: 'Turn shared expertise into repeatable help' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Copilot adoption guidance' })).toHaveAttribute('href', 'https://aka.ms/CopilotinSP');
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