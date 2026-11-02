# Testing Guide

## How to Test
- In SharePoint site, go to Agent Assets document library
- Open Skills folder
- Upload the inner `jsom-modern-compatibility` package folder
- Wait 3-5 mins for discovery
- Open Copilot in SharePoint and start a new chat
- Test prompts such as:
  - Use JSOM Modern Compatibility to get items from Documents list
  - Use JSOM Modern Compatibility to search SharePoint content
  - Use JSOM Modern Compatibility to read taxonomy terms
  - Fix this JSOM error: SP is not defined

## Expected Results
- The response includes one short explanation and one complete JavaScript code block
- Runnable JavaScript uses raw syntax and remains copy/paste executable after rendering
- The final script passes a quality check for syntax, current-site dependency URLs, and one-block output
- Base JSOM dependencies are ensured before business logic runs, and feature-specific libraries load only when needed
- SharePoint JavaScript files load from the current site URL, not the tenant root site
- Logging is concise and limited to startup, dependency loading, execution start, success summary, and errors
- Large-list or bulk-operation scripts use throttling-aware patterns such as row limits, paging, targeted queries, and safe chunking
- If batching is used, it aligns with official SharePoint guidance; otherwise the script falls back to normal JSOM patterns
- Classic and modern pages remain supported, including SharePoint 2013 classic pages when the browser supports the loader's JavaScript features
- The response includes short run instructions, the safety footer, and a confirmation dialog for delete or other clearly destructive bulk operations

## Observed Results

### Loader regression harness
Run with `node Skills/jsom-modern-compatibility/demo/sample-files/loader-regression.test.js` (see `demo/README.md`). The harness extracts the boilerplate from `SKILL.md` and runs it in an isolated Node.js VM with a simulated DOM; no tenant is contacted.

Environment actually tested: Node.js v22.23.3 on Linux, 2 Nov 2026. Loader timeout lowered to 300 ms for the run.

| # | Case | Result |
|---|------|--------|
| 1 | Successful load on a modern page, from the current site URL | PASS |
| 2 | Feature library (SP.Search.js) loads from the current site | PASS |
| 3 | Required load failure stops the chain and rejects | PASS |
| 4 | Load event without library initialization rejects | PASS |
| 5 | Tracked in-flight tag waits for its load event, no duplicate tag | PASS |
| 6 | Tracked failed tag rejects immediately | PASS |
| 7 | Untracked already-loaded tags (classic page), no new requests | PASS |
| 8 | Partially initialized page: untracked loaded init.js | PASS |
| 9 | Untracked init.js tag, empty dataset, no events, JSOM not ready: bounded rejection | PASS (rejects after the timeout) |
| 10 | Untracked already-failed tag: bounded rejection | PASS |
| 11 | Untracked in-flight tag that later fires load | PASS |
| 12 | Untracked in-flight tag that later fires error | PASS |
| 13 | Untracked tag ready with no observed event (readiness polling) | PASS |
| 14 | New tag whose request never answers: bounded rejection | PASS |
| 15 | Concurrent calls share loads | PASS |
| 16 | No `_spPageContextInfo`: fails clearly, no tenant-root fallback | PASS |

Result: 16/16 passed.

For comparison, the previous loader (commit 12d2d92) passed 9/16 in the same harness: cases 8, 9, 10, 13 and 14 stayed pending indefinitely, case 3 kept requesting later libraries after a required failure, and case 4 only failed at the final namespace check.

### Not yet tested
- Live SharePoint Online classic and modern pages, and SharePoint 2013 classic pages, have not been run against this revision of the loader. Results above come from the simulated harness only.

### Repository checks
- `python .github/scripts/validate_skills.py --root .`: passed (2 Nov 2026).
