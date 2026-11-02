import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('roadmap tooltip keeps escaped source markup inert and preserves line breaks', async ({ page }) => {
	await page.route('**/*', (route) => route.abort());
	const template = await readFile(
		new URL('../../../Skills/roadmap-timeline/roadmap-timeline/assets/roadmap-timeline-template.html', import.meta.url),
		'utf8',
	);
	const example = template.match(/Example:\s*([\s\S]*?)\n\s*2\. PALETTE SWITCHER/);
	if (!example) throw new Error('Roadmap tooltip example was not found');
	const styles = template.match(/<style>([\s\S]*?)<\/style>/);
	if (!styles) throw new Error('Roadmap tooltip styles were not found');

	await page.setContent(`<style>${styles[1]}</style>
		<div class="phase-block" title="&lt;img src=x onerror=&quot;window.tooltipInjected=true&quot;&gt; · Owner: A &amp; B">Phase</div>
		<div class="rdm-tooltip" id="rdm-tooltip"></div>`);
	await page.addScriptTag({ content: example[1] });
	await page.locator('.phase-block').evaluate((element) =>
		element.dispatchEvent(new MouseEvent('mouseenter', { clientX: 30, clientY: 40 })),
	);

	const tooltip = page.locator('#rdm-tooltip');
	await expect(tooltip).toHaveText('<img src=x onerror="window.tooltipInjected=true"> \n Owner: A & B');
	await expect(tooltip.locator('img')).toHaveCount(0);
	expect(await page.evaluate(() => Object.hasOwn(window, 'tooltipInjected'))).toBe(false);
	await expect(tooltip).toHaveCSS('white-space', 'pre-line');
	await expect(tooltip).toHaveCSS('left', '42px');
	await page.locator('.phase-block').dispatchEvent('mouseleave');
	await expect(tooltip).toHaveCSS('opacity', '0');
});
