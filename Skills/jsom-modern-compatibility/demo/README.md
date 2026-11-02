# Loader regression harness

`sample-files/loader-regression.test.js` checks the mandatory compatibility loader in `jsom-modern-compatibility/SKILL.md`.

It reads the boilerplate code block straight out of `SKILL.md`, so it always tests the exact code the skill tells Copilot to emit, and runs it in an isolated Node.js VM with a small simulated DOM (script tags, load and error events, page context). It never contacts a SharePoint tenant.

## Run

Requires Node.js 18 or later and no npm packages:

```bash
node Skills/jsom-modern-compatibility/demo/sample-files/loader-regression.test.js
```

It exits with code 0 when every case passes, 1 otherwise. A case still pending after 3 seconds is reported as a hang. The harness lowers the loader timeout to 300 ms so timeout cases finish quickly (the production default is 15000 ms).

## Cases covered

1. Successful load on a modern page, from the current site URL
2. Feature library (SP.Search.js) loads from the current site
3. Required load failure stops the chain and rejects
4. Load event without library initialization rejects
5. Tracked in-flight tag waits for its load event, no duplicate tag
6. Tracked failed tag rejects immediately
7. Untracked already-loaded tags (classic page) resolve without new requests
8. Partially initialized page: untracked loaded init.js, rest loaded by the loader
9. Untracked init.js tag with an empty dataset, no events, JSOM not ready: bounded rejection (reviewer repro)
10. Untracked already-failed tag (error fired before listeners attached): bounded rejection
11. Untracked in-flight tag that later fires load
12. Untracked in-flight tag that later fires error
13. Untracked tag whose library becomes ready with no observed event (readiness polling)
14. New tag whose request never answers: bounded rejection
15. Concurrent calls share loads (one tag per library)
16. Modern page without `_spPageContextInfo`: fails clearly, no tenant-root fallback
