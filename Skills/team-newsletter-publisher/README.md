# Team Newsletter Publisher

Turns a filled Team Newsletter Word file (.docx created from the Team Newsletter Word template) into a finished, designed newsletter as a PDF and/or a single self-contained HTML page. Content comes only from the Word file; the fixed layout and styling come from the template bundled with the skill.

![preview](./assets/preview.png)

## What you get

- A self-contained HTML newsletter (inline CSS, embedded hero image, no external scripts or fonts) named `Team-Newsletter-<Month>-<Year>.html`
- An A4 portrait PDF with the same layout and a running footer, named `Team-Newsletter-<Month>-<Year>.pdf`
- Fixed section order: Featured story, Latest news, Upcoming events, Team spotlight, Quick tips, and a call for contributions
- Text copied exactly from the Word file — nothing rewritten, summarised or invented
- Empty slots removed cleanly (cards, rows, sections), with sections and the contents strip renumbered
- A short report of the files created, hidden empty fields, and anything unusual in the source

## When to use

Ask Copilot:

- *"turn this newsletter Word file into a PDF"*
- *"publish the team newsletter"*
- *"make the newsletter HTML"*
- *"convert the newsletter doc"*

[Download the Word template](./Team-Newsletter-Template.docx) (`Team-Newsletter-Template.docx`) to create your newsletter files.

Select a .docx created from the Team Newsletter template first. The skill is not meant for writing newsletter content from scratch or for other document types.

## Package contents

The upload-ready package is `team-newsletter-publisher/`:

- `SKILL.md` — instructions
- `field-mapping.md` — field-to-layout mapping, styling, length guidance, empty-field rules and checklist
- `newsletter-template.html` — the design master with `{{Field}}` placeholders

The Word template, `Team-Newsletter-Template.docx`, sits next to this README and is not part of the package. Do not upload it with the skill; its `{{Field}}` names match `field-mapping.md`.

## Demo content

An example output with fictional content is in [`demo/sample-files/`](./demo/sample-files/). Do not upload `demo/` with the skill package.

## SharePoint Skill

| Solution | Author(s) |
| --- | --- |
| team-newsletter-publisher | Anand Ragavan &#124; [GitHub](https://github.com/anandragav) &#124; [LinkedIn](https://www.linkedin.com/in/anand-v-89443012/) |

## Version history

| Version | Date | Comments |
| --- | --- | --- |
| 1.0 | October 2026 | Initial Release |
| 1.1 | October 2026 | Added the Team Newsletter Word template |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

<img src="https://m365-visitor-stats.azurewebsites.net/sharepoint-skills/skills/team-newsletter-publisher" />
