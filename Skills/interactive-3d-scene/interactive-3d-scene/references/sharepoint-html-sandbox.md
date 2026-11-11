# SharePoint HTML sandbox contract

SharePoint renders `.html` files from OneDrive and document libraries in its HTML viewer (`https://<tenant>.sharepoint.com/_html`). The page runs in a sandboxed frame under a strict Content Security Policy. Anything that breaks the rules fails silently: the page loads but the feature does nothing. Your tenant publishes the current rules at `/_html/llms.txt` and `/_html/help.json`. Check them when something behaves differently from this page.

## Asking for the 3D library
The SharePoint HTML viewer can supply a short list of libraries. For this skill, ask for Babylon.js by name, before any other script:

```html
<script type="application/json" class="ka-lib-manifest">["babylon"]</script>
```

- This manifest is the default loader for the SharePoint file. A stripped-down, bundled or inlined Babylon.js runtime is not required in that file.
- Self-contained means the HTML file holds the scene, the script, the styles and the drawn assets. Babylon.js stays outside the file on this path.
- Do not add a version or a URL. The SharePoint file does not choose the build.
- The host picks the version, and Microsoft can change it at any time. Community tests in November 2026 measured Babylon.js 8.56.2, one major release behind the current one. Read `BABYLON.Engine.Version` at runtime if you need to know.
- Use core APIs only: `MeshBuilder`, `StandardMaterial`, lights, `GlowLayer`, `ParticleSystem` and animations. Do not rely on model loaders, the GUI package or anything else that needs an extra Babylon.js package.
- When the page's own script starts 3D, use `window.BABYLON` only if it exists and has `Engine` and `MeshBuilder`. Check WebGL with `BABYLON.Engine.isSupported()` when that function exists. Do not assume a library version, and do not assume when the host assigns `window.BABYLON`.
- Other names on the list include `chart.js`, `mermaid`, `react` and `fluentui`. This skill only needs `babylon`.
- The host limits how many libraries a page can request and how large they can be. Ask for one library only.
- Let errors show while you test. Do not wrap calls in an empty `catch(e){}`, because a broken scene then just goes blank with nothing in the console. The template logs a `[3D scene]` warning instead, including why it fell back to 2D.
- Treat the library as optional. If it is missing, if those constructors are missing, or if WebGL is unavailable, the page must still work with the SVG fallback. `mode=2d` forces that drawing even when the library is present, but only when the file is opened directly. Inside SharePoint the page runs in an inner frame that does not see the page address, so `mode=2d` and `demo=1` are ignored there. To see the fallback inside SharePoint, upload a test copy without the `ka-lib-manifest` line. See [fallback-and-performance.md](fallback-and-performance.md).
- On 6 November 2026, I tested the original HTML scenes in SharePoint with Babylon.js loaded through ka-lib-manifest. They rendered in true 3D, with camera pan and orbit, without bundling the library into the HTML file.
- The starter and sample files keep a limited orbit with target panning disabled; that is a scene choice, not a SharePoint restriction.

## Optional copies
A page with no host manifest can use an optional compatibility route. Neither route belongs in the SharePoint file, and this skill does not ship a bundle.

- A separate public page may load one pinned Babylon.js build from a CDN. See [public-hosting.md](public-hosting.md). That CDN stays on the public copy. It is not a SharePoint file URL, and it is not proof that an arbitrary CDN is allowed in the viewer.
- A local test copy may include a Babylon.js build so `window.BABYLON` exists during preview. Keep that build out of the file you deliver.

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
- Aim for under 150 KB. On the supported path the Babylon.js runtime is not part of the file, so it is not part of that budget.
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
The supported check is the unmodified file in the SharePoint HTML viewer. To preview locally in a similar sandbox:
1. Serve the file with the policy above as a `Content-Security-Policy` header.
2. For that local preview only, you may insert a Babylon.js build in a `<script>` right after the manifest line so `window.BABYLON` exists. Do this only in the test copy, never in the file you deliver. That local script is a preview aid. It is not the SharePoint loader.
3. Load the page inside `<iframe sandbox="allow-scripts">` to reproduce the missing same-origin rights.
4. Load it once more without the library, and once with `?mode=2d`, to see the fallback. This local check is where `mode=2d` works; SharePoint ignores URL flags.
5. Watch the console. A single CSP violation or uncaught error is a failure.
