# Accessibility Implementation Reference

Detailed implementation patterns for the [Accessibility Implementation Contract](../SKILL.md#accessibility-implementation-contract) in `SKILL.md`. Read the relevant section before building the corresponding part of an artifact — dynamic status, charts, tables, or KPI cards.

## Page structure

Use semantic landmarks for every artifact:

- `main` for the primary content.
- `header` for the report introduction.
- `section` for major content groups.
- `article` for reusable or standalone content objects.
- `footer` for source, freshness, and caveat notes.

Use exactly one `h1`. Maintain heading order. Do not skip from `h1` to `h3` unless there is a real `h2` between them.

If the artifact is likely to be embedded in a larger page, keep the `h1` in the file because the file must also make sense when viewed independently.

## Dynamic content and live-data announcements

For loading, refresh, rendering, and success messages, use a live region:

```html
<div role="status" aria-live="polite">Loading live data...</div>
```

For serious failures that stop the user completing the task, use:

```html
<div role="alert">Live data failed to load.</div>
```

Rules:

- Loading messages must not be visual only.
- Refresh buttons must have a clear accessible name, such as `Refresh customer version data`.
- When a live-data section updates, update a nearby status message so assistive technology users know the content changed.
- Do not repeatedly announce non-essential changes.

## KPI cards and summary metrics

Do not render KPI cards as anonymous `div` elements only.

Prefer a definition list for metric summaries:

```html
<section aria-labelledby="summary-heading">
  <h2 id="summary-heading">Summary statistics</h2>
  <dl class="kpi-grid">
    <div class="kpi-card">
      <dt>Total customers</dt>
      <dd>42</dd>
    </div>
    <div class="kpi-card">
      <dt>Missing either version</dt>
      <dd>6</dd>
    </div>
  </dl>
</section>
```

If visual cards are used, the semantic structure must still expose the relationship between label and value.

## Tables

Every data table must include:

- A `caption` or equivalent nearby accessible summary.
- `thead` and `th` for column headers.
- `scope="col"` on column headers where applicable.
- `scope="row"` where row headers are used.

Do not use tables for layout.

If a table is complex, add a short visible summary before the table explaining what the table shows.

For wide tables, wrap the table in a labelled responsive region:

```html
<div class="table-wrap" role="region" aria-labelledby="customer-table-heading" tabindex="0">
  <table>
    <caption>Customer app version status</caption>
    <thead>
      <tr>
        <th scope="col">Customer</th>
        <th scope="col">App version</th>
      </tr>
    </thead>
  </table>
</div>
```

Only add `tabindex="0"` to a scrollable table wrapper when keyboard access is needed to reach overflow content.

## CSS charts and visualizations

CSS-only charts are allowed, but the data must not be available only through visual bars, color, width, position, or hover.

Every chart must include one of the following:

1. An accessible data table containing the same data.
2. A visible text summary plus screen-reader-friendly detail.
3. An aria-labelled chart region where each data point is also available as text.

For bar charts, each row must expose:

- Label.
- Value.
- Meaning.

Recommended accessible bar chart pattern:

```html
<section aria-labelledby="version-chart-heading">
  <h2 id="version-chart-heading">Customers by app version</h2>
  <p>Summary of how many customers are on each app version.</p>
  <ul class="chart-list">
    <li>
      <span>Version 6.0.7: 12 customers</span>
      <span class="bar-track" aria-hidden="true">
        <span class="bar-fill" style="width: 80%"></span>
      </span>
    </li>
  </ul>
</section>
```

Rules:

- The visual bars may be included, but mark purely decorative bar tracks as `aria-hidden="true"` if the same data is available in text.
- Do not rely on color alone to distinguish chart series.
- Use labels, headings, legends, text, patterns, or grouping.
- Avoid hover-only tooltips. Any tooltip content must also be available as visible or screen-reader-accessible text.
- For charts with many data points, provide a summary and a data table.

## Color and contrast

Text and meaningful visual elements must meet WCAG 2.2 AA contrast expectations.

Rules:

- Do not use light grey text for important information unless contrast has been checked.
- Status colors must be paired with visible text, such as `Not recorded`, `Current`, `Missing`, or `Action required`.
- Chart labels, badge text, muted text, and error text must be included in contrast checks.
- Do not use color as the only carrier of meaning.

## Keyboard and focus

All interactive elements must be native HTML controls where possible:

- Use `button` for actions.
- Use `a` for navigation.
- Do not use `div` or `span` as buttons unless unavoidable. If unavoidable, add keyboard support and ARIA carefully.

Rules:

- Visible focus must not be removed.
- If custom focus styling is used, it must remain clearly visible.
- Keyboard users must be able to reach and operate every interactive control.
- Interactive targets should be large enough for pointer and touch use.
- Do not trap focus.
- Do not create keyboard-only dead ends inside embedded iframe surfaces.

## Reduced motion

Avoid animation by default.

If motion is used, it must respect:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

Do not use auto-advancing, flashing, pulsing, or attention-grabbing animation in SharePoint-safe artifacts.

## Responsive and zoom behavior

The artifact must remain usable at:

- 360px width.
- 768px width.
- Desktop width.
- 200% browser zoom.

Avoid fixed-width layouts that cause horizontal scrolling.

If a wide table cannot reasonably fit, wrap it in a labelled responsive region and ensure the table remains readable.

## Images, icons, and SVG

Meaningful images and SVGs require text alternatives.

Decorative images and decorative SVGs must be hidden from assistive technology.

Rules:

- Use `alt` text for meaningful bitmap images.
- Use `alt=""` for decorative bitmap images.
- Inline SVG must include an accessible `title` or be `aria-hidden="true"` depending on whether it conveys meaning.
- Do not encode essential text inside an image unless equivalent text is also available in HTML.

## Links and buttons

Links and buttons must be understandable out of context.

Rules:

- Avoid vague link text such as `Click here` or `Read more`.
- Use descriptive link text such as `View source workbook` or `Open customer report`, when links are allowed.
- Buttons must describe the action, such as `Refresh customer version data`.
- If visible button text is short, add an `aria-label` only when it makes the accessible name clearer.

## Plain language and abbreviations

Use clear labels and concise explanations.

Rules:

- Expand product or technical abbreviations on first use where the audience may not know them.
- Use `abbr title="..."` where appropriate, but do not rely on tooltips alone.
- Error messages must say what went wrong and what the user can do next.
