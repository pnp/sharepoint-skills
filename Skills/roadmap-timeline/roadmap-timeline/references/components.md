# Component Reference — roadmap-timeline

HTML structure, CSS class names, and computation rules for both rendering modes. All class names and token names match `assets/roadmap-timeline-template.html` exactly.

---

## Shared: Report Header

Rendered above the visualization in both modes. Structure:

```html
<div class="rpt-header">
  <div class="rpt-header-left">
    <div class="rpt-title">Orion Platform · H1 2026 Roadmap</div>
    <div class="rpt-subtitle">Engineering, Product &amp; Marketing tracks · Jan – Jun 2026</div>
  </div>
  <div class="rpt-header-right">Jan 2026 – Jun 2026</div>
</div>
```

Omit `.rpt-subtitle` if `report.subtitle` is absent. Omit `.rpt-header-right` date range in milestones mode (it has no global date span).

---

## Mode 1: Roadmap (Horizontal Swimlane Chart)

### Overall structure

```html
<div class="roadmap-wrap">
  <!-- Month ruler across the top -->
  <div class="roadmap-ruler">
    <div class="ruler-label-col"></div><!-- spacer matching swimlane label column -->
    <div class="ruler-track">
      <div class="ruler-month" style="left:0%;width:16.94%">Jan</div>
      <div class="ruler-month" style="left:16.94%;width:15.30%">Feb</div>
      <!-- one per calendar month within the date range -->
      <!-- today marker label (omit if today is out of range) -->
      <div class="today-label" style="left:47.26%">Today</div>
    </div>
  </div>

  <!-- One row per swimlane -->
  <div class="swimlane">
    <div class="swimlane-label">Engineering</div>
    <div class="swimlane-track">
      <!-- Phase block (has duration) -->
      <div class="phase-block status-on-track" style="left:0%;width:32.79%"
           title="API Gateway · Jan 1 – Mar 1, 2026 · Owner: Alex Kim">
        <span class="phase-label">API Gateway</span>
      </div>
      <!-- Milestone diamond (point in time) -->
      <div class="milestone-diamond status-complete" style="left:32.79%"
           title="Alpha Release · Mar 1, 2026 · Owner: Alex Kim"></div>
    </div>
  </div>

  <!-- Today line (omit if today is out of range) -->
  <div class="today-line" style="left:calc(120px + 47.26% * (100% - 120px) / 100)">
    <div class="today-line-bar"></div>
  </div>
</div>
```

### Month ruler computation

For each calendar month overlapping the date range:

```
month_start = first day of that calendar month (clamped to date_range_start)
month_end   = last day of that calendar month  (clamped to date_range_end)
ruler_left  = ((month_start - date_range_start) / total_days) * 100
ruler_width = ((month_end - month_start + 1)    / total_days) * 100
```

Display only the month abbreviation (Jan, Feb, …). If `ruler_width` < 4%, render the label as empty string to avoid overflow.

### Phase block layout

```
item_left_pct  = ((item.start - date_range_start) / total_days) * 100
item_width_pct = ((item.end   - item.start)       / total_days) * 100
```

Clamp both to 0.00–100.00. Minimum `item_width_pct` = 1.50 (so very short phases are visible). Round to 2 decimal places.

Inline style: `style="left:{item_left_pct}%;width:{item_width_pct}%"`

### Milestone diamond layout

Items with `"milestone": true` or where `item.start == item.end`:

```
item_left_pct = ((item.start - date_range_start) / total_days) * 100
```

Inline style: `style="left:{item_left_pct}%"` (no width — the diamond is centered on the left anchor via `transform:translateX(-50%)`).

### Today-line layout

```
today_left_pct = ((today - date_range_start) / total_days) * 100
```

Clamp to 0.00–100.00. The today-line spans the full chart height and sits above the swimlane tracks (pointer-events: none so it never blocks clicks). The "Today" label appears at the top of the ruler track at the same `left` percentage, and the vertical bar is rendered inside `.roadmap-content` as a separate absolutely-positioned element.

The today-line element uses a CSS `calc()` to account for the fixed-width label column:

```css
left: calc(var(--label-col-w) + {today_left_pct}% * (1 - var(--label-col-w-ratio)));
```

Because this calc is complex, it is simpler to keep the today-line scoped inside `.ruler-track` and `.swimlane-track` (percentage relative to track width), not the outer wrapper. Render the today-line bar as a child of each `.swimlane-track` using `position:absolute; left:{today_left_pct}%; top:0; bottom:0`.

### Status color classes (roadmap)

Phase blocks and milestone diamonds use `status-*` classes for color. See `references/design-system.md` for exact color values.

| Class | Meaning |
|---|---|
| `status-on-track` | Accent color (palette primary) |
| `status-at-risk` | Amber |
| `status-delayed` | Red / negative |
| `status-complete` | Muted gray-green |
| `status-planned` | Subtle tint, dashed border |

### Dependencies (text note)

If `item.dependencies` is non-empty, append a small text note inside the phase block:

```html
<span class="phase-dep">After: Sprint 1</span>
```

No arrow rendering — sandbox constraint.

### Tooltip (JS enhancement)

On mouse hover over a `.phase-block` or `.milestone-diamond`, the native `title` attribute is already present as a fallback. For an enhanced tooltip, use JS to show a `.rdm-tooltip` div with:
- Item title
- Date range (or single date for milestones)
- Owner (if present)
- Status badge

Set tooltip content with `textContent` or text nodes, never `innerHTML`, even when the source `title` attribute was HTML-escaped. Use newline characters between lines and `white-space: pre-line` to preserve the layout.

---

## Mode 2: Milestones (Vertical List)

### Overall structure

```html
<div class="milestones-wrap">
  <!-- Optional phase group heading -->
  <div class="ms-group-heading">Phase 1 · Foundations</div>

  <!-- One card per milestone -->
  <div class="ms-card">
    <div class="ms-date-badge">Mar 15</div>
    <div class="ms-body">
      <div class="ms-header-row">
        <span class="ms-status-dot status-dot--green"></span>
        <span class="ms-title">Environment provisioned</span>
        <span class="ms-owner">Alex Kim</span>
      </div>
      <div class="ms-desc">AWS accounts created, VPC configured, and CI/CD pipeline connected to the main repository.</div>
    </div>
  </div>

  <!-- Another group -->
  <div class="ms-group-heading">Phase 2 · Integration</div>
  <div class="ms-card">
    <!-- ... -->
  </div>
</div>
```

Omit `.ms-group-heading` if no grouping is present. Omit `.ms-owner` if `item.owner` is absent. Omit `.ms-desc` if `item.description` is absent.

### Status dot mapping (milestones mode)

| Status value | Dot class |
|---|---|
| `on-track` | `status-dot--green` |
| `at-risk` | `status-dot--amber` |
| `delayed` | `status-dot--red` |
| `complete` | `status-dot--green` (+ line-through title) |
| `planned` | `status-dot--gray` |

### Date badge format

Format `item.start` as abbreviated day + month: `"Mar 15"`, `"Oct 3"`. Do not include the year unless the timeline spans multiple years, in which case append the two-digit year: `"Mar 15 '27"`.

---

## Summary: What the Skill Pre-Computes

Before emitting any HTML, the skill must calculate and verify:

| Value | Formula | Clamped |
|---|---|---|
| `total_days` | `(date_range_end - date_range_start)` in whole days | — |
| `item_left_pct` | `((item.start - range_start) / total_days) × 100` | 0–100 |
| `item_width_pct` | `((item.end - item.start) / total_days) × 100` | 0–100; min 1.50 |
| `today_left_pct` | `((today - range_start) / total_days) × 100` | 0–100; omit if outside |
| `ruler_left_pct` | `((month_start_clamped - range_start) / total_days) × 100` | 0–100 |
| `ruler_width_pct` | `((month_span_clamped) / total_days) × 100` | 0–100 |

All percentages rounded to 2 decimal places.
