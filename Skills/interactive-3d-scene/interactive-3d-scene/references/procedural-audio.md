# Procedural audio

Audio files cannot be loaded in the SharePoint viewer, and they would make the page heavy. The template synthesizes every sound with the Web Audio API instead: oscillators and filtered noise, shaped by short envelopes.

## Rules
1. **Off by default.** Show a `Sound: off` button with `aria-pressed="false"` and the **M** shortcut. Create the `AudioContext` only inside that click or key handler.
2. **Hide the button when there is no Web Audio** (`window.AudioContext || window.webkitAudioContext` is missing).
3. **Never fail loudly.** Wrap context creation, `resume()` and every sound in `try`/`catch`, and attach `.catch()` to the `resume()` promise. If sound cannot start, say so in the status line and leave the button off.
4. **One master gain** at about 0.7. Every sound connects to it, so a single change turns everything down.
5. **Short and soft.** Effects last 0.1 to 2.2 seconds. Peaks stay at or under 0.6 before the master gain. An ambient pad, if any, sits at about 0.06 and fades in over 2 seconds.
6. **Sound is decoration.** Every reaction must make sense with sound off: the status line always says what happened.
7. **Deterministic noise.** Fill the noise buffer from the seeded `rnd()` function, not `Math.random()`, so recordings repeat exactly.

## Building blocks

```js
function env(g,t,a,peak,d){            // attack-decay envelope on a GainNode
 g.gain.setValueAtTime(0.0001,t);
 g.gain.exponentialRampToValueAtTime(peak,t+a);
 g.gain.exponentialRampToValueAtTime(0.0001,t+d);
}
tone(c, type, freq, start, attack, peak, duration, endFreq)       // oscillator, optional glide
hiss(c, filterType, freq, endFreq, q, start, attack, peak, duration)  // filtered noise
```

## Recipes in the template

| Name | Use for | Recipe |
| --- | --- | --- |
| `chime` | Lights, magic, success | Three sine partials at 880, 1320 and 1760 Hz, 60 ms apart, 1.6 s decay |
| `pop` | Gifts, bubbles, buttons | Triangle drop from 520 to 140 Hz in 0.25 s, plus a 80 ms high-pass click |
| `whoosh` | Movement, launches, wind | Band-pass noise sweeping 300 to 2400 Hz over 0.9 s |
| `boom` | Fireworks, reveals, flashes | High-pass crack, then low-pass noise falling 700 to 60 Hz over 2.2 s |
| `rustle` | Trees, paper, fabric | Five 180 ms band-pass noise grains at random pitches |
| pad | Ambience while sound is on | Two detuned sines a fifth apart (196 and about 294 Hz) at very low gain |

To add a sound, add one function to `SFX` that takes the context and schedules nodes from `c.currentTime`. Keep each one under about 10 nodes.

## Demo mode and autoplay
In demo mode the template tries to start sound without a click so recordings have audio. Browsers allow that only when autoplay is permitted, for example a headless browser started with `--autoplay-policy=no-user-gesture-required`. The result is exposed as `window.__demoAudio` (`running`, `suspended` or `unavailable`). If it is not `running`, the template turns sound off for the rest of the demo and does not keep retrying. Add `sound=0` to the URL for a silent recording.

## Accessibility
- The button text and `aria-pressed` both change, and the status line announces "Sound on." or "Sound off.".
- Do not autoplay sound outside demo mode, even if the browser would allow it.
- Avoid sudden loud transients. Keep the `boom` peak at the template level or lower.
