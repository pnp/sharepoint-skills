# Troubleshooting: Skills Not Recognized by Copilot

> **Applies to:** SharePoint Copilot agents that don't respond to skill-triggering prompts after you've uploaded a skill.

## Symptom

You uploaded a skill folder to the **Agent Assets → Skills** library, but when you ask the agent to perform the skill's task, it either:
- Says it can't do that
- Suggests a different feature (e.g., Syntex)
- Seems unaware that skills are available

---

## Quick Checks

### 1. Upload location

The skill folder must be uploaded **inside** the `Skills` folder of the **Agent Assets** library — not at the root of Agent Assets, and not in a document library.

| Location | Correct? |
|---|---|
| `Agent Assets/Skills/<skill-name>/<skill-name>/SKILL.md` | ✅ |
| `Agent Assets/<skill-name>/SKILL.md` | ❌ |
| `Shared Documents/<skill-name>/SKILL.md` | ❌ |

**How to verify:** Navigate to your site → **Site contents** → **Agent Assets** library → open the **Skills** folder. You should see a subfolder for each installed skill, containing an inner folder with the same name and a `SKILL.md` file inside.

### 2. Inner package folder

The skill must be inside the **inner package folder** (the folder-within-a-folder pattern). Uploading the outer folder alone will not work.

```
Skills/                                    ← auto-created by SharePoint
  file-classifier/                         ← outer folder (upload this)
    file-classifier/                       ← inner package folder (agent reads this)
      SKILL.md
    README.md
    assets/
```

If the agent can't find the `SKILL.md` file at `Skills/<skill-name>/<skill-name>/SKILL.md`, it will not discover the skill.

### 3. Permissions

Both you and the agent need at least **Read** access to the Agent Assets library. Without it, the agent cannot enumerate or read skills.

**Check:** Can you browse to Agent Assets → Skills and see the skill folder contents? If not, the agent can't either.

### 4. Agent type

Skills work with **SharePoint Copilot** (the agent embedded in SharePoint sites). They do not work with:
- Microsoft 365 Copilot (the side-panel in Teams/Office)
- Copilot Studio standalone agents
- Copilot in other M365 apps (Word, Excel, PowerPoint)

### 5. Delay after upload

After uploading a skill folder, the agent may take **several minutes** to discover it. This is normal — the agent indexes the Skills library asynchronously.

**Wait 5–10 minutes** before testing.

---

## How to Test if a Skill is Loaded

After waiting, ask the agent one of the following (depending on the skill):

- *"What skills can you run?"*
- *"List your available skills"*
- *"What can you help me with in this library?"*

If the skill is loaded, the agent will include it in its response. If not, proceed to the checks below.

---

## Common Issues

### The agent says "I can't run skills" or suggests Syntex

This usually means the skill folder was not uploaded correctly, or the agent hasn't finished indexing.

1. Verify the upload location (Quick Check #1)
2. Verify the inner folder structure (Quick Check #2)
3. Wait 5–10 minutes and try again with a direct trigger phrase from the skill's `description` field

If the agent still doesn't respond, the skill's trigger phrases in its `SKILL.md` frontmatter may not match how you're asking. Try variations:

| Instead of | Try |
|---|---|
| *"Run the file-classifier"* | *"Classify the files in this library"* |
| *"Load the skill"* | *"What's in this document?"* |
| *"Execute the permission report"* | *"Who has access to this folder?"* |

### The skill name doesn't match

The `name` field in `SKILL.md` frontmatter must match the **inner** folder name exactly (kebab-case). A mismatch prevents discovery.

```yaml
# SKILL.md
---
name: file-classifier    # ← must match the inner folder name
description: ...
---
```

### The skill works for one user but not another

The second user may lack Read access to the Agent Assets library, or the skill was uploaded to a different site. Skills are per-site — uploading to Site A does not make them available on Site B.

---

## If Nothing Works

1. **Re-upload the skill** — delete the skill folder from Agent Assets → Skills and upload it again fresh. Wait 10 minutes.
2. **Check the agent version** — skills require a Copilot license on the tenant. Verify with your tenant admin.
3. **Open an issue** — if the skill still isn't recognized after all the steps above, open a [GitHub issue](https://github.com/pnp/sharepoint-skills/issues/new) with:
   - The skill name and version
   - Steps you followed to install
   - Exact response from the agent
   - Screenshots of the Agent Assets → Skills folder structure

---

## Reference

- [agentskills.io specification](https://agentskills.io/specification) — formal skill discovery and loading protocol
- [Skills README](./README.md) — installation instructions
- [CONTRIBUTING.md](../CONTRIBUTING.md) — skill creation guide
