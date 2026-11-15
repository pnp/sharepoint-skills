---
name: jul-escape-room-dashboard
description: |-
  Build or repair the Jul Escape Room SharePoint game using its saved template as the exact visual and interaction specification; keep the content list, live view, and standalone HTML in sync.

  Use when the user says:
    - “Create a Jul Escape Room dashboard”
    - “Complete the Jul Escape Room dashboard using the intended template”
    - “Fix both the Jul Escape Room dashboard view and standalone file”
    - “Make the Jul Escape Room match the template exactly”
---
# Jul Escape Room Dashboard

## When to use
Use for initial creation, repairs, or completion of the Jul Escape Room list game, playable HTML list view, and standalone HTML file. Unless the user limits the request, update both game copies together. The current SharePoint list is authoritative for live puzzle content. The saved fixed HTML template is the canonical source for appearance and interaction.

## Source-of-truth split
- **This skill owns durable operating rules:** exact template fidelity, synchronized copies, live-list authority, safe data binding, and pre-/post-write verification. Apply these rules on every creation or repair, even if a prompt or file omits them.
- **Startup prompt** (`references/jul-escape-room-startup-prompt.md`) is the initial-build brief: list setup, initial puzzle specification, and build-time checks. Reading it does not authorize rebuilding an existing game. Do not copy the full startup prompt into this skill or use it as the design authority for repairs.
- **Canonical template** (`templates/jul-escape-room-template.html`) is the exact visual and interaction reference. It governs repairs and completion work.

## Inputs
- Canonical startup prompt: `references/jul-escape-room-startup-prompt.md`.
- Canonical game template: `templates/jul-escape-room-template.html`.
- Target SharePoint site, list, HTML view, standalone file, and any user-provided screenshot/error.
- Current list schema/rows, view formatter, and standalone HTML.

Default names, unless the user overrides them: list `Jul Escape Room Content`, HTML view `Jul Escape Room`, document library `Reports`, and standalone filename `Jul Escape Room - Play.html`. Read the startup prompt and template from this skill's own folder wherever it was uploaded.

## Non-negotiable template fidelity
The saved template is the specification, not inspiration. Don't redesign, simplify, approximate, or replace any part. Both game copies must retain the complete template DOM, CSS, typography, colors, spacing, responsive layout, inline illustrations/SVG, start screen, room scene, map, inventory, journal, character/speech presentation, HUD, toolbar and button order/placement, answer interactions, feedback, animations, pause overlay, celebration, certificate, print behavior, and accessibility features. No placeholders in place of intended content, missing art, missing sections, or alternate layouts.

Only add host-specific SharePoint/live-list or standalone LiveData adapters and necessary data substitutions. Start from the exact template and make the smallest required host/data changes. Compare the result to the template before writing; any difference beyond host adapters or current-list data/ID binding fails preflight. Never use a broken game copy as a design reference.

## Steps
1. **Read exact sources in full first.** Read these paths, relative to this skill's own folder wherever it was uploaded, before any game build or repair:
   - `references/jul-escape-room-startup-prompt.md`
   - `templates/jul-escape-room-template.html`
   Don't substitute similarly named site files, memory, or generated artifacts. If either source can't be read, stop before writing and name the failed source.
2. **Respect scope.** Never execute the startup prompt, recreate/reset a non-empty list, or reseed existing rows unless the user explicitly asks to create/build from scratch. For a repair/template-completion request, preserve existing list data and update both copies unless scope is explicitly limited.
3. **Inspect the current game.** Read schema and rows, the existing HTML view (default name: `Jul Escape Room`), and the standalone play file (default filename: `Jul Escape Room - Play.html`) in the document library the user names (default library: `Reports`). Confirm exact list/view/file identities and view fields. Preserve live PuzzleIds, choice IDs, accepted answers, dependencies, rewards, digit notes, and final code; don't assume template sample IDs match.
4. **Keep content/data boundaries.** Shared puzzle content stays in the list; never write player progress, score, or elapsed time to SharePoint. Preserve current schema/rows unless explicitly asked to change them. Use observed internal field names. Parse JSON text and safely render list values as text—never execute list-provided code. Never overwrite a non-empty list with starter data.
5. **Keep both copies synchronized.** The list view and standalone HTML are host-specific copies of the same game. Update both for every behavior/content repair unless explicitly limited. Keep the list view live-bound and project every renderer field. Keep the standalone file live-bound; any backup content must match the current list and be used only when live loading genuinely fails, with a clear notice. Never let stale fallback hide a live-data failure. Update the existing view and existing standalone file in place (default library: `Reports`); don't create duplicates.
6. **Bind current content without changing the experience.** Substitute observed current PuzzleIds and reward IDs in every gate, logic reference, solved-art selector, and illustration. Use live choice IDs, AcceptedAnswers, and ClueData. Keep clue art, visible text, labels, symbols, numbers, choices, screen-reader descriptions, solved art, and accepted answers consistent. Never disclose answers/code before the intended solve. Preserve all template game mechanics and six-room story. Wrong answers cost no points; rewards are one-time; points, hints, timer, pause, restart, gates, progress, and certificate behave as the template specifies.
7. **Preserve design and accessibility exactly.** Keep template CSS/DOM intact. Inline SVG must remain actual drawable markup, not escaped text. Don't remove artwork, use placeholders, or add external images/scripts/fonts/libraries, network calls, engines, or frameworks. Keep keyboard support, focus, contrast, responsive layout, reduced motion, live announcements, and equivalent SVG descriptions as in the template.
8. **Preflight before writes.** Verify both outputs preserve template sections/control IDs, styles/layout, SVG art, and button order. Verify renderer fields exist and are projected, all current IDs/dependencies are consistent, no stale IDs remain, and fallback is honest. Extract and syntax-check every executable script after each host wrapper is assembled. If any check fails, do not write; fix it first.
9. **Write, then verify both.** Update the existing HTML view in place and the standalone file (default library: `Reports`, default filename: `Jul Escape Room - Play.html`) in the same turn. If one write succeeds and the other fails, state exactly which changed and retry only the failed write. After writes, re-read both artifacts and verify template sections/art, live binding, current data/IDs, and valid scripts. A successful write or syntax check alone doesn't prove browser behavior.
10. **Report tests honestly.** If browser interaction tests aren't available, say so. Mark runtime, keyboard, responsive, reduced-motion, and screen-reader checks as not tested rather than claiming they passed. If any read/write or verification fails, report the exact partial result.

## Output format
Name the list, view, and standalone file touched (defaults: list `Jul Escape Room Content`, view `Jul Escape Room`, library `Reports`, file `Jul Escape Room - Play.html`). Summarize template-fidelity and mechanical checks actually performed, list tests not performed/failures, and provide returned SharePoint links. Never claim an unverified visual or behavioral test passed.
