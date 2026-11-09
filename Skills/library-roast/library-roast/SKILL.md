---
name: library-roast
description: |-
  Roast a SharePoint document library: a comedy roast of its files and folders based only on measured findings (version suffixes, duplicate-looking names, files untouched for years, deep nesting, empty folders, very large files, inconsistent naming, files at the root, legacy Office formats). Every joke uses a real count and a real file name. Creates an HTML "roast stage" with one roast card per finding, a Roast-o-meter score, and a cleanup plan in priority order that points to existing skills. Read-only: it changes nothing in the library and writes only the roast file.

  Use when the user says:
    - "Roast this document library"
    - "Roast the Team Files library"
    - "How bad is this library? Be funny about it"
    - "Give me a library roast with a cleanup plan"
    - "Make fun of our file naming, then tell me how to fix it"
---
# Library roast

## When to use
Use this skill when the user wants a light-hearted but accurate look at how messy one document library is, followed by a real cleanup plan. It roasts files and structure, never people. Don't use it to change anything: renames, moves, and deletions belong to the skills named in the cleanup plan. For a plain, joke-free analysis use `analyze-document-library`; for sync problems use `sync-blocker-auditor`.

## Inputs
- Current SharePoint site URL and context.
- The library to roast: the library the user names, otherwise the library the user is looking at. If neither is known, step 1 returns the site's document libraries; ask which one to roast. Roast one library per run.
- Language: English by default. If the user writes in another language, or asks for one, roast in that language (see step 2).
- Destination document library for the HTML file. Default to `Reports` only when the user doesn't name one.
- Never roast system or asset libraries (`AgentAssets`, `Site Assets`, `Style Library`, `Form Templates`, preservation hold, `_catalogs`). If the user asks for one, say it isn't supported.

## Hard constraints
- Run the whole job in one turn without pausing for the user. The only allowed pauses are the questions in steps 1 and 3.
- Three files in this skill do the mechanical work: `references/collect.js` finds the library and prepares the rows, `references/analyze.js` applies every detection rule, count, severity, the Roast-o-meter, and the cleanup plan, and `assets/roast-template.html` draws the roast stage. Read them with `tools.files.read` inside your plan and run them as they are. Never retype, shorten, rewrite, or reimplement them, never write your own detection or counting code, and never write your own roast HTML. Their server-relative URLs are `<site server-relative URL>/AgentAssets/Skills/library-roast/references/collect.js`, `<site server-relative URL>/AgentAssets/Skills/library-roast/references/analyze.js`, and `<site server-relative URL>/AgentAssets/Skills/library-roast/assets/roast-template.html`. If one can't be read or fails, stop and tell the user the exact error; don't produce findings any other way.
- The saved roast is the template text with `{{DATA_JSON}}` replaced by the data, and nothing else.
- Read-only. Don't rename, move, delete, tag, check out, or edit any file, folder, column, or view, and don't offer to. The only write is the roast HTML file in the destination library (and that library itself, only after the user agrees to create it).
- Roast the files and the structure, never people. Don't request `Author`, `Editor`, or any other person field. Don't mention or hint at authors, editors, owners, teams, or departments as people. No "whoever", "someone", "your colleague", "the intern", or blame.
- Never invent anything. Every number and every file or folder name in a joke comes from the analysis.

## Steps
1. **Collect and analyze (read-only plan).** Run one `execute_plan` script that only reads and computes, never writes. Use exactly the calls and arguments below:
   - `var now = tools.context.now();` and `var info = tools.context.getDateTimeInfo();`
   - `var site = { title: <the site title if you know it, else "">, url: context.siteUrl };`
   - `var lists = tools.lists.discover({ filterType: "all", includeHidden: false });` Pass the result to `C.plan` as it is.
   - `var C = new Function(tools.files.read({ path: "<site server-relative URL>/AgentAssets/Skills/library-roast/references/collect.js" }).files[0].content)();`
   - `var p = C.plan({ site: site, now: now.now, utcOffsetMinutes: now.utcOffsetMinutes, timeZone: now.timezone, dateSample: info, library: <the library title or URL the user named or is looking at, else "">, destination: <the library the user named for the file, else "Reports">, lists: lists });`
   - If `p.target` is null, return `{ libraryFound: false, candidates: p.candidates }` and stop the plan.
   - `var items; try { items = tools.lists.getItems({ listId: p.target.id, recursive: true, rowLimit: p.rowLimit, viewFields: p.fields }); } catch (e) { items = { error: String(e && e.message || e) }; }`
   - `var ANALYZE = tools.files.read({ path: "<site server-relative URL>/AgentAssets/Skills/library-roast/references/analyze.js" }).files[0].content;` and `var a = new Function('data', ANALYZE)(C.input(p, items));`
   - `var TEMPLATE = tools.files.read({ path: "<site server-relative URL>/AgentAssets/Skills/library-roast/assets/roast-template.html" }).files[0].content;`
   - Keep what step 4 needs with the plan API's `save()`: `{ template: TEMPLATE, analysis: a, fileName: p.state.fileName, destination: p.destination }`. Return `{ libraryFound: true, library: p.target.title, handle: <the handle save() gave you>, destinationFound: !!p.destination, totals: a.totals, score: a.score, band: a.band, cutoffText: a.cutoffText, findings: a.findings.map(function (f) { return { key: f.key, name: f.name, severity: f.severity, count: f.count, label: f.label, facts: f.facts, examples: f.examples.slice(0, 4) }; }), plan: a.plan, passed: a.passed, notChecked: a.notChecked, complete: a.complete, summaryMarkdown: a.summaryMarkdown }`.
   - If `libraryFound` is false, list the `candidates` with their item counts, ask which library to roast, and run step 1 again with that title. If `totals.files` is 0, tell the user the library has no files, so there's nothing to roast, and stop; no file is written.
   - Use the returned values as they are; don't recount, re-sort, or reword the numbers. What the script checks, for your understanding only: version markers (final, copy, v2, rev2, latest, backup, `(1)`); duplicate-looking names; files not modified in two years; folders 5+ levels deep; empty folders; files of 50 MB or more; mixed separator styles and date formats in names; 10+ files at the root next to folders; `.doc`, `.xls`, `.ppt`, `.pps`, `.dot`, `.xlt`, `.pot` files. Severity High = Scorching, Medium = Spicy, Low = Mild.
2. **Write the roast text.** This is the only creative part. Build one object `extra = { lang, opener, jokes, nothingLine, i18n }`:
   - **jokes**: one per finding, keyed by the finding's `key` (`version`, `duplicates`, `stale`, `nesting`, `empty`, `giant`, `naming`, `root`, `legacy`). One to three sentences, witty and kind, based only on that finding's `facts`. Each joke must state the finding's `count` in digits, exactly as returned (`23`, never "twenty-three"; for `nesting` and `naming`, the numbers in `facts`, also in digits) and name at least one of its `examples` exactly as written (plain text; the template highlights it). Joke about what the files and folders look like ("the final version of the final version"), never about anyone's competence. No insults, swearing, or references to people, teams, or roles. Don't guess what files contain or why they're messy: you only know names, paths, dates, and sizes.
   - **opener**: one sentence that greets the audience and introduces the library with its real `totals.files` and `totals.folders`.
   - **nothingLine**: only when there are no findings: one short, warm line with the real file count. If `complete` is false, the line is about the files that were read and says the roast couldn't check everything. Otherwise `""`.
   - **lang**: the language code (`en`, `de`, `hu`, …).
   - **i18n**: `null` for English. For another language, translate every fixed text: `{ "labels": { "live", "eyebrow" ("Tonight on stage"), "roasting" ("Roasting"), "scanned", "file", "files", "folder", "folders", "finding", "findings", "meter" ("Roast-o-meter"), "band" (the band name), "scorching", "spicy", "mild", "scorchingLower", "spicyLower", "mildLower", "noFindingsNote", "nothingBig", "nothingPartialBig", "more", "notChecked", "serious" ("The serious part"), "seriousIntro", "seriousIntroNone", "seriousIntroPartial", "now", "next", "later", "manual", "finePrint", "generated", "source", "title" }, "findings": { "<key>": { "name", "label" } }, "plan": { "<plan key>": { "title", "why", "how" } }, "passed": [ ... ] }`. Translate `label`, `why`, `how`, and `passed` one to one, with the same numbers; keep file names and skill names unchanged.
3. **Destination.** If `destinationFound` is false, ask once: "There's no <destination> library on this site. Should I create it?"
   - On yes, run a plan that does nothing else: `tools.lists.create` with `title` = the destination name, a document library template, and every other option `null`. Use the library URL it returns as `destUrl` in step 4.
   - On no, ask which existing library to use, or stop without saving.
   - Never save in the Agent Assets library.
4. **Render and save (write plan).** Run one more `execute_plan` script. SharePoint refuses a save in a plan that also reads data, so this plan must not call any read tool (`tools.files.read`, `tools.lists.*`). Use exactly these calls:
   - `var kept = await load(<handle from step 1>); var extra = <the step 2 object as a JSON literal>;`
   - `var a = kept.analysis; Object.keys(extra).forEach(function (k) { a[k] = extra[k]; });`
   - `var json = JSON.stringify(a).replace(/</g, '\\u003c'); var html = kept.template.split('{{DATA_JSON}}').join(json);` Check that `html.length === kept.template.length - 13 + json.length`; if not, stop and report the mismatch.
   - `var saved = await tools.output.createFile({ files: [ { fileName: kept.fileName, content: html, images: null, listUrl: <kept.destination.absUrl, or destUrl from step 3>, folderPath: null } ] });`
   - Return `{ file: saved.fileUrl || (saved.files && saved.files[0] && saved.files[0].fileUrl) }`. If the save fails, return the exact error instead.
5. Reply in chat (see Output format). If the save failed, say so with the exact error, never say the roast was saved, and still give the summary.

## Rules
- Never invent files, counts, dates, sizes, or reasons. If a number isn't in the analysis, it doesn't go in a joke.
- Never name, describe, or hint at people. Don't read person fields.
- Don't offer to rename, move, delete, or fix anything. To act on the plan, the user runs the named skills, which each ask for approval first.
- If the library can't be read, say so plainly with the exact error and don't produce a roast. A partial read is listed under "Not checked" by the script; never present an unread part as tidy.
- If there's nothing to roast and `complete` is true, say so plainly and kindly; still produce the roast stage with score 0. If `complete` is false, say no findings came up in what was read and list what wasn't checked.

## Output format
Reply in chat, in the user's language:
- A markdown link to the roast HTML file, or the exact save error if saving failed.
- `summaryMarkdown` from step 1 (score, band, findings table, plan), translated if the user writes in another language, with the same numbers.
- The best two or three jokes.
- One line: this skill didn't change anything in the library; the named skills each preview their changes and ask first.
- Anything in `notChecked`.

Example request: `Roast the Team Files library and save it in Reports.`
