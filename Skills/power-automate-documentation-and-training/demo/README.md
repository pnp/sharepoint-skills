# Demo: weekly site request intake (fictional)

Everything here is fictional and industry-neutral. Do not upload this folder with the skill package.

## sample-files

| File | What it is |
| --- | --- |
| `site-request-intake.solution.zip` | A fictional solution export: weekly trigger, a variable, Get items, a parallel Compose, Apply to each with a condition, a Do until loop with an HTTP check, a Switch with an empty default, and a Scope that runs on failure. It contains planted fake secrets so masking can be tested. |
| `site-request-intake.masking.md` | The masking table, with redacted previews. |
| `site-request-intake.masking-map.json` | The approved map (fingerprints and replacements, no real values). |
| `site-request-intake.graph.json` | The masked step graph. |
| `site-request-intake.content.yaml` | The handoff file the chat would write. |
| `site-request-intake.html` | The generated page. Open it from a SharePoint library, or locally with D3 and Chart.js available. |

## tools

Local helpers. They are not part of what Copilot runs.

```
python3 tools/parse_flow.py export.zip --report-md masking.md --map-out map.json
# review map.json, edit replacements, set "approved": true
python3 tools/parse_flow.py export.zip --map map.json -o graph.json
python3 tools/build_page.py --graph graph.json --map map.json --content content.yaml -o page.html
python3 -m unittest discover -s tools/tests
python3 tools/tests/browser_check.py page.html --shots shots/
```

`browser_check.py` and `robustness_check.py` need Playwright, Chrome, and local copies of D3 7.9.0 and Chart.js 4.6.1 (`--libs DIR`).

```
python3 tools/tests/robustness_check.py --libs DIR
```

## Verification cases

`browser_check.py` clicks through a generated page at 1280 and 390 pixels wide: every step anchors its card, quick checks lock the next step until answered, the finish screen and doughnut render, Back, Whole flow, Replay, and `#step=2` / `#done` restore work, there are no storage writes, network requests, or console errors, and the page falls back to plain text when D3 never arrives.

`robustness_check.py` builds variants of the template's sample data and checks:

| Case | Expected |
| --- | --- |
| Markup and quotes in titles, cards, quiz options, guardrails, and checklist text | Shown as text; no injected element or handler; no script runs |
| Empty or missing `steps`, a duplicate id, a blank `title` or `what`, an unknown `kind` | The page lists the problem and does not start or show the sample |
| A quiz with no right answer, two right answers, one option, or blank feedback | Same |
| An unknown parent, a child before its parent, a blank `cfg` value, a blank guardrail or checklist item, an unknown id in `parts` | Same |
| One step with no guardrails, checklist, parts, or quiz | The page runs; the finish screen has no guardrail cards and no doughnut |
| Reduced motion at load, switched on later, and switched off again | Steps add instantly while it is on; animation returns when it is off |
| Keyboard | Tab reaches the toolbar, Enter adds a step, arrow keys add and remove, Escape collapses the card |
| The page inside a `sandbox="allow-scripts"` frame | It starts and adds steps with no console errors |
| The styles SharePoint adds when Copilot saves the page (`tools/tests/fixtures/sharepoint-wrapper-styles.html`), placed before and after the template's styles, with and without D3 | Header title, eyebrow, and lede keep a contrast of at least 4.5:1 on the navy header, and every visible element keeps its own colors, fonts, and spacing on the first card, a quick check, and the finish screen |

What these do not cover: live Copilot generation (tested by hand in Copilot in SharePoint), screen readers, high contrast, and zoom.
