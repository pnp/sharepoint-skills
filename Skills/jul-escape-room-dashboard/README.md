# Jul Escape Room Dashboard

Builds or repairs the Jul Escape Room SharePoint list game from a saved HTML template: a playable HTML list view plus a standalone HTML file that stay in sync with the same content list.

![preview](./assets/preview.png)

## What you get

- A canonical single-file HTML game template with inline CSS and SVG, system fonts only, and no external assets or network calls
- A startup prompt that creates the content list, seeds the six puzzles, and builds both playable copies
- Operating rules that keep the list as the source of live puzzle content and the saved template as the visual and interaction specification
- Default names you can override: list `Jul Escape Room Content`, view `Jul Escape Room`, document library `Reports`, and standalone file `Jul Escape Room - Play.html`
- Safe data-binding rules so list values are rendered as text, player progress is never written back to SharePoint, and both game copies stay synchronized
- Preflight and honest test-reporting rules for template fidelity, script checks, and browser behavior

## Video walkthrough

[![How I Built an Escape Room Game from a SharePoint List with Copilot](https://img.youtube.com/vi/6c3yeMb44wY/maxresdefault.jpg)](https://youtu.be/6c3yeMb44wY)

[Part 1: How I Built an Escape Room Game from a SharePoint List with Copilot](https://youtu.be/6c3yeMb44wY)

[![Copilot in SharePoint Prompt to Build an Escape Room Game](https://img.youtube.com/vi/ihUqhvoDoqs/maxresdefault.jpg)](https://youtu.be/ihUqhvoDoqs)

[Part 2: Copilot in SharePoint Prompt to Build an Escape Room Game](https://youtu.be/ihUqhvoDoqs) · [Listen on Spotify](https://open.spotify.com/episode/49NBCVhUM9xwX0FgLCuxC8)

## How to use

1. Upload only the inner `jul-escape-room-dashboard/` package folder (the one that contains `SKILL.md`, `references/`, and `templates/`) to a SharePoint location your agents can read, such as the site's Agent Assets › Skills folder. The uploaded folder name must match the `name` in `SKILL.md`.
2. Do not upload this README, `assets/`, or the outer repository folder as runtime skill content.
3. In Copilot on the target SharePoint site, ask to create or repair the Jul Escape Room using this skill.
4. Confirm the target site, and optionally override the default list, view, library, and standalone filename.

A public playable demo of the game is at [https://anandragav.github.io/copilot-html-dashboards/jul-escape-room/](https://anandragav.github.io/copilot-html-dashboards/jul-escape-room/).

## Check your list before you play

The game reads its puzzles from the Jul Escape Room Content list. If that list isn't right, the game stops before play and shows a red box saying what is wrong. It never quietly swaps in the sample puzzles. Check these points first:

- **Exactly six active rows.** IsActive must be Yes on all six. Five or seven active rows stop the game. Rows set to No are ignored.
- **Every column filled in and included in the view.** The view behind the game must include every column the game reads: Title, PuzzleId, Room, RoomTitle, RoomDescription, RoomRequiresItemIds, RoomNpcName, RoomNpcGreeting, RoomNpcItemLine, ObjectLabel, PuzzleType, Question, Choices, AcceptedAnswers, Hint, NudgeText, RetryText, SuccessText, RequiresItemIds, LockedText, RewardItemId, RewardItemName, RewardItemDescription, RewardExtraItems, PointsValue, SortOrder, IsFinalPuzzle and IsActive. There are only two exceptions: the reward columns RewardItemId, RewardItemName and RewardItemDescription can be empty on the final puzzle, and LockedText can be empty on a row whose RoomRequiresItemIds and RequiresItemIds are both `[]`.
- **Blank isn't a default.** An empty cell is an error, even in a JSON or number column. A blank JSON cell doesn't count as `[]`, and a blank PointsValue doesn't count as 0.
- **Valid JSON in the five JSON columns.** RoomRequiresItemIds, Choices, AcceptedAnswers, RequiresItemIds and RewardExtraItems must each hold a JSON array, written out even when it's empty: `[]`. A missing bracket or quote stops the game.
- **Points above zero.** PointsValue must be a number greater than 0, and SortOrder must be a number.
- **The six room names.** Room must be exactly one of Entrance Hall, Kitchen, Workshop, Library, Attic or Final Door, with one active row for each. Put the name players see, such as Greta's Kitchen, in RoomTitle.
- **Puzzle types.** PuzzleType is choice or text.
- **Answers that match.** For a choice puzzle, every value in AcceptedAnswers must be one of the `id` values in Choices, such as `["env-3"]`.
- **One final puzzle.** IsFinalPuzzle is Yes on exactly one row.
- **Items that exist.** Every item ID in RoomRequiresItemIds or RequiresItemIds must be the RewardItemId of another row, or a room can never be opened.
- **Unique IDs.** No two rows share a PuzzleId or a RewardItemId.

Text in the list is always shown as plain text, so `<b>` or other markup in a choice or answer appears as typed, not as formatting.

### What the messages mean

Row numbers count every row in the list from the top, and the PuzzleId in brackets tells you which row it is.

| Message | What to fix |
| --- | --- |
| The puzzle list has 5 active rows; the game needs 6. | Add or reactivate rows until exactly six have IsActive set to Yes. |
| Row 3 (PARCELS) is missing field Question. | Add that column to the list, and make sure the view includes it. |
| Row 3 (PARCELS): Question is empty. | Fill in that cell. The same message appears for any other empty column, such as RoomNpcGreeting, Hint or RewardItemName. |
| Row 2 (RECIPE): Choices is empty. It needs a JSON array, such as [] when there are no values. | Put a JSON array in the cell. Write `[]` when there are no values. |
| Row 2 (RECIPE): Choices could not be parsed. | Fix the JSON in that cell, for example a missing `]` or `"`. |
| Row 2 (RECIPE): Choices must be a JSON array. | Wrap the value in `[ ]`. |
| Row 3 (PARCELS): PointsValue is empty. | Enter the puzzle's points, such as 100. |
| Row 3 (PARCELS): PointsValue must be a positive number. | Enter a number greater than 0. |
| Row 5 (ORNAMENTS): LockedText is empty. It's needed because this row requires an item. | Write what the character says when the player doesn't have the item yet. |
| Row 2 (RECIPE): Room must be one of Entrance Hall, Kitchen, Workshop, Library, Attic, Final Door. | Use one of those six names in Room, and put the display name in RoomTitle. |
| Row 2 (RECIPE): PuzzleType must be choice or text. | Change PuzzleType to choice or text. |
| Row 2 (RECIPE): AcceptedAnswers has seq-x, which is not one of the Choices ids. | Make AcceptedAnswers use the `id` values from Choices. |
| Exactly one active final puzzle is required; found 2. | Set IsFinalPuzzle to Yes on one row and No on the rest. |
| No active puzzle for room Attic. | Make sure one active row has that Room value. |
| Row 4 (BOOKS): RoomRequiresItemIds names unknown item BRASS_KEY. | Check the spelling against the RewardItemId that hands out that item. |
| Row 4 (BOOKS) can't be reached from the rooms that are open at the start. Check for a missing or circular requirement. | Make sure the item that opens the room or puzzle is a reward the player can reach first. |
| Row 4 (BOOKS): Duplicate PuzzleId BOOKS. | Give each row its own PuzzleId. |

The diagnostics panel shows where the puzzles came from. "Live list rows loaded: 6." means the game is reading your list. "Bundled sample data (standalone copy; list not connected here)." means the list couldn't be reached, for example in a downloaded copy of the file, so the built-in sample is being played instead.

## SharePoint Skill

| Solution | Author(s) |
| --- | --- |
| jul-escape-room-dashboard | Anand Vijayaragavan &#124; [GitHub](https://github.com/anandragav) &#124; [LinkedIn](https://www.linkedin.com/in/anand-vijayaragavan-89443012/) |

## Version history

| Version | Date | Comments |
| --- | --- | --- |
| 1.0 | November 2026 | Initial Release |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

<img src="https://m365-visitor-stats.azurewebsites.net/sharepoint-skills/skills/jul-escape-room-dashboard" />
