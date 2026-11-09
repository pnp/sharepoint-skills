# Coverage checks

`coverage-checks.js` checks how the digest reports libraries and lists it couldn't read. It loads `references/collect.js` and the engine and render scripts from `assets/digest-template.html` exactly as the skill runs them, feeds the collector fixed getItems results, and renders the page against a small DOM stub. It never contacts a SharePoint tenant.

## Run

Requires Node.js 18 or later and no npm packages:

```bash
node Skills/what-changed-digest/demo/coverage-checks.js
```

It exits with code 0 when every case passes, 1 otherwise.

## Cases covered

1. Every container fails: the digest says it can't determine what changed, shows `–` instead of zero counts, has no day chart, and never says nobody changed anything.
2. Some containers fail and the rest have no changes in the window: the digest says no changes were found in what could be checked and that this isn't a confirmed zero.
3. Some containers fail and the rest have changes: the first highlight says the digest is incomplete and the counts cover only what could be read.
4. Every container is read and nothing changed: a confirmed zero, with "No changes in this window." and zero counts.
