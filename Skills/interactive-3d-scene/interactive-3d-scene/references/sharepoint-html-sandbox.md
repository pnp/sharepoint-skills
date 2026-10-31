# SharePoint HTML sandbox contract

SharePoint renders `.html` files from OneDrive and document libraries in its HTML viewer (`https://<tenant>.sharepoint.com/_html`). The page runs in a sandboxed frame under a strict Content Security Policy. Anything that breaks the rules fails silently: the page loads but the feature does nothing. Your tenant publishes the current rules at `/_html/llms.txt` and `/_html/help.json`. Check them when something behaves differently from this page.

## Asking for the 3D library
The viewer has a short list of first-party libraries it can inject. Declare the ones you need by name, before any other script:

```html
<script type="application/json" class="ka-lib-manifest">["babylon"]</script>
```

- The host fetches its own copy, verifies its integrity, and injects it inline. `window.BABYLON` is then available to your scripts.
- Do not add a version or URL. The host chooses the version and ignores anything else.
- Other names on the list include `chart.js`, `mermaid`, `react` and `fluentui`. This skill only needs `babylon`.
- The host limits how many libraries a page can request and how large they can be. Ask for one library only.
- Treat the library as optional. If it is missing, too old, or WebGL is unavailable, the page must still work with the SVG fallback. See [fallback-and-performance.md](fallback-and-performance.md).

## The policy, in practice
The viewer's policy is close to this:

```
default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline';
img-src data: blob:; font-src data: blob:; connect-src 'none'; worker-src 'none';
object-src 'none'; base-uri 'none'; form-action 'none'
```

| You want to | Do this | Never this |
| --- | --- | --- |
| Run code | One inline `<script>` | `<script src>`, `type="module"`, `import()` |
| Style | One inline `<style>` | `<link>`, `@import`, remote fonts |
| Images and textures | Inline SVG, CSS gradients, `data:` URIs, canvas-generated textures | `https://` images, `url(https://...)` |
| Sound | Web Audio synthesis (see [procedural-audio.md](procedural-audio.md)) | Audio files from any URL |
| Data | Hard-code it in the script | `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon` |
| Remember state | The URL hash (read only), or in-memory variables | `localStorage`, `sessionStorage`, `indexedDB`, cookies |
| Talk to the user | The `role="status"` line and buttons | `alert`, `confirm`, `prompt`, `<form>`, pop-up windows |
| Background work | `requestAnimationFrame`, `setTimeout` | Web workers, service workers |
| Fonts | System font stack: `"Segoe UI", Aptos, Arial, sans-serif` | Web fonts |

Also avoid inline event attributes such as `onclick="..."`. Attach listeners from the script.

## The sandbox
The page runs without same-origin rights. That means:
- Storage APIs throw or return nothing, so never depend on them.
- `window.top`, `parent` and history changes are off limits. Read `location.search` and `location.hash` for flags, but do not write to them.
- `AudioContext` works, but only after a user gesture, like any browser. Keep sound off by default.
- Pointer, keyboard, `matchMedia`, `IntersectionObserver` and `visibilitychange` all work.

## File rules
- One file, saved as UTF-8 **with a BOM**, so curly quotes and other non-ASCII characters render correctly.
- Aim for under 150 KB. The 3D library does not count, because the host injects it.
- `<html lang="...">`, `<meta charset="utf-8">` and a viewport meta tag.
- No email addresses, no tracking, no hidden text.

## Check before you save
Search the file for each pattern below. Each must have zero matches:

```
<script src   <link   http://   https://   @import   url(http
fetch(   XMLHttpRequest   WebSocket   EventSource   sendBeacon
localStorage   sessionStorage   indexedDB   document.cookie
<form   alert(   confirm(   prompt(   new Worker   onclick=
```

## Testing outside SharePoint
To preview locally the way the viewer runs it:
1. Serve the file with the policy above as a `Content-Security-Policy` header.
2. Insert the Babylon.js build inline, in a `<script>` right after the manifest line. This mimics what the host injects. Do this only in the test copy, never in the file you deliver.
3. Load the page inside `<iframe sandbox="allow-scripts">` to reproduce the missing same-origin rights.
4. Load it once more without the library to see the fallback.
5. Watch the console. A single CSP violation or uncaught error is a failure.
