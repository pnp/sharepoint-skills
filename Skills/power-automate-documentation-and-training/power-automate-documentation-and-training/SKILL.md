---
name: power-automate-documentation-and-training
description: "Turns a Power Automate cloud flow export (legacy package .zip, solution .zip, or a definition JSON) into one interactive, hand-drawn training page for SharePoint. The learner clicks + to build the flow step by step, each step draws in with an anchored what / why / how card, quick checks sit on the real guardrails, and a finish screen sums up the lessons with a Chart.js doughnut. The page always keeps the markup, CSS and JavaScript of templates/flow-training-template.html unchanged and replaces only the DATA block and the title, eyebrow and lede text; SharePoint's own page wrapper is fine; never a page or dashboard of your own design. Use when the user attaches a flow export and asks to document a flow, explain a flow, build flow training, or make a practice lab from a flow."
---

# Power Automate documentation and training

Turn someone's own cloud flow into a lesson, not a spec. The structure comes from the export. The teaching layer (why, gotchas, quick checks) comes from a short chat with the user. The output is one SharePoint-ready HTML file built from `templates/flow-training-template.html`.

## When to use

- The user attaches a flow export (`.zip` from Export > Package, a solution `.zip`, or a `definition.json`) and asks to document it, explain it, train people on it, or turn it into a practice lab.

## When not to use

- Desktop flows (Power Automate Desktop). v1 covers cloud flows only.
- Requests to run, import, change, or turn on a flow. This skill only reads the export.
- A plain technical inventory with no teaching. Offer a short Markdown summary instead.

## Hard rules

1. **The page is the template, never your own design.** Build the page from `templates/flow-training-template.html`: keep its own markup, `<style>`, and `<script>` unchanged, and replace only two things: the text between `/*FLOW_DATA_BEGIN*/` and `/*FLOW_DATA_END*/` (one `var DATA={...};`) and the `<title>`, `#ft-eyebrow`, `#ft-title`, and `#ft-lede` text. When SharePoint saves the page, its page-authoring wrapper may add head styles, theme variables, and metadata around the template. That is expected and fine; do not refuse or stop because of it. Never design or write your own HTML, CSS, or JavaScript. Never shorten, simplify, restyle, or "clean up" the template, and never turn it into a dashboard, report, table, or card list. If one save route cannot hold the template's complete markup, styles, and script (for example the Site Pages HTML writer), save it as an `.html` file in the Documents library instead; that route takes the full file. Only if no route works, say so and stop; do not write a different page.
2. **The export is the source of truth for structure.** Never invent, merge, rename away, or drop a step, connector, branch, or loop. A condition with four inner steps is five steps.
3. **Nothing real leaves the chat unmasked.** Tenant and site URLs, personal site paths, emails, list and connection IDs, keys, tokens, and signed URLs are replaced with approved fictional values before any HTML is written. Secrets are redacted, never replaced with look-alike keys.
4. **Do not generate until the user has approved the playback and the masking table.**
5. **Do not invent test evidence.** If the user has no test run to report, the finish screen lists what the walkthrough covered, not "proven in testing".
6. **SharePoint sandbox:** one file, inline style and script only, `ka-lib-manifest` `["d3","chart.js"]`, no `fetch`, no storage, no remote `src` or `href`, no state except the `#step=N` hash (SharePoint's sandboxed frame may ignore it), pure ASCII (escape anything else). See `references/sharepoint-html-sandbox.md`.
7. Plain American English. No em dashes. No tool, vendor, or AI credits in the page.

## Reading the export

The user attaches the zip or the definition JSON. Do the inventory yourself with `references/zip-formats.md`: find the definition, walk `triggers`, then every `actions` object recursively (including `else.actions`, `cases.*.actions`, and `default.actions`), and order siblings by `runAfter`. Count the steps and say the count out loud in the playback so the user can check it. If you cannot open the zip from the library link, ask the user to unzip it and attach `definition.json` (legacy: `Microsoft.Flow/flows/<id>/definition.json`; solution: `Workflows/<Name>-<GUID>.json`).

## The conversation

This is a chat, not a form. Work through it in this order and keep each message short. A worked example for a real three-step flow is in `references/playback-example-tech-ease.md`.

### 1. Ask for the export

Ask for the zip or the definition JSON. In Copilot in SharePoint, the chat may not accept a .zip attachment: ask the user to upload the export zip to a document library on the site and paste its link into the chat, then read the zip from that link. Say which export types work, and that nothing is run.

### 2. Play back your understanding in one message

After reading the export, tell the user what you think the flow does in a single message that covers all four parts below. Do not stop after the trigger or after any single part. Number the actions so the user can correct one by number:

1. **The trigger** in plain words: what starts it, how often it checks, and any Split On, conditions, or concurrency settings.
2. **Each action** in plain words, in run order, one line each: what it does and which earlier output it uses. Put steps inside loops, conditions, and scopes in an indented sub-list under their container, numbered from the container's number (8a, 8b, 8c; for a condition, 6a-yes, 6b-yes, 6a-no). Never number inner steps on the same line as the container or with the outer list's numbers, so "correct by number" is never ambiguous.
3. **The inferred goal and audience.** Say it as one sentence ("Every new episode lands as a clean list item in SharePoint") and a guess at who the page is for. Ask if that is right.
4. **The guardrails you spotted.** Point at the settings that usually cause trouble, for example: polling frequency and duplicates, Split On (one run per item), conditions and empty arms, Do until exit conditions and limits, Apply to each concurrency, run-after settings that create error paths, parallel branches, HTTP actions, hard-coded IDs. See `references/guardrail-patterns.md`.

Use `references/chat-playback.md` for wording patterns. End the message with one question: "Is anything wrong or missing? Correct any part by number." Wait for that one answer, then apply every correction. Then send the masking table (step 3) and the gap questions (step 4) together in the next message, so the whole chat takes about three turns before you generate.

### 3. Show the masking table (same message as step 4)

List every sensitive value you found with a redacted preview (never the full real value), where it appears, and the fictional replacement you propose. Use `references/masking.md` for the detection rules and the replacement style (for example `https://contoso-my.sharepoint.com/personal/alex_contoso_com`, `https://example.com/podcast/rss`, `00000000-0000-4000-8000-000000000001`, `connection-1`, `[REDACTED]`). Ask the user to approve or edit the table, and to name anything else to hide (a company, a product, a person). Wait for an explicit yes.

### 4. Ask only for what you could not infer

The export has the settings, not the reasons. Ask only for the gaps, in one short message:

- The "why" for steps where the reason is not obvious (loops, conditions, lookups, HTTP calls). Offer your draft and ask them to fix it.
- Gotchas or guardrails you missed (aim for three or four in total).
- Quiz focus: which two or three guardrails should become quick checks.
- Test evidence, if any (a sanitized count or a short "it worked when" list). If none, say the finish screen will show what the walkthrough covered.
- Optional: the page title, and whether a public copy (GitHub Pages) is wanted.

### 5. Write the cards

For every step, in this order (see `references/writing-cards.md`):

- **What:** one sentence, plain words.
- **Why:** two to four sentences that link to the previous step (what it handed over), the next step (what this enables), and the overall goal.
- **How to configure:** the settings a maker would type or pick, using masked values and the dynamic content names they will see in the designer, with the expression in backticks.
- Optional quick check on the guardrail steps: one question, two or three options, exactly one correct, and a short feedback line for each option that explains the reason.

### 6. Generate (copy the template; do not design)

Write the internal handoff file (`references/content-schema.md`). It holds the confirmed answers and the card copy. The user never fills it in. Then fill the template yourself, following these rules exactly:

1. Open `templates/flow-training-template.html` and keep all of its own content unchanged and in order: every rule in the `<style>` block, the markup, and the `<script>` engine. SharePoint's page-authoring wrapper (extra head styles, theme variables, metadata) may be added around it when the page is saved; that is fine.
2. Replace only the text between `/*FLOW_DATA_BEGIN*/` and `/*FLOW_DATA_END*/` with one `var DATA={...};` that follows `references/data-schema.md`. Keep both marker comments.
3. Set the `<title>`, `#ft-eyebrow`, `#ft-title`, and `#ft-lede` text to match `DATA.meta`. Change nothing else.
4. Never write your own HTML, CSS, or JavaScript, never add or remove sections, never restyle the page, and never call it or build it as a "dashboard". The template draws the steps, cards, quick checks, and the finish doughnut by itself from `DATA`; never add coordinates.
5. If you cannot include the template's complete markup, styles, and script (for example it is too long for one reply), say exactly that and stop. Do not hand over a shorter or different page.
6. Once the user has approved the playback and the masking table, create the page and save it as an `.html` file in the site's Documents library right away (not the Site Pages HTML writer, which cannot hold the full template). Do not wait for another prompt, do not ask whether to save it, and do not stop to explain the template rule; just save the file.

### 7. Check before you hand it over

Run this self-check on the finished file and fix any failure before you hand it over. If a check fails and you cannot fix it, say which one.

- **Template markers present:** the page still has the template's `id="ft-eyebrow"`, `id="ft-title"`, `id="ft-lede"`, `id="flow"`, `id="card"`, `id="end"`, `id="ft-chart"` (written by the engine), and `window.__flowTraining`. If any is missing, you wrote your own page: start again from the template.
- **`ka-lib-manifest` present:** `<script type="application/json" class="ka-lib-manifest">["d3","chart.js"]</script>` is in the `<head>`.
- **`FLOW_DATA` block present:** exactly one `/*FLOW_DATA_BEGIN*/` and one `/*FLOW_DATA_END*/`, with one `var DATA={...};` between them. Nothing in the template's own markup, styles, or script changed outside that block except the title, eyebrow, and lede text. Styles, theme variables, or metadata that SharePoint's wrapper added around it do not count as changes.
- **Step count matches the playback:** `DATA.steps` has as many entries as the steps you numbered in the playback, and every step id exists in the export.
- **`DATA` passes the page's data check:** every step has a unique `id`, a `kind` of `node`, `cond`, or `loop`, and a filled-in `title`, `what`, and `why`; every `cfg` entry is a `[label, value]` pair with both filled in; every child step comes after its parent, and steps inside a loop use the branch `actions`; every quiz has two or three options, each with `t` and `fb`, and exactly one with `"ok":true`; every guardrail and checklist item has its text; every id in `parts` exists. The page checks the same rules when it opens and, if any fails, shows a list of the problems instead of the walkthrough. See `references/data-schema.md`.
- **Counts in the copy match the data:** any number you write in text ("three guardrails", "5 checks") equals the real count in `DATA` (guardrails, quick checks, steps). Prefer no number over a wrong one.
- **No real values:** no value from the masking table appears in its real form. Search the page for the tenant name, the person's name, and `@` addresses.
- The template part and your `DATA` are ASCII only and have no `fetch`, storage, or remote links. Anything SharePoint's wrapper adds, such as theme font links, is fine.
- **Saved:** the page is saved as an `.html` file in a document library or Site Pages. Give the user its link and tell them to open it from there, not to paste it into a text web part.

## Package contents

- `SKILL.md`: this file.
- `templates/flow-training-template.html`: the page engine with a small sample `DATA` block.
- `references/zip-formats.md`: where the definition lives in each export and how to walk it.
- `references/chat-playback.md`: the playback and question patterns.
- `references/playback-example-tech-ease.md`: a full example dialog for a three-step RSS flow.
- `references/guardrail-patterns.md`: settings that usually deserve a guardrail or a quick check.
- `references/masking.md`: detection rules and replacement style.
- `references/writing-cards.md`: how to write what / why / how and quick checks.
- `references/content-schema.md`: the internal handoff file.
- `references/data-schema.md`: the `DATA` block the template reads.
- `references/sharepoint-html-sandbox.md`: sandbox rules for the file.
- `references/public-hosting.md`: the optional public copy.
