# Loader Regression Results

## Scope
Reproducible regression checks for the JSOM compatibility loader guidance used by this skill.

## Environment
- Local isolated JavaScript harness: `test-artifacts/loader-regression-harness.js`
- Browser/runtime used for manual verification: Microsoft Edge DevTools Console guidance referenced in the skill
- Repository validator: passed
- npm test: passed
- npm run check: passed
- npm run build: passed
- npm run test:e2e: passed

## Cases

### 1. Successful dependency load
- Expected: loader resolves and required namespaces are available
- Observed: pass
- Notes: `SP.js` load marks the required namespaces as ready before completion

### 2. Required dependency load failure
- Expected: loader throws and business logic does not continue
- Observed: pass
- Notes: failing `SP.js` produces a blocking dependency error

### 3. Existing in-flight script tag
- Expected: loader waits for the existing script load event
- Observed: pass
- Notes: the loader resolves only after the existing script dispatches `load`

### 4. Existing failed script tag
- Expected: loader rejects clearly
- Observed: pass
- Notes: the loader rejects with `Previously failed: <src>`

### 5. Concurrent calls for the same script
- Expected: shared in-flight promise prevents duplicate loads
- Observed: pass
- Notes: only one script tag is appended for concurrent requests

### 6. Modern page without `_spPageContextInfo.webAbsoluteUrl`
- Expected: loader fails clearly and does not fall back to tenant root
- Observed: pass
- Notes: the loader throws before attempting any dependency load

## How to rerun
Run the harness locally with Node.js:

```javascript
node Skills/jsom-modern-compatibility/test-artifacts/loader-regression-harness.js
```

The script prints JSON results for all regression cases.
