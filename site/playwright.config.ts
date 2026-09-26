import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'line',
	use: {
		baseURL: 'http://127.0.0.1:4321/sharepoint-skills/',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
	},
	webServer: {
		command: 'npm run preview -- --host 127.0.0.1 --port 4321',
		url: 'http://127.0.0.1:4321/sharepoint-skills/',
		reuseExistingServer: !process.env.CI,
	},
	projects: [
		{ name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
	],
});