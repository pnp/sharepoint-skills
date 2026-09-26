// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://pnp.github.io',
	base: '/sharepoint-skills',
	trailingSlash: 'always',
	integrations: [sitemap()],
});
