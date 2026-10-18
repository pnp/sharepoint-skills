---
name: jsom-modern-compatibility
description: |-
  Generate ready to copy JSOM (JavaScript Object Model) code that runs on both classic and modern SharePoint pages, including SharePoint 2013 classic pages, by ensuring required SharePoint JavaScript dependencies are loaded before business logic runs.

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
Use this skill when the user asks to:
- write, fix, or run JSOM code;
- fetch or update SharePoint list or library data with JSOM;
- use taxonomy, user profiles, or search with JSOM;
- resolve errors such as `SP is not defined`, missing `sp.js`, or missing SharePoint client-side libraries on modern pages.

## Output requirements
Every answer that returns runnable code must include:
1. exactly one complete runnable JavaScript code block;
2. the full compatibility loader plus the requested business logic;
3. short run instructions outside the code block;
4. the safety footer outside the code block.

Do not split one runnable script across multiple code blocks.
Do not place explanatory prose inside the code block.

## Encoding requirements
This requirement is critical.

Generated code must not be HTML-encoded unless the user explicitly asks for encoded output.
The default must always be raw, runnable JavaScript that can be copied directly into the browser console.
If encoded characters appear in operators, strings, template literals, conditions, or function bodies, the script is invalid for this skill.

Always use raw JavaScript syntax in runnable code, never HTML entity encoding.

Examples of invalid encoded output in runnable code:
- HTML entity encoded logical operators
- HTML entity encoded comparison operators
- HTML entity encoded quotes
- HTML entity encoded arrow functions

Examples of required raw JavaScript syntax in runnable code:
- logical AND operator written with raw ampersands
- comparison operators written with raw angle brackets
- quotes written as normal JavaScript quotes
- arrow functions written with the normal JavaScript arrow operator

Before finalizing the answer, perform a self-check on the generated code block and replace any accidental HTML entities with raw JavaScript characters unless those entities came from the user's own content or instructions.
If any HTML entity appears in the runnable code block, rewrite the code block before sending it to the user.

## Renderer-safe output requirement
This requirement is very important and mandatory.

The runnable JavaScript code block must remain valid after chat rendering and copy/paste.
Make sure the rendered code block does not include any HTML encoding.
Operators and syntax must render exactly as JavaScript operators and syntax, not as HTML entities.
For example, `&` must never render as `&amp;` in runnable code.

Before sending the response, scan the final code block for encoded entities such as:
- `&lt;`
- `&gt;`
- `&amp;`
- `&quot;`
- `&#39;`
- `=&gt;`

If any of these appear in runnable or rendered code and they did not come from the user's own content or instructions, rewrite the script and reshare it without any encoding in rendering.
If Copilot still renders the code block with encoding and you cannot produce a clean runnable code block, it is acceptable to return the runnable JavaScript as plain text instead of a fenced code block so the user receives unencoded code.
When CAML or XML is required and direct markup may render unsafely in chat, prefer safer construction patterns that preserve copy-paste execution.
Prefer classic JavaScript syntax in the boilerplate and generated script when it improves renderer-safe copy/paste reliability.
Do not force unnatural JavaScript patterns unless they are needed to keep the final copied script runnable.

## Dependency-loading rules
Always ensure the core dependency chain is available before executing business logic:
- `init.js`
- `MicrosoftAjax.js`
- `SP.Runtime.js`
- `SP.js`
- `SP.Search.js`
- `SP.Taxonomy.js`
- `SP.UserProfiles.js`

Always load SharePoint JavaScript files relative to the current site, not from the tenant root site unless the current site itself is the root site.

Correct pattern:
- current page: `https://tenant.sharepoint.com/sites/playground/...`
- load from: `https://tenant.sharepoint.com/sites/playground/_layouts/15/SP.Search.js`

Incorrect pattern:
- `https://tenant.sharepoint.com/_layouts/15/SP.Search.js`

Use the current web URL or current site URL as the base for `/_layouts/15/` so the generated script stays scoped to the site where the user is running it.

If the requested task depends on additional SharePoint JavaScript libraries, load those too before running the task.

Examples of additional supporting libraries to consider when relevant:
- `sp.documentmanagement.js`
- `sp.publishing.js`
- `sp.requestexecutor.js`

Do not load unrelated libraries by default. Load extra libraries only when the requested business logic needs them.

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
For delete or destructive operations, include this confirmation block before the destructive action:

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
function loadScript(src) {
  return new Promise(function(resolve, reject) {
    var selector = 'script[src="' + src + '"]';
    var existing = document.querySelector(selector);
    var script;

    if (existing) {
      resolve();
      return;
    }

    script = document.createElement('script');
    script.src = src;
    script.onload = function() {
      console.log('[JSOM Loader] Loaded: ' + src);
      resolve();
    };
    script.onerror = function() {
      reject(new Error('Load failed: ' + src));
    };
    document.head.appendChild(script);
  });
}

async function ensureJSOMLibraries(extraFiles) {
  console.log('[JSOM Loader] Checking environment - classic or modern?');

  var siteBase = window.location.origin;
  var pageInfo = window._spPageContextInfo;
  var core = ['init.js', 'MicrosoftAjax.js', 'SP.Runtime.js', 'SP.js', 'SP.Search.js', 'SP.Taxonomy.js', 'SP.UserProfiles.js'];
  var chain = core.slice(0);
  var i;
  var file;
  var src;
  var hasClassicJsom = false;

  if (pageInfo) {
    if (pageInfo.webAbsoluteUrl) {
      siteBase = pageInfo.webAbsoluteUrl;
    }
  }

  if (siteBase.charAt(siteBase.length - 1) === '/') {
    siteBase = siteBase.substring(0, siteBase.length - 1);
  }

  if (extraFiles) {
    for (i = 0; i < extraFiles.length; i++) {
      chain.push(extraFiles[i]);
    }
  }

  if (window.SP) {
    if (window.SP.ClientContext) {
      if (window.SP.SOD) {
        hasClassicJsom = true;
      }
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
    }
  }

  console.log('[JSOM Loader] Dependencies ensured - ready to run JSOM');
}
```

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

Before sending the response, verify that the JavaScript code block is directly runnable in the browser console without manual cleanup by the user.
Non-technical users must not need to decode entities, repair operators, or fix syntax before running it.

## Final output quality check
Before returning the code block to the user, inspect the full generated script and confirm all of the following:
- no HTML entities appear in runnable JavaScript unless they came from the user's own content or instructions;
- no encoded operators, encoded quotes, encoded comparison symbols, or encoded arrow functions remain;
- no renderer-sensitive encoded entities such as `&lt;`, `&gt;`, `&amp;`, `&quot;`, `&#39;`, or `=&gt;` remain in runnable code;
- the script is syntactically valid JavaScript for direct browser-console execution;
- the dependency URLs are relative to the current site URL;
- the full runnable script is contained in one JavaScript code block;
- explanatory text is outside the code block.

If any check fails, rewrite the script before sending it.
Do not send a partially corrected script.
Do not ask the user to manually decode or repair the code.

## How to run this code
Always include this guidance after the code block:

To run this code:
1. Open your SharePoint page in Chrome or Edge where you want to run this.
2. Press Ctrl+Shift+J on Windows or Cmd+Option+J on Mac to open Developer Tools.
3. Open the Console tab.
4. Copy the full JavaScript code block using the copy button and paste it into the console.
5. Press Enter and watch the `[JSOM]` and `[JSOM Loader]` messages.
6. For delete operations, only click OK in the confirmation dialog if you are sure.

## Mandatory footer
Always end with this warning outside the code block and prefix it with a small warning icon.

⚠️ Custom Code Execution Notice: This is custom JSOM code generated for your SharePoint site. Please review and run it responsibly. JSOM operations can permanently create, update, or delete data, list items, taxonomy terms, and user profile properties depending on the logic you execute. Test in a non-production site first and ensure you have proper backups and permissions. You are responsible for the changes this code makes. Compatible with both classic and modern SharePoint pages when using the provided loader.
