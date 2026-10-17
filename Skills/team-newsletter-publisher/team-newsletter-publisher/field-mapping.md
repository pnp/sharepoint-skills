# Team Newsletter — Field Mapping and Design Rules

Every content element in the newsletter comes from one field in the Word file. Decorative elements (masthead band, accent rule, contents strip, rules, footer) never take field content.

The field names below are the `{{Field}}` placeholders in the Word template `Team-Newsletter-Template.docx`, which is downloadable from the sample README (it is not part of the skill package).

## Field mapping


### Header and masthead

| Word field | Component | Styling | Length | If empty |
|---|---|---|---|---|
| `{{IssueMonth}}` | Masthead top line (right), masthead title (H1) and footer | Top line 7.5 pt bold caps #DCE8F3; H1 40 pt bold #FFFFFF on #03274A | Month + year, e.g. “October 2026” | Required. If empty, use the month of publication. |
| `{{IssueSummary}}` | Masthead standfirst under the title | 12 pt regular #DCE8F3 on #03274A | 1–2 sentences, max 35 words | Hide the line. |
| `{{OneSentenceSummary}}` | Yellow callout “This month in one sentence:” | 9.5 pt bold #03274A on #FFD633 | 1 sentence, max 30 words | Hide the callout box. |

### 1 · Featured story

| Word field | Component | Styling | Length | If empty |
|---|---|---|---|---|
| `{{FeaturedTag}}` | Kicker before the date | 8 pt bold caps, tracking 0.14 em, #164C80 | 1–2 words | Show the date only. |
| `{{FeaturedDate}}` | Kicker after “·” | 8 pt regular caps #5A5A57 | e.g. “6 October 2026” | Show the tag only; drop the “·”. |
| `{{FeaturedTitle}}` | Featured headline (H3); also the hero image alt text | 22 pt bold #03274A, line-height 1.1 | 4–10 words, max 2 lines | Required — if empty, hide the whole section and renumber. |
| `{{FeaturedImage}}` | Hero image <figure>, full column width (see section C) | 16:9 frame, cropped to fill (cover), max height 70 mm in print; no border | Embedded picture from the Word file; landscape, ≥ 1600 px wide | Hide the figure; text moves up. Never show the token. |
| `{{FeaturedBody}}` | Body text, 2 columns (print) / 1 column (screen) | 10 pt regular #161616, line-height 1.45 | 120–200 words, 2–4 paragraphs | Hide the body; keep paragraph breaks from Word. |
| `{{FeaturedAction}}` | Action panel “Action for you:” | 9.5 pt #03274A on #DCE8F3, 3 pt #164C80 left rule | 1 sentence with a verb and a deadline | Hide the panel. |

### 2 · Latest news (N = 1, 2, 3)

| Word field | Component | Styling | Length | If empty |
|---|---|---|---|---|
| `{{NewsN_Tag}}` | Card kicker | 7.5 pt bold caps #164C80 | 1–2 words | Show the date only. |
| `{{NewsN_Date}}` | Card kicker after “·” | 7.5 pt regular caps #5A5A57 | e.g. “2 October 2026” | Show the tag only. |
| `{{NewsN_Title}}` | Card headline (H3) | 12 pt bold #03274A | 4–9 words | Hide the whole card; remaining cards share the row. All empty: hide section 2. |
| `{{NewsN_Body}}` | Card text | 9 pt regular #161616 | 35–55 words | Keep the card if the title exists. |
| `{{NewsN_Link}}` | Card link with “→” | 8.5 pt bold #164C80; link text from Word, URL as target | Link text 2–6 words; if only a URL, show “Read more” | Hide the link line. |

### 3 · Upcoming events (N = 1, 2)

| Word field | Component | Styling | Length | If empty |
|---|---|---|---|---|
| `{{EventN_DateTime}}` | Column “When” | 9 pt bold #03274A, date on line 1, time on line 2 | e.g. “Thu 22 Oct 2026 · 10:00–11:00” | — |
| `{{EventN_Type}}` | Type badge in column “Type / Title” | 7 pt bold caps #FFFFFF on #164C80 | 1 word (Webinar, Workshop …) | Hide the badge. |
| `{{EventN_Title}}` | Event title under the badge | 9.5 pt bold #03274A | 3–8 words | Drop the table row. If both events are empty, hide section 3. |
| `{{EventN_Desc}}` | Column “Details” | 9 pt regular #161616 | max 25 words | Leave the cell blank. |

### 4 · Team spotlight

| Word field | Component | Styling | Length | If empty |
|---|---|---|---|---|
| `{{Spot1_Name}}` | Spotlight name | 13 pt bold #03274A | Full name as approved by the person | Hide section 4 (with Spot1_Story). |
| `{{Spot1_Role}}` | After the name, “— Role” | 13 pt regular #5A5A57 | Job title, max 6 words | Drop the dash and role. |
| `{{Spot1_Story}}` | Spotlight text in tint panel | 9.5 pt regular #161616 on #F5F8FB, 3 pt #03274A left rule | 60–100 words | Hide section 4. |

### 5 · Quick tips (N = 1, 2)

| Word field | Component | Styling | Length | If empty |
|---|---|---|---|---|
| `{{TipN_Title}}` | Numbered tip heading | 10.5 pt bold #03274A; number disc #164C80 | 3–8 words | Hide that tip; if both empty, hide section 5. |
| `{{TipN_Body}}` | Tip text | 9.5 pt regular #161616 | 25–45 words | Show the title only. |

### 6 · Have something for the next issue?

| Word field | Component | Styling | Length | If empty |
|---|---|---|---|---|
| `{{ContributeNote}}` | Dark panel text | 9.5 pt regular #DCE8F3 on #03274A | 1–3 sentences | Use: “Send your ideas to the newsletter team.” |
| `{{NextDeadline}}` | “Deadline for next issue:” value | Label 9.5 pt bold #FFFFFF; value bold #FFD633 | Weekday + date | Hide the deadline line. |

## Hero image rules

- **Where it is:** The Word template holds no picture: {{FeaturedImage}} is a text token in the Featured story block, followed by a bracketed instruction note (older copies use the caption “Hero image (map this field as Image)”). When the form maps it as an Image field, the generated Word file contains an embedded picture (a drawing) in that spot, inside the Featured story block. In the .docx package the file is stored in word/media/.
- **Which picture:** Use the first picture in the Featured story block. Ignore the bracketed note under {{FeaturedImage}} (“(Image from Word to HTML has shown mixed results …)”), the sentence after it (“Update the Skill if you choose the Library route for the image.”) and the caption “Hero image (map this field as Image)” — they are instructions, never content.
- **Library alternative:** The template's note mentions taking the hero image from the document library by file name instead of embedding it in Word. This skill does not do that — it uses the embedded picture. If you choose the library route, update this skill (SKILL.md step 4 and these rules) first.
- **Embed it:** HTML: place it in <figure><img data-field="FeaturedImage"> as a data: URI so the file stays self-contained. PDF: embed the image itself; never link to an external file.
- **Size and crop:** Full column width (184 mm on A4). Frame ratio 16:9, cropped to fill and centred (object-fit: cover), max height 70 mm in print. Never stretch, add a border, text overlay or caption.
- **Alt text:** alt = FeaturedTitle. If the title is empty the whole Featured story section is hidden anyway.
- **No picture:** If the spot still contains the token {{FeaturedImage}}, or is empty, hide the figure entirely — the body text moves up. Never show the literal token, an empty box or a broken-image icon.

## Colours

| Hex | Name | Use |
|---|---|---|
| #03274A | Navy | Masthead band, section headings, headlines, table header, dark panel |
| #164C80 | Mid blue | Kickers, tags, links, card top rules, number discs, type badge |
| #161616 | Body text | All running text on white or tint |
| #5A5A57 | Muted grey | Dates, roles, meta text |
| #DCE8F3 | Pale blue | Text on navy; action panel; image frame background while loading |
| #F5F8FB | Tint | Spotlight panel, even table rows |
| #FFD633 | Yellow | Masthead accent rule, one-sentence callout, deadline value |
| #FFFFFF | White | Page background, text on navy / mid blue |

## Type scale (font: Arial, Helvetica, Liberation Sans, sans-serif)

| Element | Size | Weight | Line height |
|---|---|---|---|
| Masthead title (IssueMonth) | 40 pt | Bold | 1.0 |
| Featured headline | 22 pt | Bold | 1.1 |
| Section heading “N · Title” | 16 pt | Bold | 1.15 |
| Masthead summary | 12 pt | Regular | 1.4 |
| Card / spotlight name | 12–13 pt | Bold | 1.2 |
| Body text | 10 pt | Regular | 1.45 |
| Card, table, tip text | 9–9.5 pt | Regular | 1.4 |
| Kicker / meta / footer | 7.5–8 pt | Bold caps / regular | 1.2 |

## Components

- **Masthead band:** Full-bleed navy band with a 1.6 mm yellow accent rule. Top line: “TEAM NEWSLETTER” + IssueMonth; kicker “DEPARTMENT NEWSLETTER” in yellow; IssueMonth as H1; IssueSummary; contents strip listing the sections (decorative, renumbered when a section is hidden).
- **Callout:** Yellow box directly under the masthead: fixed label “This month in one sentence:” + OneSentenceSummary.
- **Section heading:** Number + “·” in mid blue, title in navy, 2 pt navy rule underneath. Numbered 1–6 in Word order; never alone at the bottom of a page.
- **Featured story:** Kicker (tag · date), headline, hero image figure, body in two columns (print), action panel.
- **News cards:** Up to three equal columns with a 3 pt mid-blue top rule; kicker, title, body, link. Empty slots are removed, not left blank.
- **Events table:** Navy header row (When | Type / Title | Details), thin rules, tint on even rows, type badge above the title.
- **Spotlight + tips:** Side by side (7 + 5 columns): tint panel with navy left rule; numbered tip list with thin dividers. If one is hidden, the other takes the full width.
- **Contribute panel:** Navy panel, pale-blue note, white label with yellow deadline value. Always the last element of the issue.
- **Running footer:** Thin rule; left “Internal newsletter · Page N” (as in Word), right “Team Newsletter · IssueMonth”.

## Pre-publish checklist

- [ ] Every {{…}} placeholder is replaced — search the result for “{{” and “[”.
- [ ] IssueMonth matches in the masthead, top line and footer.
- [ ] Empty news cards, event rows, tips and sections are removed, not left blank; section numbers run without gaps.
- [ ] The hero image is the picture from the Word file, cropped 16:9 and not distorted — or the figure is hidden.
- [ ] The hero image has alt text (FeaturedTitle) and is embedded, not linked.
- [ ] Dates, times and links are correct; every link opens.
- [ ] The spotlight person has approved name, role and story.
- [ ] No text is cut off or overlapping; no heading sits alone at the bottom of a page.
