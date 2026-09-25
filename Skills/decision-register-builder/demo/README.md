# Decision Register Builder — Demo Setup

This demo creates a small SharePoint project workspace for testing the `decision-register-builder` skill end to end.

The data is synthetic and represents the fictitious **Project Aurora**.

## 1. What you need

Use a SharePoint test site on which you can:

- upload project documents;
- create and populate SharePoint lists;
- upload/install a SharePoint Skill;
- use Copilot in SharePoint Skills.

The demo uses:

- one document library for project evidence;
- one Decision Register list named `Prj_Decision`;
- one Action Register list named `Prj_Action`;
- the `decision-register-builder` skill.

The skill intentionally starts from project documents but must discover the structured lists on the same project site.

## 2. Create the project document library

You can use an existing document library such as **Documents**, or create a library named:

`Project Documents`

Upload these files from `sample-files/documents/`:

1. `01_Project_Charter.md`
2. `02_Architecture_Workshop_2026-08-25.md`
3. `03_Steering_Committee_Minutes_2026-09-03.md`
4. `04_Architecture_Board_Minutes_2026-09-10.md`
5. `05_Weekly_Status_Report_2026-09-11.md`
6. `06_Operations_Workshop_2026-09-14.md`

For the first test, **do not upload**:

`07_Architecture_Board_Followup_2026-09-18.md`

That document belongs to the second test because its evidence is dated after the first reporting cut-off.

## 3. Create the Decision Register

Create a normal SharePoint list named exactly:

`Prj_Decision`

Create the following columns. The internal names do not have to match the display names exactly; the skill is expected to recognize the register from its title, schema, and project context.

| Column | Suggested SharePoint type | Notes |
| --- | --- | --- |
| Title | Single line of text | Built-in Title column |
| DecisionID | Single line of text | Project decision identifier |
| Status | Choice | `Open`, `Proposed`, `Decided`, `Deferred`, `Superseded`, `Unknown` |
| Decision | Multiple lines of text | Decision or required decision |
| DecisionOwner | Single line of text | Text is sufficient for the demo |
| DecisionDate | Date and Time | Date only |
| RequiredBy | Date and Time | Date only |
| Rationale | Multiple lines of text | |
| Alternatives | Multiple lines of text | |
| Impact | Multiple lines of text | |
| RelatedItems | Single line of text | Related IDs separated with semicolons |
| Evidence | Multiple lines of text | Source reference |

Populate the list with the three rows in:

`sample-files/lists/Decision_Register.csv`

### Expected initial Decision Register

Before running the skill, `Prj_Decision` must contain:

- **D-009** — Use phased migration approach — `Decided`
- **D-012** — Business acceptance approach — `Decided`
- **D-014** — Production hosting topology — `Open`

D-014 must have:

- Owner: Architecture Board
- Required By: 8 September 2026
- alternatives including managed hosting and Azure App Service
- related items including A-027
- evidence referring to the 25 August Architecture Workshop

This existing D-014 entry is essential to the discovery/deduplication test. The skill must update it rather than create a duplicate.

## 4. Create the Action Register

Create another normal SharePoint list named:

`Prj_Action`

Create these columns:

| Column | Suggested SharePoint type |
| --- | --- |
| Title | Single line of text |
| ActionID | Single line of text |
| Owner | Single line of text |
| DueDate | Date and Time, date only |
| Status | Choice or single line of text |
| Priority | Choice or single line of text |
| RelatedItem | Single line of text |

Populate it with:

`sample-files/lists/Action_Register.csv`

The demo row is:

- **A-027** — Prepare final hosting-cost comparison
- Owner: Nina Schubert
- Due: 11 September 2026
- Status: Open
- Priority: High
- Related item: D-014

This provides supporting evidence for the overdue hosting decision.

## 5. Install the skill

The upload-ready skill is the inner folder:

`decision-register-builder/`

It contains:

`SKILL.md`

Upload/install that folder using the SharePoint Skills experience for the test site.

Do not upload the outer contribution folder as the runtime skill package. The outer folder contains README, assets, and demo material for the PnP repository.

## 6. Verify the initial state

Before running Test 1, confirm:

- documents 01–06 are available on the project site;
- document 07 is not yet part of the evidence set;
- `Prj_Decision` exists and contains exactly the three initial demo decisions;
- D-014 is `Open`;
- `Prj_Action` contains A-027;
- the skill is available to Copilot in SharePoint;
- the user running the test can read the document library and both lists.

If the skill is allowed to write to the register in your environment, also make sure the test user has permission to edit `Prj_Decision`.

## 7. Test 1 — 15 September 2026

Start from the Project Documents context and use:

`Review the Project Aurora content and build/update the Decision Register. Use 15 September 2026 as the reporting date. Create the final standalone HTML report.`

### Expected discovery behavior

The skill must:

1. treat Project Documents as the starting context rather than the entire project scope;
2. discover the structured SharePoint list `Prj_Decision`;
3. identify it as the authoritative Decision Register;
4. read the three existing entries;
5. discover/use related structured project evidence such as `Prj_Action`;
6. match the hosting evidence to existing **D-014**;
7. not create a `NEW-*` duplicate for the hosting decision.

### Expected decision behavior

At the 15 September cut-off:

- **D-014** changes from `Open` to **Deferred** based on the 10 September Architecture Board minutes.
- D-014 is **7 days overdue** because Required By was 8 September.
- Azure App Service is preferred/recommended but is **not Decided**.
- Retaining the 30 October go-live is a new **Decided** entry.
- The hypercare extension is **Proposed**, not Decided.
- Using the existing Service Desk queue for go-live incident intake is a new **Decided** entry.
- The monitoring-dashboard discussion is not a decision.
- Document-conversion retry/monitoring/load-test work is risk mitigation and is not a hosting decision.
- The 18 September hosting approval must not influence this report because it is outside the reporting cut-off.

With the supplied demo data, the tested implementation produced:

- 3 existing decisions reviewed;
- 1 existing decision updated;
- 3 new entries created;
- 0 low-confidence items.

The exact SharePoint-created IDs for new list items may differ from temporary/candidate identifiers and are not part of the acceptance criteria.

## 8. Verify the register after Test 1

If the skill performed actual list updates, verify `Prj_Decision`:

- D-009 remains Decided.
- D-012 remains Decided.
- D-014 is now Deferred.
- D-014 was not duplicated.
- New decision entries exist for the go-live date, hypercare proposal, and Service Desk queue.
- No entry was created merely for the monitoring-dashboard discussion.
- No entry was created merely for document-conversion risk mitigation.

If your environment only prepares proposed changes rather than writing them, verify the same behavior in the proposed update set.

## 9. Verify the HTML report

When HTML generation is requested, verify that the result:

- is a complete standalone HTML5 page;
- can be opened directly in a browser;
- contains the reporting date 15 September 2026;
- names `Prj_Decision` as the authoritative register;
- reports the D-014 update to Deferred;
- reports D-014 as overdue by 7 days;
- reports the new entries and retained existing decisions;
- states that 18 September evidence is outside the reporting period;
- contains no external JavaScript/CSS/font dependency.

A tested example is included at:

`sample-files/Decision-Register-Review-Project-Aurora-2026-09-15.html`

## 10. Reset before Test 2

For the cleanest second test, restore `Prj_Decision` to the initial three rows from `Decision_Register.csv`, or use a fresh copy of the demo site.

This avoids mixing the Test 1 write results with the intended Test 2 evidence progression.

## 11. Test 2 — 18 September 2026

Upload:

`07_Architecture_Board_Followup_2026-09-18.md`

Run:

`Review the Project Aurora content and build/update the Decision Register. Use 18 September 2026 as the reporting date.`

Expected behavior for the hosting decision:

- existing **D-014** is matched again;
- status becomes **Decided**;
- Decision: Azure App Service with private connectivity;
- Decision Date: 18 September 2026;
- the managed hosting alternative is recorded as rejected when the list schema supports it;
- the stated rationale is captured;
- the earlier Deferred state is historical evidence, not a separate decision;
- no duplicate hosting decision is created.

## 12. Troubleshooting

### The skill creates NEW-xx for hosting instead of updating D-014

Check that:

- `Prj_Decision` is on the same project site;
- the test user can read it;
- D-014 is present;
- the skill is running the v2 structured-list-discovery logic;
- the Decision Register columns contain enough recognizable project-decision data.

### The skill says no Decision Register exists

A selected document library is not the complete project scope. Verify list permissions and that `Prj_Decision` is visible to the current user.

### Azure hosting is marked Decided in Test 1

Verify that document 07 was not uploaded for Test 1. The newest authoritative in-scope architecture evidence on 15 September is the 10 September deferral.

### Hypercare is marked Decided

The 14 September Operations Workshop only proposes the three-week extension and requests staffing/cost impact before approval. It must remain Proposed.

## 13. Demo acceptance checklist

- [ ] Project documents 01–06 uploaded for Test 1.
- [ ] `Prj_Decision` created with all required demo columns.
- [ ] Three initial decision rows imported.
- [ ] D-014 starts Open.
- [ ] `Prj_Action` created and A-027 imported.
- [ ] Skill installed from the inner `decision-register-builder` folder.
- [ ] Test user can read documents and lists.
- [ ] Skill discovers `Prj_Decision`.
- [ ] D-014 is updated rather than duplicated.
- [ ] D-014 becomes Deferred on 15 September.
- [ ] D-014 is reported 7 days overdue.
- [ ] Three evidence-supported new entries are produced.
- [ ] Non-decision discussion/mitigation is excluded.
- [ ] 18 September evidence is excluded from Test 1.
- [ ] Standalone HTML report opens correctly.
- [ ] Test 2 changes D-014 to Decided after document 07 is introduced.

All people, organizations, project facts, and data in this demo are fictitious.
