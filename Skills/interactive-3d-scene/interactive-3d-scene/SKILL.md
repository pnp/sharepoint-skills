---
name: interactive-3d-scene
description: Build a self-contained, clickable 3D scene as one HTML file that runs in the SharePoint HTML viewer, using the host's built-in Babylon.js library, with a 2D drawing fallback, optional procedural sound, keyboard access, reduced motion and a recording-ready demo mode. Use when the user says make an interactive 3D scene, build a clickable seasonal page, create a festive scene for our intranet, make a holiday or celebration scene people can tap, make a 3D product launch page, or turn this theme into an interactive scene.
---
# Interactive 3D Scene

## When to use
Use this skill when someone wants a playful page that people explore and tap: a seasonal greeting, a team celebration, a product launch, an event teaser, a campaign moment, or a "thank you" page for a site. The output is one `.html` file that renders inside SharePoint's HTML viewer (`/_html`) with no external files.

Do not use it for data dashboards, reports or documents. Use `sharepoint-safe-html` for static, no-script pages.

## Inputs
- A theme or occasion, for example "winter office celebration" or "launch of version 2.0".
- Optional: 3 to 6 objects people can tap, a headline, brand colours, tone, and whether sound and a recorded demo are wanted.
- If the user gives nothing beyond a theme, choose 4 or 5 objects that suit it. Write all text yourself in plain, inclusive language. Do not invent names, quotes or numbers about real people or companies.

## Output
- One UTF-8 `.html` file (with BOM), ideally under 150 KB, saved where the user asks, by default the site **Site Assets** or **Documents** library.
- The page shows a 3D scene when the viewer injects the library, and the same scene as a flat SVG drawing when it does not.
- Every reaction can be triggered by a tap in the scene, by a button, and by a number key.

## Steps
1. **Start from the template.** Copy [`templates/starter-scene.html`](templates/starter-scene.html). It already passes the host rules and contains the sandbox contract, fallback, sound, keyboard, reduced motion and demo mode. Change content, not plumbing.
2. **Plan the objects.** Pick 3 to 6 tappable objects. For each one decide: an `act` id (lowercase, one word), a button label (a verb: "Light the tree"), a reaction (`glow`, `bounce`, `shake`, `spin`, `flash`, `burst`, combinable), a sound (`chime`, `pop`, `whoosh`, `boom`, `rustle`, `none`) and 2 or 3 short status lines.
3. **Edit only these parts of the template:**
   - the `:root` theme colours and the page background glow;
   - `<title>`, kicker, `<h1>` and the canvas `aria-label` and `figcaption`;
   - the `SCENE` config block (colours, ambient particles, objects built from primitives, lines, demo timing);
   - the SVG fallback drawing, with one `<g class="svgobj" data-act="...">` per object using the same `act` ids.
   See [`references/clickable-scene-pattern.md`](references/clickable-scene-pattern.md) for the config fields, layout rules and how picking works.
4. **Keep the host contract.** No `<script src>`, `<link>`, remote URLs, `fetch`, storage, workers, forms, `alert` or `confirm`. Keep the `ka-lib-manifest` line before any other script. Details in [`references/sharepoint-html-sandbox.md`](references/sharepoint-html-sandbox.md).
5. **Sound stays off until the user turns it on.** Use the template's Web Audio recipes. Never ship audio files. See [`references/procedural-audio.md`](references/procedural-audio.md).
6. **Keep the fallback and budget.** The SVG must look finished on its own, and the 3D scene must stay light: capped pixel ratio, no shadows, few lights, pooled particles, paused when hidden. See [`references/fallback-and-performance.md`](references/fallback-and-performance.md).
7. **Check accessibility.** Buttons are real `<button>` elements at least 44 px high, every reaction is announced in the `role="status"` line, number keys and **M** work, and `prefers-reduced-motion` turns movement into a gentle glow.
8. **Offer demo mode for recordings.** `?demo=1` (or `#demo=1`) plays every reaction on a fixed timeline with the page chrome hidden, `&aspect=9x16` gives a vertical frame. See [`references/demo-mode.md`](references/demo-mode.md).
9. **Self-check before saving.** Run the checklist below. Save the file as UTF-8 with BOM.
10. **Public copy only on request.** If the user wants the scene on a public website, make a separate copy that loads a pinned Babylon.js build from a CDN, as described in [`references/public-hosting.md`](references/public-hosting.md). Never put a CDN URL in the SharePoint file.

## Self-check
- Search the file for `<script src`, `<link`, `http://`, `https://`, `@import`, `fetch(`, `XMLHttpRequest`, `WebSocket`, `localStorage`, `sessionStorage`, `<form`, `alert(`, `confirm(`. None may appear, except inside comments that you then remove.
- Every `act` id appears in the `SCENE.objects` list and in exactly one SVG group.
- Opening the file with `?mode=2d` shows the drawing, and every button still reacts.
- Nothing from the template's sample theme, or from another theme you used as an example, is left in the text, colours or aria labels.

## Guardrails
- Do not add tracking, analytics, timers that call home, or anything that reads the user's identity.
- Do not use copyrighted characters, logos or brand marks unless the user confirms they own them.
- Keep content suitable for a workplace: friendly, not frightening, and readable by screen readers.
- Do not publish, share or overwrite a page without the user confirming the destination.

## Example
Halloween Haunt is one finished example of this pattern: more than a dozen tappable objects, a camera cruise, sound and a demo mode. It lives in the `demo/sample-files/` folder of the GitHub repository, next to a winter office celebration and a product launch built from this skill's template. Use the examples to judge the level of polish. Do not copy their themes, text or objects into a new scene.
