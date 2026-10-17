---
name: learning-designer
description: "Turns a structured Learning Request Brief (from a SharePoint Structured Document Generation form) into a self-contained HTML learning dashboard with up to 3 stages, flashcards, practice, and checks. Use when the user attaches or selects a Learning Request Brief and asks to build a learning experience, create a dashboard from the brief, or design a guided learning page."
---

# Learning Designer

Turn a filled Learning Request Brief into a single self-contained HTML learning dashboard that matches the established visual system (navy/yellow, CSS-only flip cards, staged path, Why/When/How/Check blocks).

## When to use

- User provides or selects a Learning Request Brief `.docx` generated from the form.
- User asks to “build the learning dashboard”, “turn this brief into a learning experience”, or “design the page for this topic”.

## When not to use

- Plain article or support page with no stages or interactivity.
- General slide deck without the dashboard request.
- Topics that require more than 3 stages (collapse or ask the user to revise the brief).

## Image handling

- Look in the same folder as the Learning Request Brief for a file named exactly `learning-visual.png` (preferred) or `learning-visual.jpg`.
- If found, embed it as a base64 data URI inside the HTML so the page remains fully self-contained.
- Place it in the hero grid (right side) or immediately below the hero as the overview visual — the same prominent position used in the Custom Skills in PowerPoint example.
- Add a short caption if the brief supplies one; otherwise use a neutral caption such as “Overview”.
- If the image is missing, omit it cleanly and continue. Never invent an image or use a placeholder that implies content exists.

## Flashcards

- Turn `{FlashcardConcepts}` and `{KnowledgeChecks}` into CSS flip cards using the `.flip` / `.flipInner` / `.flipFace` pattern added to the reference.
- Front = question or concept, back = answer.
- Cards must flip on hover and on keyboard focus (`:hover` and `:focus-within`).
- Place the deck in its own section or after the relevant stage. Do not use static button quizzes for these items.

- Do **not** add any organisational branding, logos, or text such as company names or site headers that are not present in the reference template.
- Clone only the structure and content from `references/test-output-custom-skills.html`. Do not invent or inject extra header elements.
- If the generated page includes any external branding, remove it before finishing.

Use `references/test-output-custom-skills.html` as the exact structural and visual reference. 

Match its:
- Overall layout, CSS variables, and class names
- Tab navigation (Overview / 1. Understand / 2. Use / 3. Build)
- Hero with figure image placement
- Card grids, control views, quiz blocks, and next-step buttons
- Typography, spacing, and colour system

When generating a new dashboard:
- Keep the CSS and JavaScript intact.
- Replace only the content (headings, body text, stage names, quiz questions, practice text, image src if a new `learning-visual.png` is supplied).
- Preserve the tab panel structure and interactive behaviour.
- Embed any new image as a base64 data URI in the same hero `<figure>` position.

Do not switch to a different design system. This file is the source of truth for look and interaction.

## Core workflow

1. **Read the brief**  
   Extract all fields from the attached/selected Learning Request Brief. Required fields: LearningTopic, TargetAudience, LearningGoals, and the three stage sets (Name / Description / KeyPoints).

2. **Apply the mapping**  
   Use `mapping.md` (or the embedded rules below) to place each field into the correct dashboard component. Do not invent stages beyond the three supplied.

3. **Ground the content**  
   If `{AuthoritativeSource}` is present, read it and base facts on it. Never fabricate product behaviour, URLs, or claims. Mark any unverified detail with a visible amber warning callout.

4. **Build the HTML**  
   Produce one self-contained `.html` file:
   - Hero with topic, audience, goals, duration chip (if supplied).
   - Learning-path rail with exactly the stages provided (1–3).
   - One section per stage using Why/When/How/Check blocks where the content is procedural.
   - Flip-card decks from FlashcardConcepts and KnowledgeChecks.
   - Practice exercise + success criteria.
   - “Take it further” / next-steps section.
   - Footer with owner and source notes.

5. **Validate**  
   Confirm: the only script is the inline `<script>` block from the reference page (no external scripts, libraries or CDNs), no `on*` handlers, no external assets, keyboard-reachable flip cards, prints fully. Copy the design-system CSS verbatim.

6. **Deliver**  
   Save the HTML and give a short summary: topic, stages, any placeholders left, and how to publish the page: save the HTML file, upload it to a SharePoint document library, and open it from there.

## Field placement (quick reference)

| Field | Dashboard location |
|-------|--------------------|
| LearningTopic | Hero h1 + title |
| TargetAudience | Hero lede / chips |
| LearningGoals | Hero short card + opening lead |
| StageNName | Rail tile + stage h2 |
| StageNDescription | Stage lead |
| StageNKeyPoints | Stage body (bullets or Why/When/How/Check) |
| FlashcardConcepts | Flip decks |
| PracticeExercise + SuccessCriteria | Practice block |
| KnowledgeChecks | Final quiz cards |
| NextSteps | Take-it-further section |
| Prerequisites, Owner, Source, Duration | Supporting notes, chips, footer |

## Design system rules

- Flip cards use CSS (`:hover` / `:focus-within`) and accordions use `<details>`, as in the reference page.
- Inline script only, as in the reference page: keep its single inline `<script>` block for the tabs and quiz buttons. No external scripts, libraries or CDNs.
- Self-contained (inline styles, inline SVGs).
- Maximum 3 stages.
- Written instructions must stand alone without images.

## Output

- One `.html` file (typically 40–70 KB).
- Short plain-language summary of what was built and any gaps left for the owner.
