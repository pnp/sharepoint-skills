# SharePoint HTML sandbox rules for this page

The page is opened as an HTML file from a SharePoint document library or Site Pages, where SharePoint can supply approved libraries.

- **Libraries:** declare `<script type="application/json" class="ka-lib-manifest">["d3","chart.js"]</script>` in the head. SharePoint provides `window.d3` and `window.Chart`. Do not add `<script src>` tags or CDN links to the SharePoint copy.
- **Inline only:** one `<style>` and one main `<script>`. No external CSS, fonts, images, or iframes.
- **No network or storage:** no `fetch`, `XMLHttpRequest`, `localStorage`, `sessionStorage`, `indexedDB`, or cookies.
- **State in the hash:** when the file is opened directly, `#step=N` restores the first N steps and `#done` restores the finish screen, written with `history.replaceState`. In SharePoint's HTML view the page can run in a sandboxed frame that does not see the page URL, so progress may last only for the session there. The page still works; it just starts at step 1.
- **ASCII only:** escape non-ASCII characters (`&#183;` in HTML, `\u00b7` in script).
- **Graceful fallback:** the page waits up to five seconds for D3. If it never arrives, it shows a plain-text version of every step, the guardrails, and the checklist. Chart.js is optional; without it the doughnut is hidden.
- **Accessibility:** keyboard (Tab to the buttons, Enter, the left and right arrow keys, and Escape to collapse the card), `prefers-reduced-motion` read at load and again whenever it changes, live regions for the card and the progress text, and a bottom-sheet card on narrow screens. These were checked in headless Chrome. Screen readers, high contrast, and zoom have not been tested yet, so do not promise them.
- **Data check:** the page refuses to start on incomplete `DATA` and lists the problems. See `references/data-schema.md`.
- **Where to open it:** save the file to a library or Site Pages and open it there. Do not paste it into a text web part; that removes the script and styles.
- **SharePoint's page wrapper:** when Copilot saves the page, SharePoint can add head styles, theme variables, and metadata, including generic rules for `h1`-`h6`, `p`, `a`, `strong`, tables, and `code`, and a `*{margin:0;padding:0}` reset. The template restates its own colors, fonts, and spacing with more specific selectors (and `!important` on the header text), so the wrapper does not change how the page looks. Leave the wrapper in place.
