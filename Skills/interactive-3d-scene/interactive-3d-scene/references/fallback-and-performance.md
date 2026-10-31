# Fallback and performance

The 3D scene is an enhancement. The SVG drawing is the page, and it must stand on its own.

## When the fallback shows
The SVG is visible by default. The script switches to 3D only when all of these are true:
1. `mode=2d` is not in the URL.
2. `window.BABYLON` exists and has `Engine` and `MeshBuilder`, meaning the host injected the library.
3. `BABYLON.Engine.isSupported()` reports WebGL.
4. Creating the engine and scene does not throw.

Only then does it add `is-3d` to the stage, which hides the SVG and shows the canvas. If anything throws, it removes the class and keeps the drawing. Scripts turned off entirely also leave the drawing, plus a `<noscript>` note.

The mode line tells people which one they see: "Moving scene..." or "Still view...".

## Making the drawing good
- Use a `1600×900` `viewBox`, so it has the same 16:9 frame as the 3D stage.
- One `<g class="svgobj" data-act="...">` per object, drawn with simple shapes in the same colours and left-to-right order as the 3D layout.
- Add a `<title>` inside the SVG, describing the scene, and `role="img"`.
- Ambient particles are a few `<circle>` elements in a `.amb` group that drift with a CSS animation. Reduced motion hides them.
- Reactions are CSS classes (`go-glow`, `go-bounce`, `go-shake`, `go-spin`, `go-burst`) added for about 1.7 seconds. `flash` uses the shared screen flash overlay.
- Set `transform-box: fill-box` and `transform-origin: 50% 100%` on `.svgobj`, so objects bounce and shake from their base.
- Check it on its own with `?mode=2d`. It should look finished, not like a placeholder.

## Performance budget
The scene must stay smooth on a mid-range laptop and a phone, inside a SharePoint page that may have other web parts.

| Area | Budget |
| --- | --- |
| HTML file | Under 150 KB |
| Objects | 3 to 6 tappable objects, 2 to 6 primitives each |
| Lights | One hemispheric, one directional, one point light used only for flashes. No shadows |
| Materials | `StandardMaterial`, low specular, no textures from files. Share materials within an object |
| Particles | Ambient: one mesh with thin instances, about 60 to 90. Sparks: a pool of 48 thin instances, reused |
| Post effects | None. No glow layer, bloom, SSAO or depth of field |
| Resolution | Device pixel ratio capped at 1.5 (1.25 under 560 px wide). Lowered in 0.25 steps, down to 0.75, if FPS stays under 26 |
| Picking | Taps only, plus mouse hover throttled to every 120 ms. `skipPointerMovePicking = true` |
| Rendering | Paused when the tab is hidden (`visibilitychange`) or the canvas scrolls out of view (`IntersectionObserver`) |
| Fog | Exponential fog fades the large ground plane into the fog colour, so its edge never shows. Set `fog` close to `sky` for a seamless horizon, or a little lighter for a soft glow line |

## Reduced motion
When `prefers-reduced-motion: reduce` matches (and when it changes while the page is open):
- `bounce`, `shake` and `spin` become `glow`.
- Ambient particles stop and hide, both in 3D and in the SVG.
- Sparks shrink to a few slow ones, the flash is softer, and idle camera drift stops.
- Demo camera moves become instant.
Nothing is removed. Every reaction still gives visible feedback and a status line.

## Responsive layout
- The stage keeps 16:9 with `aspect-ratio`, inside a column of at most about 1180 px.
- Buttons wrap, stay at least 44×44 px, and the page never scrolls sideways at 390 px wide.
- On portrait screens the camera switches to a horizontal field of view, so objects within x ±7 m stay in frame.

## Test matrix
Run each one with the browser console open. Zero errors, zero CSP violations, zero network requests:

| Test | How | Pass when |
| --- | --- | --- |
| 3D | Library injected | Mode line says moving scene, every object reacts to a tap and a button |
| Fallback | No library | Drawing visible, every SVG group and button reacts |
| Forced fallback | `?mode=2d` with library | Same as fallback |
| Sandbox | Page in `<iframe sandbox="allow-scripts">` | 3D still starts, buttons work |
| Keyboard | Tab, Enter, Space, 1 to N, M | Focus ring visible, reactions and sound toggle work |
| Sound | Click the sound button twice | No `AudioContext` before the click, `aria-pressed` flips, status announces it |
| Reduced motion | Emulate `prefers-reduced-motion` | Glow instead of movement, no ambient particles |
| Phone | 390×844 | No horizontal scroll, buttons at least 44 px |
| Demo | `?demo=1`, then `&aspect=9x16` | Chrome hidden, `__demoDone` becomes true at `__demoTimeline.total` |
