# Jul Escape Room Dashboard

Builds or repairs the Jul Escape Room SharePoint list game from a saved HTML template: a playable HTML list view plus a standalone HTML file that stay in sync with the same content list.

![preview](./assets/preview.png)

## What you get

- A canonical single-file HTML game template with inline CSS and SVG, system fonts only, and no external assets or network calls
- A startup prompt that creates the content list, seeds the six puzzles, and builds both playable copies
- Operating rules that keep the list as the source of live puzzle content and the saved template as the visual and interaction specification
- Default names you can override: list `Jul Escape Room Content`, view `Jul Escape Room`, document library `Reports`, and standalone file `Jul Escape Room - Play.html`
- Safe data-binding rules so list values are rendered as text, player progress is never written back to SharePoint, and both game copies stay synchronized
- Preflight and honest test-reporting rules for template fidelity, script checks, and browser behavior

## Video walkthrough

[![How I Built an Escape Room Game from a SharePoint List with Copilot](https://img.youtube.com/vi/6c3yeMb44wY/maxresdefault.jpg)](https://youtu.be/6c3yeMb44wY)

[Part 1: How I Built an Escape Room Game from a SharePoint List with Copilot](https://youtu.be/6c3yeMb44wY)

[![Copilot in SharePoint Prompt to Build an Escape Room Game](https://img.youtube.com/vi/ihUqhvoDoqs/maxresdefault.jpg)](https://youtu.be/ihUqhvoDoqs)

[Part 2: Copilot in SharePoint Prompt to Build an Escape Room Game](https://youtu.be/ihUqhvoDoqs) · [Listen on Spotify](https://open.spotify.com/episode/49NBCVhUM9xwX0FgLCuxC8)

## How to use

1. Upload only the inner `jul-escape-room-dashboard/` package folder (the one that contains `SKILL.md`, `references/`, and `templates/`) to a SharePoint location your agents can read, such as the site's Agent Assets › Skills folder. The uploaded folder name must match the `name` in `SKILL.md`.
2. Do not upload this README, `assets/`, or the outer repository folder as runtime skill content.
3. In Copilot on the target SharePoint site, ask to create or repair the Jul Escape Room using this skill.
4. Confirm the target site, and optionally override the default list, view, library, and standalone filename.

A public playable demo of the game is at [https://anandragav.github.io/copilot-html-dashboards/jul-escape-room/](https://anandragav.github.io/copilot-html-dashboards/jul-escape-room/).

## SharePoint Skill

| Solution | Author(s) |
| --- | --- |
| jul-escape-room-dashboard | Anand Vijayaragavan &#124; [GitHub](https://github.com/anandragav) &#124; [LinkedIn](https://www.linkedin.com/in/anand-vijayaragavan-89443012/) |

## Version history

| Version | Date | Comments |
| --- | --- | --- |
| 1.0 | November 2026 | Initial Release |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

<img src="https://m365-visitor-stats.azurewebsites.net/sharepoint-skills/skills/jul-escape-room-dashboard" />
