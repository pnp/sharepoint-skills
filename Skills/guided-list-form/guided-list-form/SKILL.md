---
name: guided-list-form
description: "Builds a Guided Form: a conversational, one-question-at-a-time HTML form in Copilot's interactive preview, then adds the answers as a new item to the targeted SharePoint list. Use when the user asks for a Guided Form, a one-question-at-a-time list form, or an animated HTML form for a list."
---
# Guided Form

Create one list item only after Submit and the user confirms the item card in chat. Never auto-submit or create an item when the preview opens. Not for a page web part, SPFx, editing an existing item, or submitting on the user's behalf.

## Copy rule

Load `reference.html` (next to this SKILL.md) and output it byte-for-byte as the HTML preview. The only change allowed is replacing the `FORM_SPEC` object at `var FORM_SPEC={` at the top of the first `<script>`, right after `<div id="gf-root"></div>`, through its closing `};` before the engine IIFE. Leave every other byte unchanged.

A hand-built, substitute, or rewritten form is a failure, even if you loaded `reference.html`. Do not rewrite CSS, change colors or layout, wrap the form in a card, remove animations, add frameworks, or regenerate the HTML.

If `reference.html` cannot be loaded, tell the user it is missing and stop. Do not build a fallback form. If passing it into the preview fails, retry once with the same full HTML (only `FORM_SPEC` replaced). Never improvise. After 2 failed tries, report the error and stop.

Before showing the preview, confirm the output matches `reference.html` except for `FORM_SPEC`. The CSS `:root` line and keyframes `gfS`, `gfI`, `gfO`, `gfB`, and `gfK` must be unchanged. Confirm welcome (eyebrow, title, `N questions · about N min`, Start), letter badges, OK plus "press Enter", and form title only on welcome and review. If a check fails, start over by copying `reference.html`. Do not patch a substitute.

## Steps

1. Read the list columns (display names, exact internal names, types, required flags, descriptions, real choice values). Never invent names or choices. Skip system columns (ID, Created, Modified, Author, Editor), attachments, content type, and person, lookup, image, or calculated columns. If you skip a column, say so once in the chat, not in the form. Include Title as text when it is user-facing.
2. Build `FORM_SPEC`, copy `reference.html`, replace only `FORM_SPEC`. Self-check, then open the filled HTML with `output.preview` and `interactive: true` (required). Say the Guided Form is ready, naming the list. Do not create an item yet.
3. Submit returns the answers as a chat message (hidden inputs named with exact internal names, plus `__payload` JSON of those answers only). The submitted answers do not include the list address. Create exactly one item with the list item create tool in the same list you opened this form for in this conversation, using those exact internal names as keys, only after the user confirms the Add item card. Never claim a write until the tool confirms it. Then say the item was added (include the ID if returned), referring to the list by its display name only. Do not echo the list URL in your reply, and do not repeat answers. If it failed, explain without implying success. The preview finish screen is not proof that Copilot received the answers. If no Create item card appears, say that the answers may not have reached Copilot, and do not imply success.

## FORM_SPEC schema

Keys: `listTitle` (list display name); `formTitle` (optional welcome title, default `listTitle`); `eyebrow` (optional, default "Guided Form", `""` hides it); `estimatedMinutes` (optional, default `Math.max(1, Math.round(fieldCount * 2 / 7))`); `listUrl` (https list URL on this tenant, or `""`); `fields` (`internalName`, `displayName`, `title` (question), `helper`, `type`, `required`; optional `choices` with exact values for `choice`/`multiChoice`, `max` for rating, `format`, `placeholder`, `maxLength`).

Types (missing = `text`): `text` (underline; `format: "email"` for email); `note` (textarea; Enter stays, Ctrl+Enter advances); `choice` (lettered, auto-advances); `multiChoice` (lettered multi-pick, requires OK); `yesno` (Yes/No, auto-advances); `rating` (default 1-5; `max` 5 or 10 only, else 5; starts at 1, ignores `min`); `number` (underline, stored as a number); `hyperlink` (https only, no credentials; `format: "url"` accepted).

The engine escapes with `textContent` and rejects a non-https, cross-tenant, credentialed, or `javascript:`/`data:`/`vbscript:` `listUrl`. There is no `window.tools` or `sendMessage` API. Do not assign raw HTML, echo answers in chat beyond the create tool call, or invent columns, choices, or list names.
