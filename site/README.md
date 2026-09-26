# SharePoint Skills gallery

Static Astro gallery published at `https://pnp.github.io/sharepoint-skills/`.

## Data flow

`npm run generate` reads each `Skills/<slug>/assets/sample.json`, outer `README.md`, preview, and inner package. It validates the metadata schemas, sanitizes authored Markdown, generates responsive previews, and creates deterministic ZIP downloads with SHA-256 checksums.

Generated files are deliberately ignored by Git:

- `src/generated/catalog.json` supplies build-time page content.
- `public/catalog.json` is the versioned public feed.
- `public/generated/previews/` contains responsive WebP previews.
- `public/downloads/` contains upload-ready skill packages.

No contributed skill scripts are executed during generation.

## Commands

Run commands from `site/`:

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the locked dependencies. |
| `npm run dev` | Generate content and start Astro locally. |
| `npm test` | Run gallery model and package tests. |
| `npm run check` | Generate content and type-check Astro. |
| `npm run build` | Generate the complete static Pages artifact. |
| `npm run test:e2e` | Test an existing build in desktop and mobile Chromium. |
| `npm run test:all` | Run the complete local quality suite. |

The configured local URL is `http://localhost:4321/sharepoint-skills/` because development uses the same base path as GitHub Pages.

## Visual assets

The PnP key art, side backgrounds, logo, and Parker display fonts are vendored from [`pnp/pnp-hugo-theme`](https://github.com/pnp/pnp-hugo-theme) at commit `2ac965322285648b85ed7f9d62abafdfe807c959`. That project is MIT licensed. Vendoring keeps the gallery independent of runtime asset availability.

## Deployment

Pull requests run repository validation, unit tests, type checks, a production build, and desktop/mobile browser and accessibility checks. Pushes to `main` repeat those checks and deploy `dist/` through GitHub Pages with no runtime service or secret.
