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

### Environment
- Repository validator: passed
- npm test: passed
- npm run check: passed
- npm run build: passed
- npm run test:e2e: passed
- Isolated loader regression harness: `test-artifacts/loader-regression-harness.js`
- Detailed regression results: `test-artifacts/loader-regression-results.md`

### Regression checks performed
1. Successful dependency load
   - Result: pass
   - Observed: required namespaces available before readiness log

2. Required dependency load failure
   - Result: pass
   - Observed: loader throws and business logic does not continue

3. Existing in-flight script tag
   - Result: pass
   - Observed: loader waits for the existing script load event

4. Existing failed script tag
   - Result: pass
   - Observed: loader rejects with a clear error

5. Concurrent calls for the same script
   - Result: pass
   - Observed: shared in-flight promise prevents duplicate loads

6. Modern page without `_spPageContextInfo.webAbsoluteUrl`
   - Result: pass
   - Observed: loader fails clearly and does not fall back to tenant root
