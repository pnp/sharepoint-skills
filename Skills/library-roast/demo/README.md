# Completeness checks

`completeness-checks.js` checks how the roast reports a library it couldn't fully read. It loads `references/collect.js` and `references/analyze.js` exactly as the skill's plan runs them, feeds them fixed getItems results, and renders `assets/roast-template.html` against a small DOM stub. It never contacts a SharePoint tenant.

## Run

Requires Node.js 18 or later and no npm packages:

```bash
node Skills/library-roast/demo/completeness-checks.js
```

It exits with code 0 when every case passes, 1 otherwise.

## Cases covered

1. The read stops at the 5,000-row limit and the library's item count is unknown: nothing is listed as passed, a folder that only looks empty isn't reported, and the page says "Nothing found in what was read." rather than "Nothing to roast."
2. Some files have an unreadable date or no size: the 2-year and giant-file checks aren't listed as passed, and each gap appears once under Not checked.
3. A full read of a tidy library: score 0, "Nothing to roast", all five passed lines, and the "Keep it this way" step.
4. A full read with a real empty folder: reported as a finding.
5. A library that can't be read: the collector stops with the exact error, so no roast is produced.
