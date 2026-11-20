---
name: document-expiry-renewal-tracker
description: Finds expiry, renewal, and notice-period dates in contracts, certificates, insurance documents, and policies stored in a SharePoint library, then reports what is due in the next 30, 60, and 90 days with the evidence for each date. Saves a self-contained HTML report. Use when the user says: - "what contracts are expiring" - "track document expiry dates" - "which renewals are coming up" - "find expiring certificates" - "check upcoming renewal and notice deadlines"
---

# Document Expiry & Renewal Tracker

## Purpose

Contracts, certificates, insurance policies, and compliance documents usually carry an expiry or renewal date buried in the text, and nobody finds out until it has passed. This skill reads the documents in a SharePoint library, extracts each document's expiry, renewal, and notice-period dates, and produces a self-contained HTML report that shows what is overdue or coming due, along with the evidence for every date. It is strictly read-only: it never edits documents, changes metadata, or sends reminders. The only thing it writes is the final report.

## Trigger Phrases

Activate this skill when the user says any of the following (or close variations):

- "what contracts are expiring" / "which contracts expire soon"
- "track document expiry dates" / "check document expiry"
- "which renewals are coming up" / "upcoming renewals"
- "find expiring certificates" / "which certificates are about to expire"
- "check notice periods" / "when do I need to cancel"
- "renewal and expiry report"

## Inputs & Scope

Determine the scope from the user's request:

- **Library (default)** — the current document library or folder.
- **Named library or folder** — if the user names one, scope to that instead.
- **Document types (default)** — contracts and agreements, certificates, insurance documents, and policies. If the user names other types (licenses, warranties, permits, leases), include those. Skip files that are clearly unrelated and note how many were skipped.
- **Look-ahead window (optional)** — default is 90 days. Use a different window only if the user states one.

If the library holds more than about 200 documents, say in the report which folders were read fully and which were sampled rather than silently truncating results.

## Steps

### Step 1 — Resolve scope and today's date

Confirm the library, folder, document types, and look-ahead window. Establish today's date and use it for every urgency calculation. State the scope and the date used at the top of the report.

### Step 2 — Enumerate candidate documents

List every in-scope document (common formats: .pdf, .docx, .doc, and .xlsx or .pptx only when they clearly hold agreement or certificate content). For each, record file name, link, document type, and last modified date. Read the current version only.

### Step 3 — Extract dates for each document

For each document, look for dates in this order of reliability and record which source each date came from:

1. **Metadata** — an existing column such as Expiry Date, Renewal Date, or Valid Until. Label: *From metadata*.
2. **Stated in text** — explicit statements such as "expires on", "valid until", "term ends", "renewal date", "certificate valid to", or "policy period". Label: *Stated in text*, and record the sentence it came from.
3. **Calculated** — a start or effective date plus a stated term, for example "effective 1 March 2026 for 24 months". Compute the end date and show the calculation. Label: *Calculated*.
4. **Filename** — a date in the file name that clearly indicates expiry. Label: *From filename* (weak evidence).

Also extract, when stated:
- **Auto-renewal** — whether the document renews automatically and for what period.
- **Notice period** — the number of days or months of notice required to cancel or renew.

Compute the **cancel-by date** (renewal or expiry date minus the notice period) whenever both are known. This is often the date that matters most.

If no date can be found, record **No date found** and do not guess. If a document is unreadable (for example an image-only PDF with no text layer), record **Unreadable** rather than guessing at its content.

### Step 4 — Assign confidence and handle conflicts

For each date, assign a confidence level:

| Confidence | Criteria |
|---|---|
| **High** | From metadata, or stated plainly in the text with a single unambiguous date |
| **Medium** | Calculated from a start date and term, or the date is stated but the context is slightly unclear |
| **Low** | From filename only, or inferred from limited wording |

If a document contains several conflicting dates (for example an original term and an amendment), or refers to a later amendment that is not in scope, do not choose one. Mark it **Review needed — multiple dates found** and list the dates and where each appears.

### Step 5 — Assign urgency bands

Using today's date, place each document with a usable date into a band, based on the cancel-by date when one exists and otherwise on the expiry or renewal date:

| Band | Criteria |
|---|---|
| **Overdue** | The date has passed |
| **Due in 30 days** | 0–30 days away |
| **Due in 60 days** | 31–60 days away |
| **Due in 90 days** | 61–90 days away |
| **Later** | Beyond the look-ahead window |

Documents marked No date found, Unreadable, or Review needed are reported in their own sections, not placed in a band.

### Step 6 — Build a self-contained HTML report

Draft a single self-contained HTML file:

- No scripts. No external CSS, fonts, images, or other resources. Inline CSS only.
- A **summary band** with the library, scope, date of report, total documents read, and counts per urgency band, plus counts of No date found, Unreadable, and Review needed.
- A **due soon table**, sorted by earliest date first and covering Overdue through Due in 90 days, with columns for document (linked), type, key date, date type (expiry, renewal, or cancel-by), notice period, auto-renews (yes, no, or not stated), date source, confidence, and a short evidence line (the sentence the date came from, kept short).
- Color-coded bands: red for Overdue, orange for 30 days, amber for 60 days, yellow for 90 days, gray for Later.
- A **needs attention** section listing Review needed, No date found, and Unreadable documents with the reason for each.
- A **method and limitations** section explaining the date sources, the confidence levels, and that dates must be checked against the original document.

### Step 7 — Save the report

Save the HTML file to an **Expiry Reports** folder in the same library, or an appropriate document library on the current site.

- If the folder does not exist, create only that report folder, and only when needed to save the report.
- Use a clear timestamped filename: `Expiry-Renewal-Report-YYYY-MM-DD-HHMM.html`

### Step 8 — Respond to the user

After saving, reply with a compact Markdown summary and the report link:

```
# Expiry and renewal report complete

[Open the report](<link>)

- Documents read: <n>
- Overdue: <n>
- Due in 30 days: <n>
- Due in 60 days: <n>
- Due in 90 days: <n>
- Needs attention (no date, unreadable, or review needed): <n>
```

## Example

**User:** "Which contracts in the Supplier Agreements library are expiring in the next 90 days?"

**Agent response after processing:**

I read 38 documents in the Supplier Agreements library and found dates for 31 of them. The report is organized by urgency.

| Band | Documents |
|---|---|
| Overdue | 1 |
| Due in 30 days | 3 |
| Due in 60 days | 2 |
| Due in 90 days | 4 |
| Needs attention | 7 |

- **Contoso Facilities Services Agreement — Due in 60 days (cancel-by date):** renews automatically on 31 March 2027 for 12 months with 90 days' notice, so the cancel-by date is 31 December 2026. Stated in text, High confidence.
- **Fabrikam Software License — Due in 60 days:** expires 15 January 2027, stated in text, High confidence.
- **Northwind Insurance Certificate — Overdue:** the policy period ended on 30 September 2026, stated in text, High confidence.
- **Needs attention:** 4 with no date found, 2 image-only PDFs that could not be read, and 1 with an original term and a later amendment that conflict.

I saved the report to Expiry Reports/Expiry-Renewal-Report-2026-11-21-1030.html.

## Constraints

- Strictly read-only. Never modify, move, delete, or share any document, never change metadata, and never send reminders or emails. The only write operation is saving the final HTML report, and creating the Expiry Reports folder if needed.
- Never guess a date. If a date is not stated or calculable from stated terms, report No date found.
- Never choose between conflicting dates. Mark the document Review needed and show every date found.
- Show the evidence for every date and its source label. Keep quoted evidence to a short sentence.
- Do not reproduce prices, bank details, personal data, or other sensitive content from the documents. The report needs dates, document names, and short evidence only.
- If a document cannot be read, mark it Unreadable. Do not guess at its content or leave it out of the report.
- Do not give legal advice or interpret contract terms beyond extracting stated dates, notice periods, and renewal terms.
- This report is a tracking aid for human reviewers. Every date must be checked against the original document before anyone acts on it.
- Keep the HTML fully self-contained: no scripts, no external assets, inline CSS only.
