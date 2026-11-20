# The DATA block

The template reads one object, `var DATA={...};`, placed between `/*FLOW_DATA_BEGIN*/` and `/*FLOW_DATA_END*/`. `build_page.py` writes it from the step graph and the handoff file. When Copilot fills the template by hand, it writes the same object. Keep it ASCII: write `\u00b7` for a middle dot and `\u2713` for a check mark, and never write `</` inside a string (write `<\/`).

```js
var DATA={
 "meta":{"title":"...","eyebrow":"...","lede":"...","summaryHeading":"You built the flow","summaryLead":"..."},
 "steps":[ /* one object per step, in build order (see below) */ ],
 "parts":[{"title":"Get the episode","steps":["When_a_feed_item_is_published"]}],
 "guards":[["Title","One or two sentences."]],
 "checks":{"title":"What you covered","center":"covered","caption":"...","items":[{"t":"...","done":true}]}
};
```

## Step objects

| Field | Use |
| --- | --- |
| `id` | The action name from the export. Empty arms use `<Condition>__empty_<yes/no/default>`. |
| `kind` | `node` (trigger or action), `loop` (Apply to each, Do until, Scope), or `cond` (Condition or Switch). |
| `trigger` | `true` on the first step. Adds the START sticker. |
| `loop` | `foreach`, `until`, or `scope` on loop steps. |
| `parent`, `branch` | The container id and branch: `actions` inside loops, `yes` / `no` for conditions, `case:<name>` / `default` for switches. Leave both out at the top level. |
| `armName`, `armLabel` | On the first step of each arm: `YES` and `YES \u00b7 new item`. |
| `title`, `sub`, `k` | Node title, the small second line, and the card kicker. |
| `icon`, `iconBg` | Up to three characters and a color for the node badge. |
| `what`, `why`, `cfg`, `tip` | Card copy. `cfg` is a list of `[label, value]`. |
| `crumb` | `[previous, next]` shown as "previous -> this step -> next". |
| `quiz` | `{"ask":"...","opts":[{"t":"...","ok":true,"fb":"..."}]}` with exactly one `ok`. |
| `guard` | `[number, "Guardrail title"]`. |
| `onFailure` | `true` when the step runs only after a failure. Adds an ON FAILURE sticker. |
| `empty` | `true` for a generated "No action" arm. Drawn in grey. |
| `packet` | A short label that travels down the arrow into the step. |
| `laps` | Do until only: the status pill text for each lap; the last one means "done". |
| `counter` | Apply to each only: `{"label":"items","count":12}`; items fan into the box. |

## Data check

The template checks `DATA` before it draws anything. If a rule fails, the page shows "This page cannot start: the flow data has a problem" with one line per problem, for example `Step 3 (Create_item): what is empty.`, and it does not fall back to the sample flow. The rules:

- `steps` has at least one step.
- Every step has a unique `id`, a `kind` of `node`, `cond`, or `loop`, and a filled-in `title`, `what`, and `why`.
- `cfg`, when present, is a list of `[label, value]` pairs with both filled in. `crumb`, when present, is `[previous, next]` with both filled in. `guard`, when present, is `[number, title]`.
- A `parent` is the id of a `loop` or `cond` step that comes earlier in the list. Steps inside a loop use the branch `actions`; steps inside a condition or switch have a branch.
- A `quiz` has an `ask`, two or three options, each with `t` and `fb`, and exactly one option with `"ok":true`.
- Every guardrail in `guards` has a title and a text, every checklist item has `t`, and every id listed in `parts` is a step id.

`guards`, `checks`, `parts`, `quiz`, `tip`, `crumb`, `guard`, and the animation fields are optional. With no guardrails the finish screen has no guardrail cards, and with no checklist items it has no doughnut.

All text in `DATA` is escaped before it is written into the page, so markup in a step title or a quiz option shows as text. Use only the two inline styles the engine supports: `**bold**` and `` `code` ``.

## Build order

List steps depth first: a container, then everything inside it, then the next sibling. For a condition: the condition, the whole YES arm, then the whole NO arm. The page uses this order for `#step=N` and for "Whole flow". The learner can build the arms of a condition in either order; the step after the condition unlocks only when every arm is built.

## Layout

There are no coordinates in `DATA`. The template stacks steps top to bottom, draws loops as dashed boxes around their inner steps, splits conditions and switches into side-by-side arms, merges the arms before the next step, and keeps the card clear of the surrounding box.
