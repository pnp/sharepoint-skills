---
name: decision-register-builder
description: Analyze SharePoint project content to identify, classify, consolidate, and prepare evidence-based project decision register entries. Use when the user asks to build, update, review, extract, or prepare a decision register or decision log from project documents, meeting minutes, status reports, notes, or existing SharePoint project content.
---

# Decision Register Builder

## Purpose
Build or review a project Decision Register from evidence available in SharePoint. Identify explicit decisions and genuine decision requirements, separate them from discussion/actions, consolidate duplicate references, and prepare structured register entries. Never invent project facts.

## Before Starting
1. Determine the project/content scope from the prompt, selected files, current SharePoint location, or clearly related project content.
2. Treat the current document library or selected files as the starting context, not automatically as the complete project scope.
3. Discover relevant structured SharePoint lists on the current project site before concluding that a project register does not exist.
4. In particular, look for an existing Decision Register implemented as a SharePoint list. Common names include `Decision Register`, `Decision Log`, `Decisions`, `Project Decisions`, and reasonable project-specific equivalents.
5. If a likely Decision Register list exists, inspect its schema and current entries before proposing new decision IDs or concluding that no existing register is available.
6. Prefer current authoritative artifacts.
7. Treat an existing Decision Register as authoritative for existing IDs and current registered state unless newer authoritative evidence supersedes it.
8. Use only content available to the current user.
9. Ask for clarification only when project scope is materially ambiguous. Do not ask merely because the register uses a different but recognizable list name.

## Preferred Sources
Steering/project/architecture board minutes, meeting notes, status reports, charter, solution/architecture documents, risk/issue/action registers, existing Decision Register, change-control records, and other project evidence containing approvals, rejections, deferrals, selections, or unresolved choices. Do not assume every source type exists.

## Decision Status Model
- **Open** — a real decision is required but no final choice is approved.
- **Proposed** — a specific choice is proposed but awaits approval.
- **Decided** — authoritative evidence records an approved/accepted/selected/rejected/finalized choice.
- **Deferred** — authoritative evidence explicitly postpones the decision.
- **Superseded** — a previously decided item was replaced by a newer decision.
- **Unknown** — a decision item exists but its current state cannot be established reliably.

Do not infer `Decided` because an option is preferred, recommended, discussed, planned, or assigned for investigation.

## What Counts as a Decision
A Decided item requires evidence of an actual choice or authoritative disposition. Strong indicators include approved, agreed, decided, selected, accepted, rejected, confirmed, authorized, adopted, or equivalent explicit language.

An Open/Proposed candidate requires a concrete choice, approval, or unresolved question that materially affects the project.

Examples:
- "The Architecture Board must select the production hosting topology." → Open
- "The team recommends Azure hosting, subject to Architecture Board approval." → Proposed
- "The Architecture Board approved Azure hosting for production." → Decided

## What Does Not Count
Do not create a decision entry for ordinary discussion, informational statements, routine actions/tasks, risks/issues by themselves, agenda topics, recommendations needing no approval, assumptions not treated as decisions, or unauthorized opinions.

"The Architecture Board will review the hosting options next Thursday" is not evidence of a Decided item. It may support an existing Open decision.

## Register Fields
Capture when supported:
- Decision ID
- Title
- Status
- Decision / Required Decision
- Decision Owner
- Decision Date
- Required By
- Context
- Rationale
- Alternatives
- Impact
- Related Items
- Evidence
- Confidence

Use `Not stated` when an important output field is unsupported. Never fill gaps with plausible assumptions.

## Step 1: Discover and Establish Existing Register State

### 1.1 Discover structured project lists

Before extracting new decision candidates, inspect the current project site for relevant structured SharePoint lists.

Do not conclude that no Decision Register exists merely because it is absent from the current document library, selected files, or current folder. A project Decision Register is commonly implemented as a SharePoint list rather than as a document.

Search for likely register lists using:

- list title;
- list description, when available;
- recognizable decision-register columns;
- project context.

Common list names include:

- `Decision Register`
- `Decision Log`
- `Decisions`
- `Project Decisions`
- reasonable project-specific equivalents

A differently named list can still be the Decision Register when its schema clearly represents project decisions.

Useful schema indicators include columns equivalent to:

- Decision ID
- Title
- Status
- Decision / Required Decision
- Decision Owner
- Decision Date
- Required By
- Rationale
- Alternatives
- Impact
- Related Items
- Evidence

Do not require every column to exist.

### 1.2 Select the authoritative register

When one likely Decision Register is found:

1. Read its existing entries before proposing new entries.
2. Treat it as the authoritative register for existing Decision IDs and registered state.
3. Preserve existing IDs and never renumber them.
4. Match documentary evidence against existing entries before creating candidates.
5. Detect updates, confirmations, deferrals, superseding decisions, and duplicates.
6. Determine the highest numeric ID only when useful for proposing a future ID.

When multiple plausible decision lists are found:

1. Prefer the list clearly associated with the current project.
2. Prefer the list whose schema and contents best match a project Decision Register.
3. Do not silently combine unrelated decision lists.
4. If two or more lists remain materially ambiguous, state the ambiguity and ask the user which register is authoritative before proposing updates.

### 1.3 Handle inaccessible or missing registers

Distinguish these cases:

- **Register found and readable:** use it.
- **Likely register found but inaccessible:** state that it appears to exist but could not be read with the current user's access. Do not say that no register exists.
- **No likely register found after site-level list discovery:** state that no accessible Decision Register was found on the current project site and use temporary candidate IDs.
- **Structured-list discovery is unavailable in the execution environment:** explicitly state that the existing register could not be verified. Do not claim that no register exists.

Only after site-level structured-list discovery has been attempted may the skill fall back to `NEW-01`, `NEW-02`, etc.

If no accessible register can be established, use temporary candidate IDs `NEW-01`, `NEW-02`, etc. unless the user provides an ID convention.

## Step 2: Extract Decision Evidence
Identify passages indicating a decision was made; approval/rejection occurred; a decision is required; a proposed choice awaits approval; a decision was deferred; a prior decision was replaced; or owner/deadline/rationale/alternatives/impact changed. Keep evidence tied to its source.

## Step 3: Classify Candidates
For every candidate:
1. Verify it is a genuine decision item.
2. Assign the most evidence-supported status.
3. Match it to an existing entry if applicable.
4. Capture only supported fields.
5. Assign confidence:
   - **High** — explicit decision language and clear authority/context.
   - **Medium** — decision intent is clear but a material aspect is ambiguous.
   - **Low** — possible decision, but evidence is insufficient for safe registration.

Never present Low-confidence candidates as confirmed decisions.

## Step 4: Consolidate and Deduplicate
Treat references as the same decision when subject, choice, context, and project impact materially match. Merge evidence, prefer the newest authoritative evidence for current status, preserve useful history, and do not create duplicates merely because wording differs. Do not merge separate decisions merely because they concern the same workstream.

## Step 5: Resolve Conflicting Evidence
1. Prefer the source authoritative for the decision.
2. Prefer newer authoritative evidence over older evidence.
3. Never silently reconcile material contradictions.
4. State material conflicts.
5. Use Unknown if current state cannot be established safely.
6. If newer evidence explicitly replaces an earlier decision, mark the earlier decision Superseded and link entries when possible.

Example: status report says "Azure hosting recommended"; Architecture Board minutes say "decision deferred pending cost comparison" → current status is Deferred.

## Step 6: Relate Decisions
When explicitly supported, connect decisions to actions, risks, issues, milestones, deliverables, dependencies, and other decisions. Never invent relationships.

## Step 7: Review Register Quality
When a register exists, identify material issues such as:
- unresolved decisions past Required By;
- missing owner where ownership is expected;
- decided entries missing an available decision date;
- duplicates;
- conflicting status;
- superseded decisions not updated.

Do not flag optional metadata merely because it is blank.

## Step 8: Produce Review Result

### 1. Decision Register Summary
State:
- Decision Register discovery result, including the SharePoint list name when found;
- existing decisions reviewed;
- new decision candidates;
- existing entries requiring update;
- low-confidence candidates requiring human review.

If no register was used, explain whether no accessible register was found after site-level discovery, a likely register was inaccessible, or structured-list discovery was unavailable.

### 2. New Decision Candidates
For each: Candidate ID, Title, Proposed Status, Decision/Required Decision, Owner, Decision Date or Required By, Impact, Related Items, Evidence, Confidence.

### 3. Existing Entries to Update
For each: Decision ID, current registered value/status, evidence-supported update, reason, evidence, confidence.

### 4. Items Requiring Human Review
Separate ambiguous/conflicting candidates that should not be registered automatically and explain what is unclear.

### 5. Register Quality Findings
Report only material evidence-supported findings. If none, say so.

## Step 9: Prepare Register Entries
When asked, produce structured entries suitable for a SharePoint list. Do not modify a SharePoint Decision Register unless the user explicitly asks, the environment supports it, and the user has permission. Never claim a write succeeded unless it actually did.

## Step 10: Optional Standalone HTML Report
When requested, generate a complete standalone HTML5 webpage from the validated review.

Requirements:
- `<!DOCTYPE html>`, `<html>`, `<head>`, UTF-8 charset, viewport, title, embedded CSS, `<body>`;
- no JavaScript, external CSS/fonts/images/CDNs, or required network access;
- directly browser-openable and print-friendly;
- include project/reporting date, summary, new candidates, updates, human review, quality findings, evidence/coverage, confidence;
- HTML-encode project-derived content;
- do not reinterpret the validated result while formatting.

When file creation is supported, prefer:
`Decision-Register-Review-[Project-Name]-[YYYY-MM-DD].html`

Do not claim a file was saved unless it actually was.

## Evidence Rules
Evidence first. Never fabricate facts. Prefer authoritative sources for the facts they own and newer authoritative evidence when state changes. Preserve traceability. Do not turn recommendations/actions/risks into decisions without explicit decision evidence. Do not infer authority solely from job titles, rationale from outcomes, or alternatives from technical possibilities. Signal uncertainty.

## Date Rules
- Open/Proposed/Deferred with Required By before reporting date → overdue.
- Due on reporting date → due today, not overdue.
- Future → not overdue.
- Calculate lateness from Required By, not Decision Date.
- If reporting date is absent, use the current date available to the environment.

## Validation Checklist
- [ ] Every Decided item has evidence of an actual authoritative choice.
- [ ] Recommendations/discussions were not converted into decisions.
- [ ] Site-level structured SharePoint lists were checked before concluding that no Decision Register exists.
- [ ] The current document library was not treated as the complete project scope when relevant site lists could exist.
- [ ] A likely but inaccessible register was not reported as nonexistent.
- [ ] Existing IDs were preserved.
- [ ] New candidates were deduplicated against existing entries.
- [ ] Current status uses newest authoritative evidence.
- [ ] Material conflicts are disclosed.
- [ ] Superseded decisions are linked when supported.
- [ ] Unknown fields were not invented.
- [ ] Related items are evidence-supported.
- [ ] Due today is not called overdue.
- [ ] Low-confidence candidates are separated for human review.
- [ ] Proposed changes are distinguished from actual SharePoint writes.
- [ ] Requested HTML is standalone and dependency-free.
