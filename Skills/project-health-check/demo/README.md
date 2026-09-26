# Project Health Check demo

This demo uses a fictitious project named **Project Aurora**. It is designed to exercise the skill's schedule, risk, action, decision/dependency, and governance logic.

## Setup

1. Create a SharePoint project site or use a test site.
2. Create a **Project Documents** library and upload the files from `sample-files/documents/`.
3. Create these SharePoint lists and import/copy the corresponding CSV data from `sample-files/lists/`:
   - Milestone Plan
   - Risk Register
   - Action Register
   - Decision Register
   - Deliverables Register
4. Upload the inner runtime package `project-health-check/` from the parent skill folder to the SharePoint Skills library.
5. Run: `Run the Project Health Check for Project Aurora.`
6. For the standalone webpage, run: `Run the Project Health Check for Project Aurora and create the final HTML report.`

## Expected assessment around 15 September 2026

The intended overall result is **AMBER**. Important evidence includes:

- Integration Testing was due 10 September and is still in progress.
- Its forecast completion is 22 September: 5 days overdue on 15 September and 12 days later than originally planned.
- Production Readiness Review is marked At Risk.
- R-004 is an open High document-conversion risk with mitigation targeted for 18 September.
- A-023 and A-027 are overdue; A-031 is due on 15 September.
- D-014 is overdue and blocks final deployment planning and network configuration.
- The Security Review date is not confirmed, while the Deployment Plan retains placeholders pending D-014.
- The target go-live remains 30 October 2026 and is still considered achievable.

The included HTML file is a tested example of the standalone report generated from this dataset.

## Notes

All people, organizations, project facts, and data in this demo are fictitious and intended only for demonstration.
