# Contributing to SharePoint Skills

Contributions and corrections are welcome! This guide covers everything you need to build a skill folder and what to include in it.

Use the [GitHub issue forms](https://github.com/pnp/sharepoint-skills/issues/new/choose) to report a reproducible problem or propose a focused user story. Pull requests include a short template for affected folders, verification, and screenshots when relevant.

By participating, you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md). Report suspected security concerns according to the [Security Policy](./SECURITY.md), and never include credentials or real tenant, customer, or personal data in issues, pull requests, demos, or samples.

## Contribution workflow

1. Fork the repo and create a branch: `git checkout -b skill/your-skill-name`
2. Add your skill folder under `Skills/<skill-name>/` and put runtime skill files in `Skills/<skill-name>/<skill-name>/` (the upload-ready package)
3. Follow the standards below — required files, naming conventions, file templates, and the pre-submission checklist
4. Open a pull request with a short description of what the skill does

---

## Creating a Skill

A skill is a folder containing docs, samples, and an upload-ready inner package. The outer folder lives directly under `Skills/`, and the inner package folder must have the same name as the outer folder.

### Where it goes

**In this repo:** `Skills/<skill-name>/<skill-name>/SKILL.md`

**In SharePoint:** upload `Skills/<skill-name>/<skill-name>/` as the package folder. Keep `README.md`, `assets/`, and `demo/` in the outer folder for repo documentation and samples.

### Naming convention

- Folder name: **kebab-case** — lowercase, dash-separated (`organize-library`, not `OrganizeLibrary` or `organize_library`)
- The folder name must match the `name` field in `SKILL.md` exactly
- Be specific — avoid generic names like `tool`, `helper`, `processor`

### Required files

| File | Purpose |
| --- | --- |
| `<skill-name>/SKILL.md` | Skill instructions with `name` and `description` frontmatter (inside the upload-ready inner package) |
| `README.md` | Description, preview image, "What you get", SharePoint Skill credits, version history, and disclaimer |
| `assets/sample.json` | Metadata for the [community samples gallery](https://aka.ms/community/home) |
| `assets/preview.png` | Screenshot of the skill's output for the readme and samples gallery (1280×720, 16:9, PNG) |

If your skill needs extra runtime files (for example, persona reference documents), keep those files beside `SKILL.md` inside the inner package folder.

### Optional — demo content

If your skill benefits from a hands-on demo, add a `demo/` subfolder. Include a `README.md` with setup steps and a `sample-files/` folder with the content. Keep demo content in the outer folder, not in the inner upload package.

---

## File templates

### `SKILL.md`

```markdown
---
name: summarize-page
description: Summarizes a SharePoint page in 3 bullet points.
  Use when the user asks for a quick summary of a page.
---

# Summarize Page

## Instructions

1. Read the full content of the specified page.
2. Identify the 3 most important points.
3. Return a bulleted summary, each bullet no longer than one sentence.
```

### `README.md`

```markdown
# Summarize Page

Short description of what the skill does and when to use it.

![preview](./assets/preview.png)

## What you get

- Bullet list of outputs and outcomes

## SharePoint Skill

| Solution | Author(s) |
| --- | --- |
| summarize-page | Your Name &#124; [GitHub](https://github.com/your-handle) &#124; [LinkedIn](https://www.linkedin.com/in/your-handle/) |

## Version history

| Version | Date | Comments |
| --- | --- | --- |
| 1.0 | Month YYYY | Initial Release |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

<img src="https://m365-visitor-stats.azurewebsites.net/sharepoint-skills/skills/summarize-page" />
```

### `assets/sample.json`

```json
[
  {
    "name": "pnp-sharepoint-skills-summarize-page",
    "source": "pnp",
    "title": "Summarize Page",
    "shortDescription": "Summarizes a SharePoint page in 3 bullet points.",
    "url": "https://github.com/pnp/sharepoint-skills/tree/main/Skills/summarize-page",
    "longDescription": [
      "Longer description spanning one or more paragraphs.",
      "Each array entry is rendered as a separate paragraph in the gallery."
    ],
    "creationDateTime": "2026-05-07",
    "updateDateTime": "2026-05-07",
    "products": [
      "SharePoint",
      "Microsoft 365 Copilot"
    ],
    "metadata": [
      { "key": "SAMPLE-TYPE", "value": "SharePoint-AI-Skill" },
      { "key": "SKILL-CATEGORY", "value": "Document Management" }
    ],
    "thumbnails": [
      {
        "type": "image",
        "order": 100,
        "url": "https://github.com/pnp/sharepoint-skills/raw/main/Skills/summarize-page/assets/preview.png",
        "alt": "Summarize Page skill in action"
      }
    ],
    "authors": [
      {
        "gitHubAccount": "your-handle",
        "pictureUrl": "https://github.com/your-handle.png",
        "name": "Your Name"
      }
    ],
    "references": [
      {
        "name": "agentskills.io specification",
        "description": "The specification that SharePoint AI skills follow for installation and discovery.",
        "url": "https://agentskills.io/specification"
      }
    ]
  }
]
```

---

## Pre-submission checklist

When you open or update a pull request, the `Validate skills` workflow automatically checks package structure, metadata, README content, demo content, and preview images. Review and address any findings reported by that check; no local validator setup is required.

Before opening your pull request, verify:

- [ ] Skill folder is directly under `Skills/` (`Skills/<skill-name>/`)
- [ ] Upload-ready inner package exists at `Skills/<skill-name>/<skill-name>/`
- [ ] Folder name uses kebab-case and matches the `name` field in `SKILL.md` exactly
- [ ] `SKILL.md` has `name` and `description` in the frontmatter and is in the inner package folder
- [ ] `README.md` follows the template (description, preview image, "What you get", `SharePoint Skill` credits table, `Version history`, `Disclaimer`, and visitor-stats image)
- [ ] `assets/sample.json` exists with the `url` and `thumbnails[0].url` pointing to your skill's actual path
- [ ] `assets/preview.png` is a 1280×720 PNG and shows the skill's actual output (not a logo or placeholder)
- [ ] Skills work best when they are **focused** (one capability), **self-contained** (no external dependencies), and **discoverable** (clear `description` with trigger phrases)

---

## Community recognition

All contributors on this repository will be acknowledged with a special [SharePoint Skills Credly badge](https://www.credly.com/org/m365pnp/badge/sharepoint-skills-microsoft-365-power-platform-comm).

![SharePoint Skills Credly Badge](./assets/sharepoint-skills-badge.png)

Notice that you'll need to register to the community contribution program once if you have not done that yet. See more from our [Community Recognition Program](https://aka.ms/community/recognition).
