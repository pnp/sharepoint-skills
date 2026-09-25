# Resume Screening Summarizer — Demo

Sample content for trying out the Resume Screening Summarizer skill without needing a real hiring library.

## Setup

1. Create (or reuse) a document library on a SharePoint site with Copilot enabled.
2. Upload `sample-files/job-description-frontend-engineer.pdf` — an Amazon-style job description for a **Front End Engineer, Consumer Shopping Experience** role.
3. Upload the four sample resumes from `sample-files/` into the same library (or a subfolder):
   - `Meera_Krishnan_Acc.pdf` — meets every must-have and most nice-to-haves (**Strong match**)
   - `Fatima_Al-Sayed_Acc.pdf` — production Angular experience satisfies the framework requirement, but React is only a non-production side project (**Possible match**)
   - `Marcus_Johnson_Acc.pdf` — 3 years of total tenure, but only 6 months of it in front-end work per the resume text (**Weak match** — tests that the skill scores stated front-end experience, not raw job tenure)
   - `Unreadable_Scan_1_Acc.pdf` — an image-only PDF with no extractable text layer (**Not scored** — tests the "could not read file" path)
4. Ask Copilot: *"Screen these resumes against the Front End Engineer job description."*

## What to expect

- A ranked report with all four candidates in distinct fit tiers, each with a rationale tied to specific resume text — not a generic score.
- The must-have and nice-to-have criteria listed explicitly, so you can audit why each candidate landed where they did.
- `Unreadable_Scan_1_Acc.pdf` reported as **Not scored** rather than silently skipped or guessed at.
- A limitations section calling out anything that required judgment (e.g., degree relevance, ambiguous professional-experience claims).

All names, contact details, and employers in the sample files are fictional.

See [`example-output/`](./example-output/) for a real captured Copilot run against this sample set, including a note on an edge case it surfaced.
