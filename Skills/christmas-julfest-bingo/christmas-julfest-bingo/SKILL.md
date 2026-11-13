---
name: christmas-julfest-bingo
description: |-
  Create or repair English Christmas Bingo and Swedish JulFest Bingo SharePoint lists and interactive game views from the bundled canonical Bingo view template. Preserve its two-column layout and behavior, including confetti on verified claims and SharePoint theme-aware board states.

  Use when the user says:
  - "Set up Christmas and JulFest Bingo"
  - "Create the two Christmas bingo lists and games"
  - "Turn Christmas & JulFest Bingo into a reusable game"
  - "Repair the Christmas Bingo or JulFest Bingo game"
  - "Make an English or Swedish version of the bingo game"
---
## When to use
Set up or repair English Christmas Bingo and Swedish JulFest Bingo SharePoint lists and interactive game views on any current site. Resolve lists by exact title and use live site IDs and URLs; never hard-code destination IDs.

## Inputs
- Current SharePoint site, selected list/view, and context.
- Lists: `Christmas Bingo Cards` and `JulFest Bingo`.
- Language: English, Swedish, or both (paired setup means both).
- Canonical template: [`assets/julfest-bingo-view-template.json`](assets/julfest-bingo-view-template.json), bundled in this skill package. It is the Swedish JulFest Bingo game view exported as SharePoint view-formatting JSON. The template is authoritative for markup, styling, and behavior.
- Word banks and exact choice values below.

## Canonical template: must reuse
Before creating or repairing a game view, read `assets/julfest-bingo-view-template.json` from this skill's own folder. Parse the JSON and use `viewOverlayFormatter.customHtml` as the source markup. Do not reproduce it from this prose or from memory. If the file is missing, malformed, or lacks `customHtml`, stop before creating or updating views, report the blocker, and ask for the template. Never overwrite an existing game view with an approximation.

The template ships with placeholders instead of a real site and list. Before applying it, replace every placeholder with values resolved from the live target list:

| Placeholder | Replace with |
| --- | --- |
| `https://contoso.sharepoint.com/sites/YourSite` | The current site's absolute web URL (no trailing slash). |
| `{LIST-ID}` | The target list's GUID, wrapped in braces, for example `{1a2b3c4d-...}`. |
| `/sites/YourSite/Lists/JulFest Bingo` | The target list's server-relative root folder URL (use the real URL, which can differ from the title). |

The placeholders appear in two places at the top of `<head>`: the single `ka-livedata-manifest` script (`spItemUrl`, `webUrl`, `listId`, `listServerRelativeUrl`) and the row-loading script right after it (the `window.__LD_RESULTS__` lookup key, which must equal the manifest's `spItemUrl`). In total the site URL appears 3 times, `{LIST-ID}` 3 times, and the server-relative URL once. Replace all of them so the manifest and the lookup key point at the same list, and do not add a second manifest. After replacing, confirm that no `contoso`, `YourSite`, or `{LIST-ID}` text remains.

Use the template's actual HTML as the basis. Adapt only the live-list values above, the verified internal field names, the language-localized visible UI labels and messages, and the matching word bank and fallback. Preserve the two-column layout (wide board on the left, narrow sidebar on the right), warm cream background, dark forest-green serif title and latest-call treatment, pale-gold success banner, white rounded cards, compact sans-serif controls, count badge, 5×5 board states, called-word chips, button hierarchy, responsive reflow, print behavior, accessibility, and spacing and component structure. The sidebar holds the latest-call panel, the game settings and manual call logging panel, and the called-word history; board actions and status sit beneath the board. Do not add prominent illustrations or flashy decoration. Do not otherwise redesign, reorder, remove, or approximate the canonical design.

### Approved canonical template features
These are part of the approved template, not general permission to redesign:
- **Confetti**: a brief local animation only after a valid selected pattern passes verification and the round locks. Never fire on load or on an invalid or incomplete claim. It must be decorative and aria-hidden, must not intercept pointer input, must be self-contained with no network or dependency, bounded and removed after the animation, hidden in print, and skipped for `prefers-reduced-motion: reduce`. Keep the success banner.
- **Theme-aware card colors**: use available SharePoint theme CSS custom properties for board and card surfaces, marked and called states, text, borders, and controls, with safe festive fallbacks. Preserve a visible check or other non-color cue on marked squares; keep the centre free square distinct in cream and gold. Ensure readable contrast. Do not let hard-coded defaults override available theme tokens.

For Swedish, keep the template's Swedish labels. For English, translate only the visible labels and messages (including `lang="sv"` to `lang="en"`, the `<title>`, the free square, the How to play drawer, status messages, and the `sv` sort locale), replace the fallback bank, and read the English fields, while preserving structure and game behavior. Do not change game mechanics or the stated local-only limitation. If the user asks for a further design or control change that departs from this standard, explain the difference and ask whether to update the canonical template before propagating it.

### Field names in the template
- The game reads each row's word from `Title` and its theme from `Tema` (`x['Title']`, `x['Tema']`). For English, read `Theme` instead of `Tema`, unless the verified internal name differs.
- The row-loading script maps `Title` to the display name `Bingord`. For English, map it to `Bingo Word`.
- `FALLBACK` holds the Swedish word bank as `{Title, Tema}` objects. For English, replace it with the English bank as `{Title, Theme}` objects.

## Word banks
### English (Title displayed as Bingo Word; Choice column Theme)
- People: Santa Claus, Mrs. Claus, Elf, Reindeer, Rudolph
- Decorations: Christmas Tree, Star, Wreath, Stocking, Ornament, Tinsel, Christmas Lights, Poinsettia, Nutcracker
- Food & Drink: Candy Cane, Gingerbread, Hot Cocoa, Eggnog, Fruitcake, Cookies
- Traditions: Sleigh, Jingle Bells, Caroling, Gift, Mistletoe, Christmas Eve, Reindeer Games, Peace on Earth, Silent Night
- Winter: Snowman, Snowflake, Icicle, Mittens, Fireplace
- Places: North Pole, Chimney

English choices: `People`, `Decorations`, `Food & Drink`, `Traditions`, `Winter`, `Places`.

### Swedish (Title displayed as Bingord; Choice column Tema)
- Figurer: Jultomten, Tomtenisse, Ren, Rudolf, Lucia, Stjärngosse
- Julpynt: Julgran, Julstjärna, Julkrans, Julgranskulor, Adventsljusstake, Julbock
- Mat och dryck: Pepparkaka, Glögg, Julmust, Lussekatt, Knäck, Julskinka
- Platser: Tomteverkstad, Nordpolen, Tomtens stuga, Stallet, Skogen, Kyrkan
- Traditioner: Julklapp, Julklappsutdelning, Julbord, Luciafirande, Julsång, Julotta
- Vinter: Snögubbe, Snöflinga, Istapp, Vantar, Pulka, Skridskor

Swedish choices (alphabetical): `Figurer`, `Julpynt`, `Mat och dryck`, `Platser`, `Traditioner`, `Vinter`.

Each bank has 36 words. The Swedish bank matches the template's `FALLBACK` exactly.

## Steps
1. Load the required SharePoint tool signatures. Use `execute_plan` to chain discovery, reads, and writes.
2. Discover current-site lists and match exact titles. Inspect schemas, views, and item counts. Never duplicate lists. After creation, resolve the list ID from the create result or fresh discovery before reading schema or items.
3. Create only missing lists. Display the built-in `Title` as `Bingo Word` / `Bingord`; add a Choice column `Theme` / `Tema` with the exact choices above. Preserve existing columns and data.
4. Read rows. Seed all 36 pairs in one batch only when that list is empty. Never duplicate, overwrite nonempty banks, or add extra words without asking. Use the resolved list root and site URLs.
5. Read and parse `assets/julfest-bingo-view-template.json` before any view write, then fill in the placeholders for the target list. Create a non-default `CUSTOMHTML` game view if none exists; otherwise update the verified existing HTML game view in place. Titles: `Christmas Bingo Game` and `JulFest Bingo`. Never silently create a second game view. Bind the view to the target list with verified internal fields and the current site context; keep the template's actual structure.
6. Verify that each localized template keeps all required mechanics and accessible controls:
   - Shuffle a 5×5 card from 24 unique words with a permanently free centre; deduplicate case-insensitively and require at least 24 unique words.
   - Manual Caller/Player switch, default Player. The Caller can draw the next random word; the Player cannot draw and logs announced words from an alphabetical list. This switch is not authentication or presence-based access control.
   - No repeated calls; current call, ordered history chips, undo; mark or unmark a square only after its word is called.
   - Win patterns: any complete row, column, or diagonal; four corners; full house (all 24 word squares). A win requires a valid 25-square board (24 words plus the free centre). Enable the claim button only when a full board exists and the selected pattern is complete; verify, lock the round, show the generic success banner, and fire confetti. Disable draw, manual call, undo, mark, and claim while the word bank is too short to deal.
   - Optional local chime with an on/off toggle, new-round reset, print action; right-side How to play / Så spelar du drawer with backdrop, closes with the close button, backdrop, or Escape, reduced-motion support, keyboard and dialog ARIA.
   - Read `window.__SP_ROWS__` only after checking `window.__SP_ROWS_LOADED__`; use verified internal fields. Use the fallback bank only if live data is unavailable. If live rows loaded but are empty, show the empty state, not the fallback. Require at least 24 unique words to deal.
   - Use SharePoint theme tokens for card and board state colors with safe palette fallbacks and visible state cues.
7. In both the game UI and the completion response, state that boards, calls, role selection, sound, winner banner, and confetti are local to each browser. SharePoint does not sync the game between devices: the Caller announces each word out loud (or in a meeting), and players on other devices log it themselves. Never imply real-time synchronization or presence.
8. After writes, verify list schemas, counts, view definitions and IDs, and a successful `views.applyHtml`. If a step fails after successful writes, resume from the current state; don't repeat successful writes. Report errors and partial completion honestly.

## Output format
A concise completion summary: created or reused list names and counts, game view names and links when available, failures and caveats, and the local-only, no-sync limitation. For one-language requests, report only that game. Never claim the canonical template was reused if it wasn't successfully read and applied.
