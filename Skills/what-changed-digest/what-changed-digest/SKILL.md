---
name: what-changed-digest
description: |-
  Create an HTML digest of the documents, site pages, and list items created or modified on the current SharePoint site in a time window. Groups the changes by library or list and by person, and posts a short summary in chat. Reads site content and writes only the digest file. Don't use for permission changes, storage usage, or deleted content.

  Use when the user says:
    - "What changed on this site this week?"
    - "What happened here while I was away?"
    - "Show me what changed since Monday"
    - "Create a what-changed digest for the last 14 days"
    - "Catch me up on this site"
---
# What changed digest

## When to use
Use this skill when the user wants to catch up on recent activity on the current site: which documents, pages, and list items were created or edited in a time window, and by whom. Don't use it for permission changes, storage, or deleted content.

## Inputs
- Current SharePoint site URL and context.
- Time window. Accept "last N days", "this week", "since <date>", or "while I was away from <date> to <date>". Default to the last 7 days only when the user doesn't give a window.
- Destination document library for the HTML file. Default to `Reports` only when the user doesn't name one.
- Optional scope: specific libraries or lists. Otherwise include every user-facing document library, the Site Pages library, and every user-facing list.
- Always exclude system and asset libraries (`AgentAssets`, `Site Assets`, `Style Library`, `Form Templates`, preservation hold, `_catalogs`), hidden lists, and the destination library's own digest files.

## Hard constraints
- Run the whole job in one turn without pausing for the user. The only allowed pause is the question in step 2.
- Two files in this skill do the mechanical work: `references/collect.js` picks the libraries and lists, filters and normalizes the rows, and names the file; `assets/digest-template.html` contains the layout and every count, highlight, and chart. Read both with `tools.files.read` inside your plan and run them as they are. Never retype, shorten, rewrite, or reimplement them, and never write your own digest HTML. Their server-relative URLs are `<site server-relative URL>/AgentAssets/Skills/what-changed-digest/references/collect.js` and `<site server-relative URL>/AgentAssets/Skills/what-changed-digest/assets/digest-template.html`. If either can't be read, stop and tell the user; don't fall back to another layout.
- The saved digest is the template text with `{{DATA_JSON}}` replaced by the data, and nothing else.
- Read-only on site content. The only write is the digest file (and the destination library, only after the user agrees).

## Steps
1. **Collect (read-only plan).** Run one `execute_plan` script that only reads and computes, never writes. Use exactly the calls and arguments below:
   - `var now = tools.context.now();` (it gives `now`, `timezone`, and `utcOffsetMinutes`) and `var info = tools.context.getDateTimeInfo();`
   - `var site = { title: <the site title if you know it, else "">, url: context.siteUrl };` (`collect.js` derives the server-relative URL from `url`).
   - `var lists = tools.lists.discover({ filterType: "all", includeHidden: false });` Other filters leave out the Site Pages library. Pass the result to `C.plan` as it is (the whole object or its `lists` array); `collect.js` does the filtering.
   - `var COLLECT = tools.files.read({ path: "<site server-relative URL>/AgentAssets/Skills/what-changed-digest/references/collect.js" }).files[0].content; var C = new Function(COLLECT)();`
   - `var p = C.plan({ site: site, now: now.now, utcOffsetMinutes: now.utcOffsetMinutes, timeZone: now.timezone, dateSample: info, days, start, end, scope, destination, lists: lists });` Set `days` (default 7) or `start` and `end` (`yyyy-MM-dd`) from the user's window; `scope` is the list of library or list titles the user named, or `[]`; `destination` is the library title the user named, or `"Reports"`.
   - For each `c` in `p.containers`: `results[c.id] = tools.lists.getItems({ listId: c.id, recursive: true, rowLimit: p.rowLimit, viewFields: p.fields, filter: p.camlFilter });` exactly as returned, each in its own try/catch; on failure `results[c.id] = { error: "<exact error>" }`.
   - `var TEMPLATE = tools.files.read({ path: "<site server-relative URL>/AgentAssets/Skills/what-changed-digest/assets/digest-template.html" }).files[0].content;`
   - `var r = C.build(p, results);`
   - Keep what step 3 needs with the plan API's `save()`: `{ template: TEMPLATE, blob: r.blob, fileName: r.fileName, destination: r.destination }`. Return `{ handle: <the handle save() gave you>, destinationFound: !!r.destination, rows: r.rowCount }`.
2. **Destination.** If `destinationFound` is false, ask once: "There's no <destination> library on this site. Should I create it?"
   - On yes, run a plan that does nothing else: `tools.lists.create` with `title` = the destination name, a document library template, and every other option `null`. Use the library URL it returns as `destUrl` in step 3.
   - On no, ask which existing library to use, or stop without saving.
   - Never save in the Agent Assets library.
3. **Render, save, and summarize (write plan).** Run one more `execute_plan` script. SharePoint refuses a save in a plan that also reads data, so this plan must not call any read tool (`tools.files.read`, `tools.lists.*`). Use exactly these calls:
   - `var kept = await load(<handle from step 1>);`
   - `var json = JSON.stringify(kept.blob).replace(/</g, '\\u003c'); var html = kept.template.split('{{DATA_JSON}}').join(json);` Check that `html.length === kept.template.length - 13 + json.length`; if not, stop and report the mismatch.
   - `var saved = await tools.output.createFile({ files: [ { fileName: kept.fileName, content: html, images: null, listUrl: <kept.destination.absUrl, or destUrl from step 2>, folderPath: null } ] });` and `var file = saved.fileUrl || (saved.files && saved.files[0] && saved.files[0].fileUrl);`
   - Take the text between `<script id="engine">` and the next `</script>` from `kept.template`, run `var model = new Function(engineText + '\nreturn digestModel;')();`, and call `var m = model(kept.blob);`.
   - Return `{ file: file, window: m.window, coverage: m.coverage, kpis: m.kpis, total: m.total, highlights: m.highlights, notes: m.notes }`. If the save fails, return the exact error instead of `file`.
4. Reply in chat from the step 3 result only (see Output format). Don't compute results yourself. If the save failed, say so with the exact error and never say the digest was saved.

## Rules
- Never invent items, people, counts, or reasons. Every number must come from the queried data.
- Don't change, move, or tag any site content. The only write is the digest file (and the destination library, only after the user agrees).
- If a container fails or is throttled, keep going, and list it in the digest and in chat as "not checked" with the reason. Never report a failed container as "no changes".
- Never present a sampled count as a full count. When a container is sampled, the digest's first highlight says the counts cover only the included changes.
- `coverage` says how much was read: `full` (every container), `partial` (some failed or had unreadable dates), or `none` (nothing could be read). Only with `full` and zero changes may you say nothing changed. With `partial`, say no changes were found in what could be checked and name what wasn't checked. With `none`, say you couldn't determine what changed; never give zero counts.
- If nothing changed in the window and `coverage` is `full`, still produce the digest with zero counts and say so plainly.

## Output format
Reply in chat with:
- A markdown link to the HTML digest.
- The exact window and the time zone used.
- The `highlights` from step 3, as bullets, unchanged.
- The `notes` from step 3, if any: libraries or lists that weren't checked or were sampled, with the reason.

Example request: `What changed on this site since September 22? Save the digest in Reports.`
