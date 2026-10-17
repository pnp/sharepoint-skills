# Learning Designer — Field Mapping

Maps fields from the Learning Request Brief (Structured Document Generation output) to components in the self-contained HTML learning dashboard.

## Required fields

| Brief field          | Dashboard component                          | Notes |
|----------------------|----------------------------------------------|-------|
| `{LearningTopic}`    | Hero `<h1>` + page `<title>`                 | Main headline |
| `{TargetAudience}`   | Hero lede / short “one-sentence version” card or chips | Who this is for |
| `{LearningGoals}`    | Hero short card + opening section lead       | What learners will be able to do |
| `{Stage1Name}`       | Learning-path rail tile 1 + Stage 1 `<h2>`   | First stage title |
| `{Stage1Description}`| Stage 1 lead paragraph                       | |
| `{Stage1KeyPoints}`  | Stage 1 content (bullets or Why/When/How/Check blocks) | |
| `{Stage2Name}`       | Learning-path rail tile 2 + Stage 2 `<h2>`   | |
| `{Stage2Description}`| Stage 2 lead                                 | |
| `{Stage2KeyPoints}`  | Stage 2 content                              | |
| `{Stage3Name}`       | Learning-path rail tile 3 + Stage 3 `<h2>`   | |
| `{Stage3Description}`| Stage 3 lead                                 | |
| `{Stage3KeyPoints}`  | Stage 3 content                              | |

## Optional fields

| Brief field               | Dashboard component                              | Notes |
|---------------------------|--------------------------------------------------|-------|
| `{Prerequisites}`         | Early “Before you start” note or section         | |
| `{AuthoritativeSource}`   | Source notes / footer + grounding reference      | Used to ground content; never invent facts |
| `{EstimatedDuration}`     | Hero chips (e.g. “15 min”)                       | |
| `{Owner}`                 | Footer or “Take it further” card                 | |
| `{FlashcardConcepts}`     | Flip-card decks after relevant stages + final quiz | Split into individual cards |
| `{PracticeExercise}`      | Practice / “Try it” block inside a stage or after | |
| `{SuccessCriteria}`       | Check cell or success criteria callout           | |
| `{KnowledgeChecks}`       | “Check your understanding” flashcard set         | |
| `{NextSteps}`             | Final “Take it further…” section + ladder        | |

## Image handling

| Source | Dashboard placement | Notes |
|--------|---------------------|-------|
| Fixed-name image in the same folder as the brief | Hero area (right side of the hero grid) or immediately after the hero as an overview visual | Filename must be exactly `learning-visual.png` (or `.jpg`). Skill embeds it as a base64 data URI so the HTML stays self-contained. If the file is missing, omit the image and continue. |

The image is always placed in the same visual position as the overview visual in the Custom Skills in PowerPoint example: prominent, near the top, supporting the opening explanation.

- Maximum 3 stages (do not invent extra stages).
- Use the established dashboard design system (navy/yellow palette, CSS-only flip cards, inline script only as in the reference page with no external scripts, libraries or CDNs, self-contained HTML).
- Prefer Why / When / How / Check blocks for procedural content.
- Ground content from `{AuthoritativeSource}` when provided; mark unverified items with a visible warning.
- Keep the page usable without images (written instructions complete).
- Output a single `.html` file. To publish it, save the file, upload it to a SharePoint document library, and open it from there. Do not paste it into a text web part, which removes the page's styles and script.

## Form → Brief → Dashboard flow

1. Content manager uploads this template and publishes the Structured Document Generation form.
2. Requestor fills the form (required fields enforced).
3. Submission generates a filled Learning Request Brief `.docx`.
4. User attaches or selects the brief and invokes the **Learning Designer** skill.
5. Skill reads the fields, applies this mapping, and emits the HTML dashboard.
