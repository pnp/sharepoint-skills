---
name: jsom-modern-compatibility
description: |-
  Generate ready-to-copy JSOM (JavaScript Object Model) code that runs on both classic and modern SharePoint pages, including SharePoint 2013 classic pages, by ensuring required SharePoint JavaScript dependencies are loaded before business logic runs.

  Use when the user says:
    - "write JSOM code"
    - "fix JSOM"
    - "run JSOM on a modern page"
    - "SP is not defined"
    - "sp.js is missing"
    - "get list items with JSOM"
    - "use JSOM for taxonomy"
    - "use JSOM for user profiles"
    - "use JSOM for search"
---

# JSOM Modern Compatibility

## Purpose
Generate ready-to-copy JavaScript that end users can paste directly into the browser developer console on SharePoint pages without manually handling JSOM dependency loading.

The generated script must work on:
- classic SharePoint pages;
- modern SharePoint pages;
- SharePoint 2013 classic pages.

## Core principle
Compatibility first.

Classic pages often already have JSOM available. Modern pages usually do not. The generated script must always ensure the required SharePoint JavaScript libraries are available before any requested business logic runs.

## Documentation preference
Prefer official SharePoint documentation and Microsoft Learn guidance when shaping JSOM patterns, dependency handling, and API usage.
Use Microsoft Learn as the primary reference source before relying on informal examples.

Preferred references:
- [Connect to SharePoint using the JavaScript Object Model (JSOM) | Microsoft Learn](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/web-parts/guidance/connect-to-sharepoint-using-jsom)
- [Complete basic operations using JavaScript library code in SharePoint | Microsoft Learn](https://learn.microsoft.com/en-us/sharepoint/dev/sp-add-ins/complete-basic-operations-using-javascript-library-code-in-sharepoint)

## When to use
Apply this skill to JSOM generation, troubleshooting, dependency loading, and SharePoint JSOM operations including lists/libraries, Search, Taxonomy, and User Profiles.

## Output requirements
Every runnable answer must include:
1. exactly one complete JavaScript code block;
2. the compatibility loader plus the requested business logic;
3. short run instructions outside the code block;
4. the safety footer outside the code block.

Do not split one runnable script across multiple code blocks or place explanatory prose inside the code block.

## Encoding and renderer-safe output
Runnable JavaScript must use raw JavaScript syntax and contain no HTML-encoded operators, quotes, comparison symbols, or arrow functions unless they came from the user's own content or instructions.

Before responding, verify the rendered code remains directly copy/paste executable. If rendering cannot preserve raw syntax, return the script as plain text instead of a fenced code block.
When CAML or XML is required and direct markup may render unsafely in chat, prefer safer construction patterns that preserve copy-paste execution.
Prefer classic JavaScript syntax in the boilerplate and generated script when it improves renderer-safe copy/paste reliability.

## Dependency-loading rules
Always ensure the base JSOM dependencies required for the task are available before business logic runs:
- `init.js`
- `MicrosoftAjax.js`
- `SP.Runtime.js`
- `SP.js`

Load feature-specific libraries only when needed:
- `SP.Search.js` for Search
- `SP.Taxonomy.js` for Managed Metadata
- `SP.UserProfiles.js` for User Profiles
- other supporting libraries such as `sp.documentmanagement.js`, `sp.publishing.js`, or `sp.requestexecutor.js` only when the requested task needs them

Always load SharePoint JavaScript files relative to the current site, not from the tenant root site unless the current site itself is the root site.

Correct pattern:
- current page: `https://tenant.sharepoint.com/sites/playground/...`
- load from: `https://tenant.sharepoint.com/sites/playground/_layouts/15/SP.Search.js`

Incorrect pattern:
- `https://tenant.sharepoint.com/_layouts/15/SP.Search.js`

Use the current web URL or current site URL as the base for `/_layouts/15/` so the generated script stays scoped to the site where the user is running it.
## Logging guidance
Keep logging helpful but lightweight.

Required logs:
- one startup log showing the task and detected page mode;
- one environment/dependency log sequence from the loader;
- one execution-start log before `executeQueryAsync`;
- one success summary log;
- one error log with the SharePoint error message.

Avoid noisy logging.
- Do not log inside tight loops.
- Do not log every item unless the user explicitly asks for verbose diagnostics.
- For larger result sets, log a summary count only.
- Use `console.log` for normal milestones, `console.warn` for recoverable dependency issues, and `console.error` for failures.

## Performance and throttling guidance
Some requested operations may target large lists, large libraries, or resource-intensive SharePoint workloads.
Generate implementations that reduce the risk of HTTP 429 throttling and avoid unnecessary server load.

When relevant:
- prefer targeted queries over broad reads;
- request only the fields that are needed;
- use CAML filters, row limits, and paging for large lists;
- avoid loading entire lists when the task only needs a subset;
- process items in manageable chunks instead of one massive operation;
- avoid unnecessary repeated `executeQueryAsync` calls inside tight loops;
- for bulk updates or deletes, batch work in smaller groups and log progress by batch;
- if the task is likely to be expensive, mention that the script is designed to reduce throttling risk.

For batching logic, prefer official SharePoint documentation and Microsoft Learn guidance.
If batching guidance is ambiguous, incomplete, or not clearly applicable to the requested scenario, avoid batching and use a normal JSOM implementation instead.
Do not invent unsupported batching patterns.

For large-list scenarios, prefer implementations that are safe for non-technical users to run in the browser console without overwhelming the site.

## Delete safety rule
For delete operations or other clearly destructive, irreversible bulk operations, include this confirmation block before the destructive action:

```javascript
// --- DELETE SAFETY CONFIRMATION - COMMENT OUT TO BYPASS ---
console.log('[JSOM] Delete operation detected, awaiting user confirmation...');
if(!confirm('WARNING Are you sure you want to DELETE? This cannot be undone. OK=Proceed, Cancel=Abort')){
  console.log('[JSOM] Delete cancelled by user - aborting operation');
  return;
}
console.log('[JSOM] Delete confirmed by user - proceeding');
// --- END DELETE CONFIRMATION ---
```

## Mandatory compatibility boilerplate
Use this pattern in every generated script and adapt it only as needed for the requested task:

```javascript
const pendingScriptLoads = new Map();

function hasRequiredJsomNamespaces() {
  return !!(
    window.SP &&
    window.SP.ClientContext &&
    window.SP.SOD
  );
}

function getVerifiedWebAbsoluteUrl() {
  var pageInfo = window._spPageContextInfo;

  if (pageInfo && pageInfo.webAbsoluteUrl) {
    return pageInfo.webAbsoluteUrl.replace(/\/$/, '');
  }

  throw new Error(
    'Unable to determine the current SharePoint web URL. ' +
    'window._spPageContextInfo.webAbsoluteUrl is required on this page.'
  );
}

function waitForExistingScript(existing, src) {
  return new Promise(function(resolve, reject) {
    if (existing.dataset.loadState === 'loaded') {
      resolve();
      return;
    }

    if (existing.dataset.loadState === 'failed') {
      reject(new Error('Previously failed: ' + src));
      return;
    }

    function onLoad() {
      existing.dataset.loadState = 'loaded';
      resolve();
    }

    function onError() {
      existing.dataset.loadState = 'failed';
      reject(new Error('Load failed: ' + src));
    }

    existing.addEventListener('load', onLoad, { once: true });
    existing.addEventListener('error', onError, { once: true });
  });
}

function loadScript(src) {
  if (pendingScriptLoads.has(src)) {
    return pendingScriptLoads.get(src);
  }

  var promise = new Promise(function(resolve, reject) {
    var selector = 'script[src="' + src + '"]';
    var existing = document.querySelector(selector);
    var script;

    if (existing) {
      waitForExistingScript(existing, src).then(resolve).catch(reject);
      return;
    }

    script = document.createElement('script');
    script.src = src;
    script.dataset.loadState = 'loading';
    script.onload = function() {
      script.dataset.loadState = 'loaded';
      console.log('[JSOM Loader] Loaded: ' + src);
      resolve();
    };
    script.onerror = function() {
      script.dataset.loadState = 'failed';
      reject(new Error('Load failed: ' + src));
    };
    document.head.appendChild(script);
  }).finally(function() {
    pendingScriptLoads.delete(src);
  });

  pendingScriptLoads.set(src, promise);
  return promise;
}

async function ensureJSOMLibraries(extraFiles) {
  console.log('[JSOM Loader] Checking environment - classic or modern?');

  var siteBase = getVerifiedWebAbsoluteUrl();
  var core = ['init.js', 'MicrosoftAjax.js', 'SP.Runtime.js', 'SP.js'];
  var chain = core.slice(0);
  var i;
  var file;
  var src;
  var hasClassicJsom = hasRequiredJsomNamespaces();
  var failures = [];

  if (extraFiles) {
    for (i = 0; i < extraFiles.length; i++) {
      chain.push(extraFiles[i]);
    }
  }

  if (hasClassicJsom) {
    console.log('[JSOM Loader] Classic page detected - core JSOM already available');
  } else {
    console.log('[JSOM Loader] Modern page detected - loading SharePoint JavaScript dependencies');
  }

  for (i = 0; i < chain.length; i++) {
    file = chain[i];
    src = siteBase + '/_layouts/15/' + file;

    if (hasClassicJsom) {
      if (file === 'init.js' || file === 'MicrosoftAjax.js' || file === 'SP.Runtime.js' || file === 'SP.js') {
        continue;
      }
    }

    try {
      await loadScript(src);
    } catch (error) {
      console.warn('[JSOM Loader] ' + file + ': ' + error.message);
      failures.push(file + ' (' + error.message + ')');
    }
  }

  if (failures.length > 0) {
    throw new Error('Required SharePoint JavaScript dependencies failed to load: ' + failures.join(', '));
  }

  if (!hasRequiredJsomNamespaces()) {
    throw new Error('JSOM dependencies did not initialize correctly. window.SP.ClientContext is unavailable.');
  }

  console.log('[JSOM Loader] Dependencies ensured - ready to run JSOM');
}
```

Additional requirements for every generated script:
- Do not use `window.location.origin` as a fallback SharePoint web URL.
- Do not continue business logic if any required dependency fails to load.
- Do not assume an existing script tag means the library is ready.
- Always verify `window.SP`, `SP.ClientContext`, and `SP.SOD` before reporting readiness.

## Code-generation procedure
1. Identify the requested SharePoint task.
2. Determine whether extra SharePoint JavaScript libraries are needed.
3. Determine whether the task may hit large lists, bulk operations, or resource-intensive patterns.
4. Generate one complete JavaScript script that:
   - starts with a concise startup log;
   - ensures dependencies are loaded;
   - initializes `SP.ClientContext`;
   - uses throttling-aware query and batching patterns when relevant;
   - runs the requested business logic;
   - logs a concise success summary or a clear error.
5. If the task is destructive, include the delete confirmation block.
6. Run a final output quality check on the full script before returning it.
7. Return the script in exactly one fenced JavaScript code block only after it passes the quality check.
8. After the code block, include the run instructions and safety footer.

## Preferred response shape
Use this order:
1. one sentence saying what the script does;
2. one fenced JavaScript code block containing the full script;
3. short run instructions;
4. the safety footer.

## Final output quality check
Before responding, verify:
- runnable JavaScript contains no HTML-encoded syntax unless it came from the user's own content or instructions;
- the script is syntactically valid for direct browser-console execution;
- dependency URLs use the current SharePoint web URL;
- all runnable JavaScript is contained in exactly one code block;
- explanatory text remains outside the code block.

If any check fails, correct it before responding.

## How to run this code
Always include this guidance after the code block:

To run this code:
1. Open your SharePoint page in Chrome or Edge where you want to run this.
2. Press Ctrl+Shift+J on Windows or Cmd+Option+J on Mac to open Developer Tools.
3. Open the Console tab.
4. If needed, refer to the Microsoft Edge DevTools Console guide for running JavaScript in the console: https://learn.microsoft.com/en-us/microsoft-edge/devtools/console/console-javascript
5. Copy the full JavaScript code block and paste it into the console.
6. Press Enter and watch the `[JSOM]` and `[JSOM Loader]` messages.
7. For delete operations, only click OK in the confirmation dialog if you are sure.

## Mandatory footer
Always end with this warning outside the code block and prefix it with a small warning icon.
Always add a short follow-up note telling the user to review the rendered code for any HTML encoding before running it.

⚠️ Custom Code Execution Notice: This is custom JSOM code generated for your SharePoint site. Please review and run it responsibly. JSOM operations can permanently create, update, or delete data, list items, taxonomy terms, and user profile properties depending on the logic you execute. Test in a non-production site first and ensure you have proper backups and permissions. You are responsible for the changes this code makes. Compatible with classic and modern SharePoint pages, including SharePoint 2013 classic pages, when executed in a browser that supports the JavaScript features used by the loader.

Review the rendered code before running it. If you see any HTML encoding such as `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, or `=&gt;`, send this follow-up prompt:
`Send code without any HTML encoding and make sure its rendered in response without encoding`
