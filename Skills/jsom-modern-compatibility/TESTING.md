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
- The full runnable script is returned in a single JavaScript code block for one-click copy
- Generated code uses actual JavaScript characters and is not HTML-encoded
- Encoded forms such as `&amp;&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, and `=&gt;` do not appear unless they came from the user's own content or instructions
- Rendered operators and syntax appear exactly as JavaScript syntax; for example, `&` never renders as `&amp;` in runnable code
- If a clean code block cannot be rendered without encoding, the response may fall back to plain text code rather than returning an encoded runnable block
- The final returned code block appears only after a quality check for encoding, syntax, site-relative dependency URLs, and renderer-safe output
- Supporting libraries for search, taxonomy, and user profiles are ensured before business logic runs
- SharePoint JavaScript files load from the current site URL, not the tenant root site
- Logging is concise and limited to startup, dependency loading, execution start, success summary, and errors
- Large-list or bulk-operation scripts use throttling-aware patterns such as row limits, paging, targeted queries, and safe chunking
- If batching is used, it should align with official SharePoint guidance; if batching is unclear, the script should fall back to normal JSOM patterns
- Classic pages, including SharePoint 2013 classic pages, remain supported
- The response includes short run instructions and the safety footer with a warning icon
- The footer also tells the user to inspect the rendered code for HTML encoding and gives a follow-up prompt to request a clean resend if needed
- For delete scenarios, a confirmation dialog is included
