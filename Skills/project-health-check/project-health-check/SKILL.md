---
name: project-health-check
description: Analyze SharePoint project content and project lists to produce a concise project health assessment covering schedule, risks, actions, decisions, and documentation. Use when the user asks for a project health check, project status assessment, RAG status, project review, or management health summary.
---

# Project Health Check

## Purpose

Assess the current health of a project from the SharePoint content available to the user. Review project documents and, when available, structured SharePoint lists such as milestones, risks, actions, decisions, and deliverables.

The skill must produce an evidence-based health assessment. Never invent project facts, dates, owners, statuses, or missing documents.

## Before Starting

1. Determine the project scope from the user's selection, current SharePoint location, or prompt.
2. Use the selected files and relevant project content available on the current SharePoint site.
3. Prefer current, authoritative project artifacts over older drafts.
4. If several project areas are present and the intended project is ambiguous, ask the user which project to assess.
5. If a project reporting date is explicitly provided, use it. Otherwise use the current date.
6. Do not require every source type below. Work with the information that is available and report coverage gaps.

## Preferred Sources

Look for evidence in these source types when available:

- Project charter, project brief, or initiation document
- Current status report
- Milestone or project plan
- Risk register
- Action / issue register
- Decision register
- Deliverables or document register
- Meeting minutes and steering committee notes
- Other project documents that contain dates, commitments, blockers, owners, or decisions

Structured lists should be treated as primary sources for the facts they own. For example, use a Risk Register for risk status when one is available rather than inferring all risks from narrative documents.

## Output Structure

Produce the result in this order.

### 1. Project Health

State one overall status:

- **GREEN** — project is broadly on track; no material issue needs management attention.
- **AMBER** — one or more material concerns require attention, but recovery appears achievable.
- **RED** — a critical condition threatens delivery or requires immediate management action.
- **UNKNOWN** — available evidence is insufficient for a reliable health assessment.

Then give a one-sentence explanation.

### 2. Health Summary

Use exactly these five bullet lines. Do not use a Markdown table because citation markers inserted by the host can break table rendering.

- **Schedule & milestones — GREEN / AMBER / RED / UNKNOWN:** evidence-based assessment
- **Risks & issues — GREEN / AMBER / RED / UNKNOWN:** evidence-based assessment
- **Actions — GREEN / AMBER / RED / UNKNOWN:** evidence-based assessment
- **Decisions & dependencies — GREEN / AMBER / RED / UNKNOWN:** evidence-based assessment
- **Documentation & governance — GREEN / AMBER / RED / UNKNOWN:** evidence-based assessment

### 3. Key Findings

Summarize the most important findings. Prefer 3–7 items and prioritize by business impact.

### 4. Management Attention

List only the items that need management action or awareness. For each item include:

- What needs attention
- Why it matters
- Owner, if explicitly known
- Due date, if explicitly known
- Recommended next action

### 5. Evidence and Coverage

State:

- Main sources used
- Important project areas for which evidence should already exist at the current reporting point but no reliable evidence was found
- Any assumptions or ambiguities that reduce confidence

Do not report a missing source type merely because it is common in project management. Do not call out a budget report, issue register, resource plan, or similar artifact unless the project says it is required/relevant or the user explicitly requested that dimension.

Give a confidence level: **High**, **Medium**, or **Low**.

## Step 1: Establish Project Context

Identify, when available:

- Project name
- Project manager
- Sponsor
- Start date
- Target completion date
- Current reporting period
- Main objectives and deliverables

Do not fail the health check if some of these values are missing. Record missing context as a governance or coverage observation only when it is material.

## Step 2: Review Schedule and Milestones

Determine the status of significant milestones and delivery dates.

Classify **Schedule & milestones** as:

### GREEN
- No material milestone is overdue.
- Near-term milestones appear achievable.
- No credible evidence indicates schedule slippage.

### AMBER
Use AMBER when one or more of these conditions is supported by evidence:
- A significant milestone is overdue but recovery is plausible.
- A milestone due soon is explicitly at risk.
- A dependency may cause delay.
- Current reporting states that schedule recovery or mitigation is required.

### RED
Use RED when one or more of these conditions is supported by evidence:
- A critical milestone has been missed with material delivery impact.
- The target completion date is no longer credible.
- A critical-path dependency is blocked with no viable mitigation.
- The current status report explicitly identifies schedule as critical/off track.

If no meaningful schedule information exists, use UNKNOWN.

### Schedule date wording

Distinguish date concepts precisely:

- **Overdue by N days** = reporting/current date minus planned due date, only when the item is incomplete.
- **Forecast delay / forecast variance of N days** = forecast completion date minus planned due date.
- Never describe forecast variance as the number of days an item is currently overdue.
- An item due on the reporting/current date is **due today**, not overdue.
- A future date is not overdue.

Example: if a milestone was due 10 September, today is 15 September, and forecast completion is 22 September, say **"5 days overdue and forecast to finish 12 days later than planned."**

## Step 3: Review Risks and Issues

Evaluate open risks and active issues. Consider severity, probability, impact, mitigation, ownership, and age where available.

Classify **Risks & issues** as:

### GREEN
- No open high/critical risk or major unresolved issue is identified.
- Material risks have owners and credible mitigations.

### AMBER
- At least one high risk exists but has a plausible mitigation.
- A material issue exists but recovery is in progress.
- A significant risk lacks a complete owner, mitigation, or target date.

### RED
- A critical risk or issue threatens a key project objective.
- A high-impact issue has no credible mitigation.
- Multiple high risks combine to threaten delivery.
- An issue has already invalidated a key project commitment.

If no reliable risk or issue evidence exists, use UNKNOWN.

## Step 4: Review Actions

Evaluate open actions from registers, minutes, and status reports.

Classify **Actions** as:

### GREEN
- No material action is overdue.
- Critical actions have owners and due dates.

### AMBER
- One or more important actions are overdue.
- A material action is missing an owner or target date.
- Several open actions show signs of execution delay.

### RED
- A critical overdue action blocks a milestone, decision, release, or mitigation.
- Repeatedly overdue actions materially threaten project delivery.

If no reliable action evidence exists, use UNKNOWN.

## Step 5: Review Decisions and Dependencies

Review unresolved decisions and important internal or external dependencies.

Classify **Decisions & dependencies** as:

### GREEN
- No material decision is overdue or blocking progress.
- Critical dependencies appear controlled.

### AMBER
- A decision is overdue or approaching a date where delay will affect delivery.
- A significant dependency is unresolved but has a manageable mitigation.

### RED
- An overdue decision or dependency is actively blocking a critical milestone.
- A required decision can no longer be delayed without material impact.

If no reliable evidence exists, use UNKNOWN.

## Step 6: Review Documentation and Governance

Evaluate whether key project artifacts are present, current, and internally consistent.

Only identify a document as missing when:
1. A project document/register explicitly defines it as required, or
2. The user supplied an expected-document checklist.

Do not assume that a generic project methodology automatically applies.

Classify **Documentation & governance** as:

### GREEN
- Required project artifacts found in the reviewed scope appear current enough for the reporting period.
- No material contradiction between authoritative sources is detected.

### AMBER
- A required artifact is overdue and the expected evidence is not present.
- A required artifact for a current or completed governance gate is missing, stale, materially incomplete, or contradictory.
- A required future artifact is credibly at risk because prerequisite work, preparation, approval, ownership, or scheduling is missing or delayed.
- Owners, review dates, or other key governance information needed for an upcoming gate are incomplete.

### Treatment of future deliverables

Do not classify a future required deliverable as missing, deficient, or a coverage gap merely because its final evidence does not yet exist.

Evaluate future deliverables according to their delivery context:

- **Expected / not yet due:** Informational only. Do not lower Documentation & governance solely because final evidence is not yet present.
- **Due soon and preparation is expected:** Assess whether preparation, prerequisites, ownership, scheduling, or draft evidence indicates that delivery is on track.
- **At risk before due date:** Use AMBER only when there is concrete evidence that the deliverable may not be ready for its required gate.
- **Past due:** If required evidence is still absent, normally use AMBER; use RED only when the missing evidence materially blocks a critical gate or project objective.
- **Required for a current/completed gate:** Missing required evidence is a governance deficiency even if another date field is ambiguous.

When a Deliverables Register identifies expected file/evidence, use it to determine what the project requires, but interpret Status, DueDate, Gate, prerequisite actions, and related project evidence together. A `Not Started` or `In Progress` status for a future deliverable is not automatically a problem.

Example: a Support Handover due one month from now should not be reported as missing simply because the final handover document does not yet exist. A Security Review due in two weeks may warrant AMBER if project evidence shows that its review date is still unconfirmed and the scheduling action is nearly due.

### RED
- Missing or unreliable governance evidence materially prevents control of the project.
- Required approval or governance documentation is absent for a critical project stage.

If required documentation cannot be determined, use UNKNOWN rather than inventing requirements.

## Step 7: Determine Overall Project Health

Use the following precedence:

1. **RED** if any area is RED and the condition materially threatens a key project objective, target date, compliance obligation, or major deliverable.
2. Otherwise **AMBER** if any area is AMBER.
3. Otherwise **GREEN** if all assessed areas are GREEN.
4. Use **UNKNOWN** if evidence is too incomplete to support GREEN, AMBER, or RED with confidence.

Do not mark the overall project RED solely because one area is UNKNOWN.

## Step 8: Generate Recommendations

Generate focused recommendations that follow directly from the findings.

Recommendations must:
- Be actionable.
- Name the affected milestone, risk, action, decision, or document when known.
- Reuse explicit owners and due dates when available.
- Never create fictional owners or dates.
- Prioritize recovery and decision-making over generic project-management advice.


## Step 9: Generate Standalone HTML Report

After completing and validating the Project Health Check, generate a standalone HTML webpage containing the final management report.

This is a presentation step only. The HTML report must represent the already completed and validated assessment. Do not recalculate, reinterpret, or change the health status while creating the webpage.

### Output behavior

When the user asks to generate, create, save, export, or provide the Project Health Check as an HTML report:

1. Generate a complete standalone HTML5 document, not an HTML fragment.
2. Create/save the result as an `.html` file when the execution environment provides a file-creation capability.
3. Use a meaningful filename. Prefer:
   `Project-Health-Check-[Project-Name]-[YYYY-MM-DD].html`
4. Replace characters that are unsafe for filenames with hyphens.
5. If file creation is not available, return the complete standalone HTML document so it can be saved as an `.html` file without modification.
6. Do not claim that a file was created or stored unless the environment actually created it.
7. Do not silently overwrite an existing report unless the user explicitly requested replacement and the environment supports it.

### Standalone webpage requirements

The generated file must be directly openable in a modern browser and must contain:

- `<!DOCTYPE html>`
- `<html lang="...">`
- `<head>`
- `<meta charset="utf-8">`
- `<meta name="viewport" content="width=device-width, initial-scale=1">`
- A meaningful `<title>`
- Embedded CSS inside a `<style>` element
- `<body>` containing the complete report

Do not require:

- external CSS files
- JavaScript
- external fonts
- external images
- CDN resources
- network access

The webpage must remain readable when opened locally or directly from a supported document location.

### Report structure

Use this logical structure:

1. Report header
   - Project name
   - Report title: Project Health Check
   - Reporting date
   - Overall GREEN / AMBER / RED / UNKNOWN status
   - One-sentence executive assessment

2. Health Summary
   - Schedule & milestones
   - Risks & issues
   - Actions
   - Decisions & dependencies
   - Documentation & governance

3. Key Findings

4. Management Attention
   For each material item include, when known:
   - Item
   - Owner
   - Due date
   - Why it matters
   - Recommended next action

5. Evidence and Coverage
   - Main sources used
   - Material evidence gaps
   - Assumptions or ambiguities
   - Confidence level

6. Report footer
   - Project name
   - Reporting date
   - Statement that the report was generated from the SharePoint project evidence available to the current user

### Visual design

Create a professional management-report layout using embedded CSS.

- Use a centered content container with a sensible maximum width.
- Use clear typography, spacing, headings, cards, and tables.
- Make the overall project health visually prominent.
- Show each health dimension with both its textual status and a visual status indicator.
- GREEN, AMBER, RED, and UNKNOWN may use distinct visual styling, but never rely on color alone.
- Keep sufficient contrast and make the report readable when printed.
- Use responsive CSS so the page remains usable on smaller screens.
- Allow tables to scroll horizontally on narrow screens if necessary.
- Add print CSS where useful so the report can be printed or converted to PDF cleanly.
- Do not add decorative elements that distract from management information.

### HTML safety and correctness

1. HTML-encode project-derived text before placing it into HTML.
2. Do not insert executable project content as HTML, CSS, or JavaScript.
3. Do not generate JavaScript.
4. Do not invent hyperlinks to SharePoint content.
5. If reliable source URLs are available from the execution environment and links are included, use only those actual URLs.
6. Preserve citations/source references when the host environment supports them, but do not invent citation identifiers.
7. Ensure opening and closing HTML tags are valid and balanced.
8. The resulting document must be usable without further editing.

### HTML skeleton

Use the following structure as guidance. Adapt content to the actual assessment.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Project Health Check - [Project Name] - [Reporting Date]</title>
  <style>
    /* Self-contained report styles */
  </style>
</head>
<body>
  <main class="report">
    <header>
      <p class="eyebrow">Project Health Check</p>
      <h1>[Project Name]</h1>
      <p>Reporting date: [Reporting Date]</p>
      <section class="overall-health">
        <h2>Overall Health: [STATUS]</h2>
        <p>[Executive assessment]</p>
      </section>
    </header>

    <section>
      <h2>Health Summary</h2>
      <!-- Five health dimensions -->
    </section>

    <section>
      <h2>Key Findings</h2>
      <ul>
        <!-- Evidence-based findings -->
      </ul>
    </section>

    <section>
      <h2>Management Attention</h2>
      <!-- Actionable management items -->
    </section>

    <section>
      <h2>Evidence and Coverage</h2>
      <!-- Sources, gaps, assumptions and confidence -->
    </section>

    <footer>
      <!-- Project, reporting date and evidence statement -->
    </footer>
  </main>
</body>
</html>
```

### Default versus HTML mode

For a normal request such as:

`Run the Project Health Check for Project Aurora.`

return the concise interactive Project Health Check defined earlier in this skill.

For a request such as:

`Run the Project Health Check for Project Aurora and create the final HTML report.`

perform the same assessment, validate it, and then create the standalone HTML webpage.

For a follow-up such as:

`Create the HTML report from this assessment.`

reuse the validated assessment from the current conversation when it is clearly available and still applicable. Do not unnecessarily recalculate the project health unless the user asks for a refreshed assessment.


## Rules

1. **Evidence first.** Every material finding must be traceable to available SharePoint content.
2. **No fabricated facts.** Never invent project status, percentages, dates, owners, risks, decisions, or required documents.
3. **Current over old.** Prefer the newest authoritative source when versions conflict, but mention important contradictions.
4. **Status is not sentiment.** Do not classify a project as healthy because narrative language is optimistic when structured evidence shows overdue or blocked work.
5. **Do not silently change project content.** This skill performs assessment and reporting unless the user explicitly requests an allowed update.
6. **Respect permissions.** Use only content available to the current user.
7. **Be concise.** Management output should normally fit on one screen before the Evidence and Coverage section.
8. **Dates matter.** Compare due dates against the reporting/current date before labeling anything overdue.
9. **Separate risk from issue.** A risk is a possible future event; an issue is a condition that has already occurred.
10. **Signal uncertainty.** If evidence is incomplete or contradictory, reduce confidence and say why.

## Example

User request:

`Run the Project Health Check for Project Aurora.`

Example abbreviated result:

### Project Health: AMBER
Delivery remains achievable, but an overdue integration milestone, two overdue actions, and an unresolved architecture decision require attention.

- **Schedule & milestones — AMBER:** Integration testing started later than planned; recovery is still described as achievable.
- **Risks & issues — AMBER:** One high integration risk remains open with mitigation in progress.
- **Actions — AMBER:** Two material actions are overdue.
- **Decisions & dependencies — AMBER:** Architecture decision D-014 is overdue and affects the deployment approach.
- **Documentation & governance — AMBER:** Required deliverables are tracked. The Security Review requires attention because its review date is not yet confirmed and the related scheduling action is due soon. Other future deliverables remain within their planned delivery windows and are not treated as missing.

### Management Attention
- **ADR-014 — Hosting model:** overdue decision; resolve before deployment planning can be finalized.
- **A-023 — Test environment:** overdue; environment readiness is required for integration testing.

### Evidence and Coverage
Primary evidence: latest status report, milestone plan, risk register, action register, decision register, and deliverables register. Confidence: **High**.

## Validation Checklist

Before returning the assessment, verify:

- [ ] The reporting/current date was used consistently for overdue checks.
- [ ] Every RED or AMBER conclusion is supported by evidence.
- [ ] No owner, date, percentage, or project fact was invented.
- [ ] Missing documentation was identified only from an explicit requirement or checklist.
- [ ] Contradictory sources were called out.
- [ ] Management attention contains only material items.
- [ ] The overall RAG status follows the precedence rules.
- [ ] Current overdue days and forecast variance are not confused.
- [ ] Items due today are not called overdue.
- [ ] Every explicitly required deliverable was evaluated against its due date, gate, status, prerequisites, and current project phase.
- [ ] Future required artifacts are not treated as deficiencies solely because final evidence does not yet exist.
- [ ] A future deliverable is marked AMBER only when concrete evidence indicates preparation, scheduling, prerequisites, ownership, or delivery is at risk.
- [ ] Unrequired source types are not reported as coverage gaps merely because they are common project artifacts.
- [ ] Evidence coverage and confidence are stated.
- [ ] If standalone HTML was requested, the HTML contains DOCTYPE, html, head, embedded CSS, and body.
- [ ] The HTML report contains the same validated RAG assessment as the analysis.
- [ ] Project-derived content is safely HTML-encoded.
- [ ] The HTML has no external runtime dependencies and can be opened as a standalone webpage.
- [ ] A created file is only claimed when file creation actually succeeded.
