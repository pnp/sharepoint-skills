# Accessible SVG implementation patterns

## Decorative inline icon

```html
<span class="metric-label">
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 19V9" />
    <path d="M10 19V5" />
    <path d="M16 19v-7" />
    <path d="M22 19H2" />
  </svg>
  Monthly activity
</span>
```

## Informative status icon

Use an informative SVG only when nearby visible text does not already provide the status.

```html
<svg role="img" aria-labelledby="status-overdue-title" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <title id="status-overdue-title">Overdue</title>
  <circle cx="12" cy="12" r="9" />
  <path d="M12 7v6l4 2" />
</svg>
```

## Icon-only native button

```html
<button type="button" class="icon-button" aria-label="Open filters">
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 6h16" />
    <path d="M7 12h10" />
    <path d="M10 18h4" />
  </svg>
</button>
```

```css
.icon-button {
  inline-size: 2.75rem;
  block-size: 2.75rem;
  display: inline-grid;
  place-items: center;
  color: var(--icon-color, currentColor);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.5rem;
}

.icon-button:hover {
  background: var(--icon-hover-background, rgb(0 0 0 / 6%));
}

.icon-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

## Status set that does not rely on colour alone

Pair distinctive shapes with visible labels:

```html
<span class="status status--success">
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 2.5 2.5L16 9" />
  </svg>
  Complete
</span>

<span class="status status--warning">
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3 2.5 20h19L12 3Z" />
    <path d="M12 9v5" />
    <path d="M12 17h.01" />
  </svg>
  Needs attention
</span>
```

## Standalone SVG file

When the SVG is loaded through an `<img>`, provide the accessible name on the image element rather than relying on the internal SVG title:

```html
<img src="analytics.svg" alt="Analytics overview" width="24" height="24" />
```

For a decorative image:

```html
<img src="analytics.svg" alt="" width="24" height="24" />
```
