---
name: project-intelligence-timeline-dashboard
description: >
  Generates a self-contained, dependency-free HTML timeline dashboard that visualises the Project Intelligence Engine output — KPI bar, planned-vs-actual contrast panel, root cause, causal chain, signal-trail timeline, early-warnings table, governance summary, and recommendation. Use when the user asks to "build the timeline dashboard", "visualize the project intelligence output", "generate the project intelligence dashboard", or "create the root cause HTML dashboard". Final stage of the Project Intelligence Engine; requires the Change Events list and analysis from the prior two skills.
---

# Timeline Dashboard Generator

## Purpose
Generate a complete, self-contained HTML file that visualises the full Project Intelligence Engine output as an interactive root cause analysis dashboard. The file must be saved to SharePoint and opened directly in a browser — no external dependencies of any kind.

The dashboard answers two questions every stakeholder needs answered after a project goes off the rails:
1. *"What went wrong, and when did we know?"*
2. *"How far off was the original plan — and why?"*

Every visual choice should serve those questions. The audience is a delivery director, client sponsor, or steering committee member who needs to understand the failure pattern in under 5 minutes — not a technical reader who will study it carefully.

---

## Inputs
This skill reads from two sources:

**1. Change Events list** — must be fully populated by both prior skills:
- Change Event Extraction: 16 fields per event
- Root Cause Analysis: `Is Root Cause`, `Intervention Window`, `Early Warning Signal`, `Root Cause Statement`, `Intervention Action`, `Detectability`, `Causal Chain Step`

**2. SHAREPOINT.md — Project Analysis Summary section** — for the root cause statement, causal chain narrative, failure type, and recommendation used in the dashboard callout boxes.

If the Change Events list is empty, the root cause flags are not set, or the Project Analysis Summary in SHAREPOINT.md is blank, run Change Event Extraction and Root Cause Analysis first.

All KPI metrics and the Scope Churn Index are computed from the Change Events list at generation time.

---

## Required Sections (in order, top to bottom)

---

### Section 1 — Project Header Bar
A dark navy (`#1B365D`) full-width header containing:
- Project name (large, white, bold)
- Client name (smaller, light gray)
- Engagement type and contract reference in small gray text
- Four stat pills in a row:
  - "Original completion: [date]" — neutral gray
  - "Revised completion: [date]" — amber (`#BF6A00`) if delayed, green if on track
  - "Original contract: $[value]" — neutral gray
  - "Projected overrun: $[amount]" — red (`#C00000`) if overrun, gray "Within budget" if not
- A small badge in the top-right corner showing the **Documentation Quality Rating** (1–5) with a colour: red for 1–2, amber for 3, green for 4–5, labelled "Doc Quality"

---

### Section 2 — KPI Metrics Bar
A horizontal band of metric cards immediately below the header, rendered as a single row of 6 equal cards on a light gray background (`#F4F6F8`). Each card:
- A large bold number (the metric value)
- A small label below it
- A coloured left border: red for negative, green for positive, gray for neutral

The six cards, left to right:
1. **Total change events** — gray border
2. **HIGH signal events** — red border
3. **HIGH signals actioned** — format "N of N" — green if all actioned, amber if partial, red if none
4. **Events with no change order** — red border, include % in small text below
5. **Governance gap score** — red if ≥ 7, amber if 4–6, green if ≤ 3 — label "/ 10"
6. **Scope Churn Index** — format "N%" — red if ≥ 50%, amber if 25–49%, green if < 25%

---

### Section 3 — The Contrast Panel
This is the most important visual in the dashboard. It must appear before the timeline.

Render a side-by-side comparison of **what the project was built on** vs **what was actually found**. Use the Scope Churn Index table from the Change Event Extraction output. Show one card pair per changed parameter.

**Primary parameter pair (data volume + table count):**

**Left card — "What the Plan Was Built On"** (light blue background `#DAE8FC`):
- Large bold number: the assumed data volume
- Below it: the assumed table count
- Below that, in small italic text: the source document and week — e.g. *"Single verbal estimate — Discovery Workshop, Week 2"*
- Label at top: "PLANNED BASIS" in blue uppercase small caps

**Right card — "What Profiling Found"** (light red background `#FFEBEB`):
- Large bold number: the actual data volume in red
- Below it: the actual table count in red
- Below that: any additional context from the profiling report (e.g. undocumented schemas, data quality issues)
- Label at top: "ACTUAL" in red uppercase small caps

Between the two cards, render a large arrow (→) and a variance callout showing the percentage difference for each parameter — e.g. **"+212% volume · +89% tables"** — in bold red.

**Secondary parameters (budget, timeline, team size, etc.):**
Below the primary pair, render a compact row of smaller parameter cards for any other parameters in the Scope Churn Index table, showing baseline → actual → variance % for each.

---

### Section 4 — Root Cause Statement
A prominent full-width callout box in dark navy (`#1B365D`) with white text, containing:

**ROOT CAUSE** label in small caps teal (`#2C7DA0`), followed by the root cause event number and title in small gray text.

Then the root cause statement sentence in large bold white text — e.g.:
*"A verbal data volume estimate made in Week 2 was accepted as the project baseline without validation, anchoring the sprint schedule, resource plan, and budget to a figure that understated actual scope by 212%."*

Below that, in smaller white text in two columns:
- Left: Failure type — e.g. "Assumption failure + Governance failure (compound)"
- Right: Preventability — e.g. "Preventability: HIGH — standard discovery validation would have caught this"

---

### Section 5 — Causal Chain
A numbered step-by-step sequence (max 8 steps) showing how the root cause cascaded into the impact event. Render as a clean vertical flow with connecting arrows between steps.

Each step:
- Step number in a colored circle (navy background, white text)
- Bold event title (with event # from change log in gray)
- One sentence explanation
- Small "Week N — [date]" label
- If this step had an **intervention window**: show a small amber badge "⚠ Intervention window" and a one-sentence tooltip/subtext describing what the available action was

---

### Section 6 — The Signal Trail Timeline
A vertical timeline running top to bottom, oldest event at top. This is NOT a horizontal timeline — vertical layout allows each event to breathe and be read properly.

For each event in the change log, render a card with:

**Card layout:**
- A coloured circle on the left spine (colour by signal strength — see below)
- Week number and exact date in small gray text (top left)
- Event number in small gray text (top right)
- Event title in bold
- Event type badge (small, rounded, colored by type)
- One-sentence description
- A "Source: [document name and section]" tag in gray italic
- A "Raised by: [name, role]" tag if documented
- If **Parameter changed**: show a small pill with before → after values (e.g. "2 TB → 6.24 TB")
- If **no change order raised** AND one was warranted: show amber badge "⚠ No CR raised"
- If **no documented approver**: show gray badge "Approver unknown"
- If **Missing information** is documented: show a small expandable section (CSS-only details/summary) with the missing information note

**Root cause event**: replace the coloured circle with a larger RED circle labelled "ROOT CAUSE" and draw a red border around the entire card.

**Between consecutive events**: if there is an intervention window at this point (from the Root Cause Analysis output), render a subtle dashed amber connector line with the label *"Intervention window"* and the specific available action.

**Event type colours (circle on spine):**
- Scope assumption established → Blue `#2980B9`
- Scope change → Blue `#1A5276`
- Technical decision → Purple `#7D3C98`
- Client request → Teal `#148F77`
- Risk event → Orange `#E67E22`
- Budget event → Dark amber `#9A7D0A`
- Schedule event → Gray `#5D6D7E`
- Governance event → Dark gray `#2C3E50`
- Signal / early warning → Amber `#BF6A00`

**Signal strength ring** (outer ring on the spine circle):
- HIGH → Red outer ring `#C00000`
- MEDIUM → Amber outer ring `#BF6A00`
- LOW → No outer ring

---

### Section 7 — Early Warnings Missed Table
A table with five columns: **Week** | **Signal** | **Signal strength** | **What was done** | **What should have been done**

Each row is an early warning signal from the Root Cause Analysis output. Apply row background colours:
- Amber (`#FFF3CD`) — signal was present and noted but not escalated
- Light red (`#FFEBEB`) — signal was explicitly downrated or dismissed
- Light gray (`#F8F9FA`) — signal was not visible at the time (LOW detectability)

Below the table, state: *"N of N HIGH-detectability signals were not formally actioned. The earliest unactioned HIGH signal was N weeks before the impact event."*

---

### Section 8 — Governance Summary
A compact two-column layout:

**Left — Top 3 Governance Gaps** (from Change Event Extraction, Section 3):
Three numbered items, each: what it was, when, what the correct action should have been.

**Right — Documentation Quality Rating**:
A large number (1–5) in a coloured box (red 1–2, amber 3, green 4–5) with the one-sentence rating explanation and the Documentation Quality scale (1–5 definitions) in small text.

---

### Section 9 — Recommendation Card
A single card in light green (`#E2EFDA`) with a dark green left border (`#1E8449`) containing:

**Bold label:** "If this engagement started again today"

Then the recommendation from the Root Cause Analysis output, structured as:
- **Recommendation**: [one sentence]
- **When**: [at which point in the engagement]
- **Owner**: [role]
- **What it changes**: [specific downstream events prevented, with event numbers]

---

## Styling Requirements
- Font: `system-ui, -apple-system, Arial, sans-serif` — no external fonts
- No external CSS frameworks, no CDN links, no icon libraries
- All CSS in a single `<style>` block in `<head>`
- Page max-width: 1040px, centered, with 24px side padding
- Section spacing: 48px between sections
- Use subtle box shadows (`0 2px 8px rgba(0,0,0,0.08)`) and rounded corners (8px) throughout
- The KPI metrics bar and contrast panel should feel like a real dashboard — dense, scannable, data-forward
- The timeline events should feel like cards — not a plain list
- Print-friendly: no fixed heights that cut off content when printed. Use `page-break-inside: avoid` on event cards

---

## Output
Return only the complete HTML. No preamble, no explanation, no markdown fences. Begin with `<!DOCTYPE html>`. The file must render correctly when saved as `.html` and opened in any modern browser.

The filename should be: `[ProjectName]_Project_Intelligence_[YYYY-MM-DD].html`

State this filename on the line immediately before the HTML begins, as:
`<!-- SAVE AS: [filename] -->`
