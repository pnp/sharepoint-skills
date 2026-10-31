# Demo mode

Demo mode turns the page into a hands-free, repeatable performance for screen recordings, social clips and kiosk loops. It is the same file with URL flags, so there is nothing extra to maintain.

## Flags
Flags work in the query string or the hash, which matters because some hosts drop query strings. Use `#demo=1` if `?demo=1` does not survive.

| Flag | Effect |
| --- | --- |
| `demo=1` | Hide page chrome and cursor, frame the stage, play every reaction on a timeline |
| `aspect=9x16` | Vertical 9:16 frame instead of 16:9 |
| `sound=0` | Silent demo. Without it, demo mode tries to start sound (see below) |
| `mode=2d` | Force the SVG fallback, also outside demo mode |
| `seed=N` | Change the random seed for particles and sound grains. Default 7 |

Examples:

```
scene.html?demo=1
scene.html?demo=1&aspect=9x16
scene.html#demo=1&sound=0&mode=2d
```

## What changes in demo mode
- `body.demo` (and `body.portrait` for 9:16) hide every `.chrome` element and the cursor.
- The stage is fixed in the centre of the window at exactly 16:9 or 9:16 and as large as fits. Size the browser window to the same ratio for a clean capture, for example 1280×720 or 720×1280.
- Camera input is not attached and idle drift is off, so every run is identical.
- The WebGL canvas keeps its drawing buffer, so screenshots of the canvas are never blank.

## Timeline
Objects play in config order. With `demo:{hold:3, step:2.5, tail:2}` and four objects:

```
0.0 s   scene settles (hold)
2.1 s   camera starts drifting toward object 1
3.0 s   object 1 reacts
5.5 s   object 2 reacts
8.0 s   object 3 reacts
10.5 s  object 4 reacts
15.0 s  done (last event + step + tail)
```

The camera begins moving 0.9 s before each event, and the reaction fires exactly at the listed time, so you can cut a video on those timestamps.

## Hooks for recording tools

| Hook | Value |
| --- | --- |
| `window.__demoTimeline` | `{total, hold, step, aspect, renderer, events:[{t, act, label}]}`, set at start. `renderer` is `3d` or `2d` |
| `window.__demoAudio` | `running`, `suspended` or `unavailable` |
| `window.__demoDone` | `true` when the timeline has finished |
| `window.__demoElapsed` | Seconds from start to done, measured by the page |
| `demo:done` event | `CustomEvent` on `window`, `detail` is the timeline |

A headless recorder can read `__demoTimeline.total`, record for that long, then wait for `__demoDone`. Use the event times for captions or chapter marks.

## Recording tips
- Use a Chromium-based browser with the GPU enabled. In a container, software WebGL (SwiftShader) works but is slow, so record at 30 fps.
- Start the browser with `--autoplay-policy=no-user-gesture-required` if you want sound in the capture, and check `__demoAudio` is `running`.
- Record the 2D fallback too (`mode=2d`) if the clip may be shown where WebGL is off.
- Keep `hold` at 2 to 3 seconds so viewers can read the scene before anything moves.

## Adding demo mode to an existing scene
1. Read flags from both `location.search` and `location.hash`.
2. Put every element outside the stage in a `.chrome` class and hide it under `body.demo`.
3. Build the event list from the same object list the buttons use.
4. Drive each event through the same `run(act)` function as a click, so demo and live behaviour cannot drift apart.
5. Replace `Math.random()` with a seeded generator.
6. Expose the hooks above and fire `demo:done`.
