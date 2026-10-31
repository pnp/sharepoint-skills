# Clickable scene pattern

The template turns one `SCENE` config object into three things that stay in sync: 3D objects, SVG fallback groups, and buttons. The `act` id joins them.

```
SCENE.objects[i].act  ->  3D meshes with metadata.act   (tap in the scene)
                      ->  <g data-act="...">            (tap in the drawing)
                      ->  <button data-act="...">       (generated, plus number key i+1)
```

## Config fields

```js
var SCENE={
 name:'Winter office celebration',
 sky:'#0e1b2c', fog:'#1f3a5c', ground:'#dfe9f5', accent:'#9fe3ff',
 ambient:{kind:'fall', color:'#ffffff', count:90},   // fall | rise | float | none
 objects:[
  {act:'globe', button:'Shake the snow globe', color:'#bfe6ff', pos:[-2,0,1.6],
   react:'shake spin', sound:'chime',
   parts:[{t:'cyl',d:2,h:.6,y:.3,c:'#8a5a3c'},
          {t:'sph',d:2,y:1.5,c:'#bfe6ff',glow:true}],
   lines:['Snow swirls inside the globe.','A tiny blizzard, just for you.']}
 ],
 sounds:{on:'Sound on.', off:'Sound off.', none:'Sound isn’t available in this browser.'},
 modes:{live:'Moving scene. ...', still:'Still view: ...'},
 demo:{hold:3, step:2.5, tail:2}
};
```

| Field | Meaning |
| --- | --- |
| `act` | Lowercase id, unique, used in the SVG and buttons. |
| `button` | Visible label. Start with a verb. Keep it under about 28 characters. |
| `color` | Button dot and glow colour. |
| `pos` | `[x, y, z]` in metres. x is right, y is up, +z is away from the camera. Keep x within about -7 to 7 so the object stays in a portrait frame. |
| `react` | One or more of `glow`, `bounce`, `shake`, `spin`, `flash`, `burst`, separated by spaces. |
| `sound` | `chime`, `pop`, `whoosh`, `boom`, `rustle` or `none`. |
| `parts` | Primitives in object space: `box` (`w`,`h`,`dd`), `sph` (`d`), `cyl` (`d`, optional top `dt`, `h`), `cone` (`d`,`h`), `torus` (`d`, `th`). Position with `x`,`y`,`z`, rotate with `rx`,`ry`,`rz` in radians, colour with `c`. `glow:true` marks the parts that light up. |
| `lines` | Two or three status lines, rotated per tap, each under about 70 characters. They are announced to screen readers. |

## Building good objects
- Build each object from 2 to 6 primitives. Simple, chunky shapes read well at small sizes and stay fast.
- Give every object at least one `glow:true` part, so `glow` and reduced-motion reactions are visible.
- Space objects at least 2.5 m apart on x so taps do not hit the wrong one.
- Put something tall or bright at the back (+z, higher y) so the scene has depth.
- Match the SVG drawing to the 3D layout: left-to-right order, colours and rough proportions.

## How taps work
- Every part mesh gets `metadata = {act}` and stays pickable. Ground, particles and sparks are not pickable.
- The scene listens for `POINTERTAP`, not `POINTERDOWN`, so dragging the camera never triggers a reaction.
- On mouse move, a throttled pick (every 120 ms) switches the cursor between `pointer` and `grab`. `scene.skipPointerMovePicking` stays `true` to avoid picking on every move.
- In the SVG, one click listener walks up from the target to the nearest `data-act`.

## Reactions
Each reaction is a short tween driven by the render loop, with no timers per frame:

| Reaction | 3D | 2D fallback | Reduced motion |
| --- | --- | --- | --- |
| `glow` | Emissive pulse on glow parts | `filter` brightness and drop shadow | Same |
| `bounce` | Hop with squash and stretch | `translateY` keyframes | Glow |
| `shake` | Wobble on z | Rotate keyframes | Glow |
| `spin` | One eased turn on y | Rotate 360 | Glow |
| `flash` | Point light pulse plus screen flash | Screen flash | Softer, slower flash |
| `burst` | 24 pooled sparks | Glow | 8 slow sparks |

Every run calls `say()`, which updates the `role="status"` line and the on-stage caption, then plays the object's sound if sound is on.

## Camera
- `ArcRotateCamera` with limits on radius, alpha (about ±1 rad) and beta (never under the ground). Panning is off.
- The camera's keyboard input is removed so arrow keys and numbers belong to the page.
- Landscape uses a vertical field of view, portrait switches to a horizontal one so wide scenes still fit on a phone.
- After 5 seconds without input the camera drifts gently. It stops under reduced motion and in demo mode.

## Page chrome
- Kicker, headline and a one-sentence instruction above the stage.
- Reaction buttons, a sound toggle, a keyboard hint, the status line and a mode line ("Moving scene" or "Still view") below it.
- Everything outside the stage has the class `chrome`, so demo mode can hide it.

## Keyboard
| Key | Action |
| --- | --- |
| Tab, Enter, Space | Move between buttons and press them |
| 1 to N | Trigger object N |
| M | Sound on or off |

Ignore keys while Ctrl, Alt or Meta is held, on repeat, and inside form fields.
