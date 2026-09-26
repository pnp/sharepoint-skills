# Demo Setup

## Recommended SharePoint structure

### Document library: Project Documents

Upload all files from `sample-files/documents`.

### Lists

Create these lists and copy/import the corresponding CSV data:

- **Milestone Plan** → `Milestone-Plan.csv`
- **Risk Register** → `Risk-Register.csv`
- **Action Register** → `Action-Register.csv`
- **Decision Register** → `Decision-Register.csv`
- **Deliverables Register** → `Deliverables-Register.csv`

Use Date columns for all date fields and Choice columns for Status, Rating, Priority, and Criticality where practical.

## Why this data is useful

The dataset is deliberately mixed rather than obviously failing. It contains enough positive evidence for the project to remain recoverable, while several signals should cause an AMBER assessment.

On **14 September 2026** the expected observations are:

- M-003 Integration Testing Complete is overdue by four days.
- M-005 Production Readiness Review is explicitly At Risk.
- R-004 is an open High risk with a mitigation due 18 September.
- A-023 and A-027 are overdue.
- D-014 is overdue and blocks final deployment planning.
- DEL-006 Security Review is explicitly required but no Security Review document is included in the sample document library.
- The 30 October go-live remains On Track, so the sample should not automatically become RED.

## Suggested prompts

- `Run the Project Health Check for Project Aurora.`
- `Assess Project Aurora and tell me what needs management attention.`
- `Give me a RAG health assessment of this project.`
- `Is this project still on track? Use the Project Health Check skill.`

## Demo variation

To demonstrate a move from AMBER toward GREEN, update:
- M-003 to Complete,
- A-023 and A-027 to Complete,
- D-014 to Decided,
- R-004 to Medium or Closed,
- and add a `Security Review` document.

To demonstrate RED, change M-006 Production Go-Live to At Risk and add evidence that a critical dependency cannot be resolved before the target date.
