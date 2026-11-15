# Jul Escape Room startup prompt

This is a single prompt for Copilot in SharePoint. It creates the list, fills it with all six puzzles, builds a playable HTML dashboard view on that list, and adds a standalone HTML dashboard file in a site's document library that reads the same list. It's the original Jul Escape Room design plus every fix from my own build, so Copilot starts with those lessons instead of making the same mistakes again.

**Spoiler warning:** the puzzle section below has every answer and the final code. If you want to play first, don't read it.

## How to use it

1. Open Copilot in SharePoint on a site where you can create lists and save files to a document library.
2. Paste everything from "The prompt" to the end of this file, or attach this file and write: "Create a list and build the Jul Escape Room as described in the attached file."
3. Stay nearby while it works. Copilot asks you to confirm before it creates or updates list items, and if you don't answer in time, the change simply doesn't happen. It can also ask whether to use credits for bigger jobs.
4. Play both copies from a fresh start, and go through the checks at the end of the prompt. If something's off, tell Copilot what you see, paste the exact error message, and ask it to fix both copies.

## The prompt

Build a festive, web-based escape room called **Jul Escape Room** (Jul is the Swedish word for Christmas). Use Jul in every name, label, line of dialogue and item ID. Never use "Yule." Players explore an illustrated 2D house, meet its characters, solve connected puzzles, collect three Jul key fragments and a three-digit code, and open the final door. Keep it all 2D, with illustrated scenes, cards and characters and no 3D engine.

### 1\. What to create, in this order

Use these default names unless the user specifies different ones: list **Jul Escape Room Content**, HTML view **Jul Escape Room**, standalone file **Jul Escape Room \- Play.html**, and document library **Reports**. If the Reports library is not present, use the document library the user names.

1. **The list:** create a new SharePoint list called **Jul Escape Room Content** (default name; use a different list name if the user specifies one) with the columns in section 7, then add the six puzzle rows in section 8, with every field filled in.
2. **The playable view:** add an HTML dashboard view called **Jul Escape Room** (default name; override if the user specifies one) on that list. It reads the list's rows live, so changes to the list show up in the game.
3. **The game page:** save a second copy of the same game as **Jul Escape Room \- Play.html** (default filename) in the **Reports** document library if that library exists, or in the document library the user names, reading the same list.
4. **Report back:** give me links to the list, the view and the HTML file in the document library, plus the results of the checks in section 14\.

If a list or view with these names already exists, stop and ask me. Don't change any other list or view on the site.

**One game, two copies.** The list view and the standalone dashboard file in a document library are the same game. Every change, in this request and in every later request, goes into both copies in the same turn, and your reply names both. Never fix one and leave the other behind.

### 2\. Platform limits

- Write the game in plain JavaScript, CSS and inline SVG inside the HTML itself. Load no scripts, fonts, images or libraries from outside URLs, and don't use a game engine or animation library.
- Draw all art as inline SVG built into the page, not as separate image files.
- Don't depend on browser storage. Progress, time and points last for the current session, and the start screen tells players that a reload starts a new game.
- Never write any player's progress, time or points to the list. The list holds shared content only.

### 3\. The player experience

The player is inside a festive Swedish house getting ready for Jul. The final door is locked. A simple illustrated house map is the main navigation, with six locations: Entrance Hall, Greta's Kitchen, Pelle's Workshop, Uggla's Library, Mira's Attic and the Final Door.

- **You are here:** mark the current room on the map and show its name in a header.
- **Room scenes:** each room has a flat illustrated backdrop with its puzzle object drawn as a large, labeled hotspot. No tiny invisible click targets.
- **Map states:** show which rooms are available, locked, current and completed. A locked room explains what's missing without giving away the solution.
- **Locks that look like locks:** a keyhole on the library door, a padlock on the attic hatch, and a blank three-digit dial on the final door.
- **Moving between rooms:** a short fade, or a static change when reduced motion is on.

Keep the style warm, readable and playful, and put clear interactions ahead of decoration.

### 4\. Characters

These are 2D drawings with speech bubbles. They never move the player or act on their own.

- **Nisse, the house tomte:** greets the player in the Entrance Hall, explains the goal and acts as the guide.
- **Greta, the baker:** in the kitchen, beside the recipe scraps.
- **Pelle, the parcel elf:** in the workshop, at the parcel bench.
- **Uggla, the library owl:** on a bookshelf.
- **Mira, the attic mouse:** beside the ornament box.
- **The old door knocker:** on the final door. It lists which fragments are still missing and asks for the code.

Each character greets the player on their first visit, says its item line when the player carries the relevant item, and speaks the room's hint when asked. A hint counts as hint used. After three wrong attempts, the character may offer the nudge text, which doesn't count as a hint. Characters never reveal an answer on their own. All dialogue comes from the list, renders as plain text, is announced to screen readers and has a close control.

### 5\. Core mechanics

- **Puzzles:** multiple choice and typed answers, mixing observation, ordering, pattern and number puzzles.
- **Inventory strip:** shows collected keys and fragments. Players can open an item to read what it is.
- **Clue journal:** keeps every clue and digit note the player has found, in the order found, so nothing has to be hunted for again.
- **Dependencies:** items unlock rooms and puzzles as set in the list. Owning an item never solves a puzzle by itself.
- **Rewards once:** celebrate a first solve with small hand-written confetti and add each reward exactly once. Replays, revisits and double-clicks never duplicate items, points or progress.
- **Final door:** needs all three fragments plus the code. Trying too early explains what's missing.

### 6\. Play modes, timer and points

- **Start screen:** players choose **Solo** (asks for a name) or **Team** (asks for a team name and, optionally, member names). A team plays on one shared screen. There's no synchronized multiplayer.
- **Timer:** starts when the player presses Start and shows minutes and seconds. No countdown and no fail state. **Pause** stops the clock and covers the puzzle area. Players can hide the clock, and time is still recorded.
- **Points:** a first solve earns the row's PointsValue. Each hint used on that puzzle takes off 25 points, never below half its value. Wrong attempts cost nothing.
- **Header:** elapsed time, points, puzzles solved and hints used.
- **No tracking:** no leaderboard, no results list, nothing sent anywhere. Points and time are for fun and can be changed by anyone who inspects the page, so never present them as verified.

### 7\. List columns

Create these columns. Store structured values as JSON text, and parse them into arrays and objects before the game uses them.

- **Title:** puzzle name.
- **PuzzleId:** stable unique ID.
- **Room**, **RoomTitle**, **RoomDescription:** the room and its player-facing text.
- **RoomRequiresItemIds (JSON):** items needed to enter the room. An empty array means open from the start.
- **RoomNpcName**, **RoomNpcGreeting**, **RoomNpcItemLine:** the room's character and its lines.
- **ObjectLabel:** the visible puzzle object.
- **PuzzleType:** choice or text.
- **Question:** the puzzle instructions shown to the player.
- **ClueData (JSON):** every label, number and symbol the puzzle's picture shows before and after solving. The SVG is drawn from this data, so the picture and the text can never disagree.
- **Choices (JSON):** stable option IDs and labels, for choice puzzles.
- **AcceptedAnswers (JSON):** accepted option IDs or typed answers.
- **Hint**, **NudgeText**, **RetryText**, **SuccessText:** help, gentle nudge, wrong-answer feedback and the story beat after solving.
- **RequiresItemIds (JSON):** items needed to attempt the puzzle.
- **LockedText:** what the character says when the player lacks a required item.
- **RewardItemId**, **RewardItemName**, **RewardItemDescription:** the item awarded on the first solve.
- **PointsValue**, **SortOrder**, **IsFinalPuzzle**, **IsActive.**

Check choice answers by option ID, never by position. For typed answers, trim spaces and ignore case, and accept only the listed answers.

### 8\. The six puzzles

Use this content exactly. Item IDs: JUL\_BRASS\_KEY, JUL\_FRAGMENT\_1, JUL\_ATTIC\_KEY, JUL\_FRAGMENT\_2, JUL\_FRAGMENT\_3. The Entrance Hall, Kitchen and Workshop are open from the start. The Library, Attic and Final Door start locked.

**1\. Entrance Hall: Nisse's card** (choice, 100 points)

- **Clue:** Nisse's card has a stamp showing three symbols in order: Moon, Star, Bell. Four numbered envelopes lie on the hall table, each sealed with three symbols. Envelope 1: Star, Moon, Bell. Envelope 2: Moon, Bell, Star. Envelope 3: Moon, Star, Bell. Envelope 4: Bell, Star, Moon.
- **Drawing:** draw the stamp and all four seals as clear, large inline SVG symbols, with each envelope's number printed on it. Screen readers get the same information as text, in the same order, for example "Card stamp: Moon, Star, Bell. Envelope 1 seal: Star, Moon, Bell."
- **Question:** "Which envelope's seal matches Nisse's card?" Choices: env-1 to env-4, labeled Envelope 1 to Envelope 4\. Accepted: env-3.
- **Reward:** JUL\_BRASS\_KEY, "Brass library key."
- **After solving:** envelope 3 opens and stays open on later visits.

**2\. Greta's Kitchen: the recipe scraps** (choice, 100 points)

- **Clue:** four jars labeled Saffron, Almonds, Cinnamon and Sugar, drawn in a scrambled order that is not the answer (Sugar, Cinnamon, Almonds, Saffron). Three separate recipe scraps: "Sugar always goes in last." "Almonds go in right after the saffron." "Cinnamon never goes first."
- **Drawing:** every jar shows its label as real text on the jar.
- **Question:** "Which order follows all three scraps?" Choices: seq-a Saffron, Almonds, Cinnamon, Sugar. seq-b Cinnamon, Saffron, Almonds, Sugar. seq-c Saffron, Almonds, Sugar, Cinnamon. seq-d Saffron, Cinnamon, Almonds, Sugar. Accepted: seq-a.
- **RetryText:** points the player back to the three scraps without naming which one the wrong choice broke.
- **Reward:** JUL\_FRAGMENT\_1. SuccessText ends with "The first digit is 2."
- **After solving:** the jars redraw in the solved order and stay that way.

**3\. Pelle's Workshop: the parcel tags** (text, 100 points)

- **Clue:** four parcel tags. Tag 1: 2 bells. Tag 2: 6 bells. Tag 3: 18 bells. Tag 4: a question mark.
- **Drawing:** keep every number clear of the parcel bands and dividers.
- **Question:** "Every tag follows the same rule. How many bells belong on Tag 4?" Accepted: 54\.
- **Reward:** JUL\_ATTIC\_KEY. SuccessText: "Tag 4 reads 54 bells."
- **After solving:** Tag 4 shows 54 and stays that way.

**4\. Uggla's Library: the starred books** (text, 100 points)

- **Room requires:** JUL\_BRASS\_KEY.
- **Clue:** a shelf of seven books, left to right: Snowfall (gold star), Lingonberry, Tinsel (gold star), Candlelight, Aurora (gold star), Reindeer (gold star), Gingerbread. Titles and stars are readable in the picture and in the screen-reader text.
- **Question:** "Uggla says the starred books hide a word. What is it?" Accepted: STAR.
- **Reward:** JUL\_FRAGMENT\_2. SuccessText ends with "The second digit is 4."
- **After solving:** the starred initials light up and spell the word.

**5\. Mira's Attic: the ornament box** (text, 100 points)

- **Room requires:** JUL\_ATTIC\_KEY. **Puzzle requires:** JUL\_FRAGMENT\_2.
- **LockedText (Mira):** "This box only opens for someone who has read Uggla's starred books." The player can enter the attic before the library, then come back.
- **Item line (Mira, with JUL\_FRAGMENT\_2):** "The starred word from the library opens this lock. Go on, the counting is the hard part."
- **Clue:** the box holds 13 ornaments: red baubles, gold bells and pine cones. There are twice as many red baubles as gold bells, and one more pine cone than gold bells.
- **Drawing:** before solving, show the box with a note, not 13 countable ornaments, or the picture gives the answer away.
- **Question:** "How many red baubles are in the box?" Accepted: 6\.
- **Reward:** JUL\_FRAGMENT\_3. Mira says it in her speech bubble, and the journal records it: "The third digit is 6."
- **After solving:** the box shows 3 gold bells, 6 red baubles and 4 pine cones.

**6\. Final Door** (text, 200 points, IsFinalPuzzle)

- **Puzzle requires:** JUL\_FRAGMENT\_1, JUL\_FRAGMENT\_2, JUL\_FRAGMENT\_3.
- **Clue:** the door and its knocker are visible from the start with a blank three-digit dial. The code is never shown anywhere before it is solved.
- **Question:** "Enter the three digits in the order you found them in the kitchen, the library and the attic." Accepted: 246\.
- **After solving:** the dial shows 246, the ending plays, and the certificate opens.

Write complete greetings, hints, nudges, retry texts and success texts for every row. Hints point toward a way of thinking, never the answer. RetryText never reveals the answer.

### 9\. Controls and buttons

- **Submit answer** registers the selected choice or typed text every time, and only checks the answer. Pressing Hint must not block it.
- **Wrong answer:** show the RetryText, lock the choices so the feedback stays visible, and replace Submit answer with a button labeled exactly **Try again**. Do this for both choice and typed puzzles.
- **Try again:** clears the feedback, clears typed text, reshuffles the choices, and brings Submit answer back.
- **Shuffle:** choice options appear in a fresh random order each time a puzzle opens.
- **Return to map**, **Pause** and **Restart** are always available during play.
- **Restart:** ask once with an in-page confirmation panel (not a browser pop-up). On confirm, reset the full in-memory game state (room, solved puzzles, inventory, journal, hints, points, timer, pause, and every after-solving drawing) and start a fresh session on the start screen. Clearing a saved value alone doesn't count as a restart.
- Clear typed answers whenever the player moves between puzzles.

### 10\. Completion certificate

After the door opens, show a printable certificate with the player or team name (editable before printing), the date, elapsed time without paused time, points, hints used, rooms unlocked (3 of 3), puzzles solved (6 of 6\) and a closing line from Nisse. Print only the certificate, and make it look good as a screenshot so players can share it in Teams themselves.

### 11\. Accessibility

Keyboard controls with visible focus, readable contrast, text labels next to every icon, and a room list as an alternative to the map. Every SVG clue has screen-reader text that carries exactly the same labels, numbers and symbols as the picture. Announce feedback, dialogue and unlocks. Respect reduced motion for confetti, transitions and character movement. Make it work on a phone and a desktop.

### 12\. Data safety and validation

Treat list content as untrusted text: render every list value as text, never as HTML, and never run code or formulas from list fields. Before play, validate duplicate IDs, unknown item IDs, unreachable rooms, circular requirements, invalid accepted option IDs, missing points and a missing or duplicate final puzzle. Show a clear message for bad data, and never let a data error count as a win. This is a fun game, not secure answer checking: answers are readable in the list and the page.

### 13\. Rules from the first build

These are mistakes Copilot made the first time. Avoid each one.

1. **Parse before use:** JSON text columns are strings until parsed. Don't call array methods on them directly.
2. **SVG must draw:** never insert SVG as escaped text. If the markup shows up on screen as text, it's broken.
3. **Labels must be visible:** if the text says a jar or tag is labeled, the label has to be drawn in the picture. Don't use decorative shapes as clues.
4. **Nothing gives an answer away:** check every room description, question, picture and hint. No picture or text may show the answer or the order, and the code never appears before the door is solved.
5. **The view must supply every column:** make sure the dashboard view includes every column the game reads. Use the built-in copy of the content only when the list can't be read, show a small notice when that happens, and update that copy whenever list content changes. If the list is read but the rows are invalid, show a blocking error that names the problem (for example the wrong number of rows or a missing field) and do not use the built-in copy.
6. **No undefined names:** run the finished script and check for errors such as a variable that was never declared, in both copies.
7. **Don't hide errors:** no empty try/catch blocks. Let real errors show during testing.
8. **Both copies, every time:** after each change, confirm that the list view and the standalone dashboard file in the document library both have it.
9. **Verify before saying done:** reload each copy and confirm the change is visible before you report it as fixed. Say which copy you checked.
10. **Respect confirmations:** if a list update expires while waiting for my confirmation, stop and tell me. Don't work around it by moving content into the HTML or the built-in copy.
11. **Make the digits obvious:** each digit note appears in the character's speech bubble and in the journal, so a player never has to guess where a digit came from.

### 14\. Build order and checks

First give me a short plan: the map, the dependencies, where the characters go, and anything this hosting setup can't do. Then build it.

Before you report back, play each copy from a fresh start and confirm each check, marking it as passed in the list view, passed in the standalone dashboard file in the document library, or not tested:

- The list has six rows, with every field filled in.
- Solo and Team both start the game. The Entrance Hall, Kitchen and Workshop are open, and the other three are locked with a clear reason.
- Each character greets on the first visit and speaks the hint when asked.
- The card stamp and the four envelope seals are drawn as symbols, not text or markup, and the screen-reader text matches them exactly.
- The jars show their labels, and the tag numbers aren't hidden behind any shapes.
- No room shows an answer, an order or the code before it's solved.
- A wrong answer locks the choices and replaces Submit answer with Try again, for both a choice and a typed puzzle. Try again reshuffles the choices.
- The attic box stays shut until the player has the library fragment, and Mira explains why.
- Each solved puzzle redraws its solved state and keeps it on return.
- Replaying a solved puzzle adds no points or items.
- The final door refuses missing fragments and wrong codes, and opens with all three fragments and 246\.
- Pause stops the clock, and the certificate leaves out paused time and prints on its own.
- Restart asks once, then returns to a clean start screen. After restarting, the inventory, journal, points, timer and solved drawings are all reset, and the Library and Attic are locked again.
- Keyboard only, a narrow screen, and reduced motion all work.
- Emptying one required field shows a clear message, not a broken game or a false win.
- The browser console shows no script errors in either copy.

Keep the first build small and easy to extend with new rooms, characters and puzzles. Don't add leaderboards, analytics, outside services or unrequested frameworks.
