---
name: resume-screening-summarizer
description: Screens a library of resumes or job applications against a job description's must-have and nice-to-have criteria, then produces a ranked candidate summary. Saves a self-contained HTML report. Use when the user says: - "screen these resumes" - "rank candidates for this role" - "shortlist applicants" - "match resumes to the job description" - "resume screening" - "review applications for this position"
---

# Resume Screening Summarizer

## Purpose

Hiring teams often collect dozens of resumes for an open role in a SharePoint library, then manually re-read each one against the job description. This skill reads the job description and every resume/application in a specified library, extracts each candidate's relevant qualifications, scores them against the job description's must-have and nice-to-have criteria, and produces a ranked, self-contained HTML summary the hiring team can use to build a shortlist. It is strictly read-only: it never contacts candidates, edits resumes, or writes anything back except the final report.

## Trigger Phrases

Activate this skill when the user says any of the following (or close variations):

- "screen these resumes" / "screen resumes for this role"
- "rank candidates for this role" / "rank these applicants"
- "shortlist applicants" / "build a shortlist"
- "match resumes to the job description"
- "resume screening" / "application screening"
- "review applications for this position"
- "which candidates best fit this job description"

## Inputs & Scope

Determine the scope from the user's request:

- **Job description** — the user must point to or paste a job description (a document in the library, a page, or pasted text). If none can be found, ask the user to provide one before proceeding — do not guess at requirements.
- **Resume library (default)** — the current document library or folder, scoped to files that are clearly resumes/applications (common formats: .pdf, .docx, .doc; skip unrelated files).
- **Named library or folder** — if the user names a specific library or folder, resolve and scope to that instead.

If the resume library contains only a handful of files or an unusually large number (50+), note that in the report rather than silently truncating results.

## Steps

### Step 1 — Resolve the job description

Locate and read the job description. Extract:
- Job title
- Must-have requirements (skills, years of experience, certifications, education, location/work authorization if stated)
- Nice-to-have / preferred qualifications
- Any explicit disqualifiers stated in the posting (e.g., "must be willing to relocate")

If the job description is ambiguous or missing key criteria (e.g., no experience threshold), note the gap and proceed using only what is explicitly stated. Do not invent requirements that are not in the document.

### Step 2 — Enumerate candidate documents

List every resume/application file in scope. For each, record the file name, candidate name (as it appears on the resume), and file link.

Skip files that are clearly not resumes (cover letters alone, unrelated documents) but note any skipped file and why.

### Step 3 — Extract each candidate's qualifications

For each resume, extract:
- Total years of relevant experience (as best determinable from listed roles and dates). When a must-have specifies experience in a particular type of work (e.g., "front-end experience," "management experience"), count only the duration the resume itself attributes to that specific type of work — not the candidate's total tenure at a company or in an unrelated role. If a resume states a role recently transitioned into the relevant work (e.g., "6 months in front-end after moving from backend"), use that stated duration, not the role's overall length.
- Skills and technologies mentioned
- Education and certifications
- Notable prior roles/titles relevant to this job
- Any explicit statements relevant to stated disqualifiers (e.g., relocation willingness) if present in the resume

If a resume is unreadable, corrupted, or in an unsupported format, record it as **Not scored — could not read file** rather than guessing at its content.

### Step 4 — Score against the job description

For each candidate, evaluate against the must-have and nice-to-have lists from Step 1:

- **Must-have match** — count and list which must-haves are clearly met, partially met, or not evidenced in the resume
- **Nice-to-have match** — same, for preferred qualifications
- Assign an overall fit tier:

| Tier | Criteria |
|---|---|
| **Strong match** | Meets all or nearly all must-haves, with several nice-to-haves |
| **Possible match** | Meets most must-haves, with clear gaps in one or two areas |
| **Weak match** | Meets fewer than half of the must-haves |
| **Not scored** | Resume could not be read or parsed |

Base every judgment strictly on what is written in the resume. Do not infer qualifications the document does not state, and do not factor in name, gender, age, photos, or any other characteristic unrelated to stated qualifications and experience. Do not round a candidate up to a must-have they only partially satisfy — a must-have requiring "3+ years of X experience" is not met by a candidate whose resume states fewer than 3 years of X specifically, even if their overall career is longer.

### Step 5 — Rank candidates

Order candidates by fit tier (Strong → Possible → Weak → Not scored), and within each tier by number of must-haves met. Note ties explicitly rather than arbitrarily breaking them.

### Step 6 — Build a self-contained HTML report

Draft a single self-contained HTML file:

- No scripts. No external CSS, fonts, images, or other resources. Inline CSS only.
- Include a **summary band** with: job title, total candidates screened, count per fit tier, and date of screening.
- Include a **ranked candidate table** with one row per candidate:
  - Candidate name
  - Fit tier (color-coded: green for Strong, amber for Possible, gray for Weak, red for Not scored)
  - Must-haves met (e.g., "4 of 5")
  - Nice-to-haves met
  - One-line rationale summarizing why they landed in that tier
  - Link to the original resume file
- Include a **job description criteria section** listing the must-haves and nice-to-haves used for scoring, so reviewers can audit the basis for every score.
- Include a **limitations section** covering any unreadable files, ambiguous job description criteria, or partial data.

### Step 7 — Save the report

Save the HTML file to a **Resume Screening Reports** folder in the same library (or an appropriate document library on the current site).

- If the folder does not exist, create only that report folder, and only when needed to save the report.
- Use a clear timestamped filename: `Resume-Screening-Report-<JobTitle>-YYYY-MM-DD-HHMM.html`

### Step 8 — Respond to the user

After saving, reply with a compact Markdown summary and the report link:

```
# Resume screening complete

[Open the report](<link>)

- Job: <job title>
- Candidates screened: <n>
- Strong match: <n>
- Possible match: <n>
- Weak match: <n>
- Not scored: <n>
```

## Example

**User:** "Screen these resumes against the Front End Engineer job description."

**Agent response after processing:**

I screened 4 resumes against the Front End Engineer, Consumer Shopping Experience job description and ranked them by fit.

| Metric | Result |
|---|---|
| Total candidates | 4 |
| Strong match | 1 |
| Possible match | 1 |
| Weak match | 1 |
| Not scored | 1 |

- **Meera Krishnan — Strong match** (6 of 6 must-haves, 6 of 7 nice-to-haves): explicit data structures/algorithms application, React/Redux/TypeScript, Jest/Cypress, CI/CD on AWS, and mentoring experience.
- **Fatima Al-Sayed — Possible match** (5 of 6 must-haves): production Angular and TypeScript satisfy the framework requirement, but her own resume states React is only a recent, non-production side project.
- **Marcus Johnson — Weak match** (2 of 6 must-haves): 3 years of total tenure, but the resume states only 6 months of it was front-end work after a recent transition from a backend role.
- **One resume — Not scored**: an image-only PDF with no extractable text layer; flagged in the limitations section rather than guessed at.

I saved the report to Resume Screening Reports/Resume-Screening-Report-Front-End-Engineer-2026-09-25-1230.html.

## Constraints

- Strictly read-only. Never contact candidates, modify resumes, delete files, or change any site content. The only write operation is saving the final HTML report (and, if needed, creating the Resume Screening Reports folder that holds it).
- Never invent qualifications, experience, or disqualifiers not explicitly stated in the resume or job description.
- Never factor name, gender, age, photo, address, or any characteristic unrelated to stated qualifications and experience into scoring or ranking. If a resume contains such information, ignore it for scoring purposes.
- If the job description is missing or cannot be resolved, stop and ask the user for it rather than guessing at criteria.
- If a resume cannot be read or parsed, mark it **Not scored** — do not guess at its content or omit it from the report.
- Keep the HTML fully self-contained: no scripts, no external assets, inline CSS only.
- This skill produces a screening aid for human reviewers, not a hiring decision. Do not state or imply that any candidate should or should not be hired.
