# Optional public copy

If the user wants a public demo (for example on GitHub Pages), make a second file:

- `build_page.py ... --public-out page.public.html` writes the same page with pinned jsDelivr copies of D3 7.9.0 (ISC license) and Chart.js 4.6.1 (MIT license) inserted at `<!--FT_PUBLIC_LIBS-->`. Both tags carry a Subresource Integrity hash, so the browser refuses a changed file. These are the same versions the page is tested with.
- When filling the template by hand, put the same two `<script src>` tags, with their `integrity` and `crossorigin` attributes, at that marker in the public copy only:

```html
<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js" integrity="sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.6.1/dist/chart.umd.min.js" integrity="sha384-Emf5ZVIUiarAdhkgtqK+5/Z5qIvM6QoVrS+qAVtfyZVuD5lIHrac0me485+Antp0" crossorigin="anonymous"></script>
```

- The public copy must use the same approved fictional values. Check it for real names again before publishing.
- Never put a CDN link in the SharePoint copy.
