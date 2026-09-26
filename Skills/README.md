# Skills

AI skills are instruction files that give a Copilot agent a focused capability. Each skill lives in its own folder and is installed by uploading that folder to the **Skills** library in SharePoint.

Some skills also include a `demo/` subfolder containing sample content you can use to try the skill end-to-end (e.g., [`library-cleanup/demo/`](./library-cleanup/demo/)). Each skill folder now contains an upload-ready inner package folder with the same name (for example, `file-classifier/file-classifier/`). Keep sample/demo material outside that inner package.

## Quick links

- **Install:** [Installing a Skill](#installing-a-skill)
- **Troubleshoot:** [Troubleshooting guide](./TROUBLESHOOTING.md) — if the agent doesn't recognize your skill
- **Contribute:** [Contribution guide](../CONTRIBUTING.md) — skill folder structure, required files, file templates, and the pre-submission checklist

---

## Installing a Skill

Skills follow the [agentskills.io specification](https://agentskills.io/specification). The `Skills/` library in SharePoint is created automatically — install by uploading the skill folder into it.

1. Download the skill folder (e.g., `file-classifier/`)
2. In your SharePoint site, open the **Agent Assets** library
3. Navigate into the **Skills** folder (auto-created)
4. Open the matching inner package folder (e.g., `file-classifier/file-classifier/`) and upload that folder — the agent discovers it by the `name` field in `SKILL.md`

## Contributing

Want to add a skill? See the full **[Contribution guide](../CONTRIBUTING.md)** in the repository root — it covers the skill folder structure, naming conventions, required files, file templates (`SKILL.md`, `README.md`, `sample.json`), and the pre-submission checklist.

