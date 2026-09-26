# Demo Content — KB AI Review Lite

This folder contains sample KB documents you can use to try the **kb-ai-review-lite**
skill end-to-end without needing your own content.

> **Do not upload this folder to SharePoint.** Only the inner package folder
> (`kb-ai-review-lite/kb-ai-review-lite/`) belongs in your Agent Assets library.
> This demo content lives in the repo only.

---

## What's included

| File | Category | Description |
|---|---|---|
| `KB001 - BlueStar Airlines - Reporting a Phishing or Suspicious Email.docx` | Security | End-user phishing reporting procedure including Outlook Report Message button steps and fallback email contacts |
| `KB002 - BlueStar Airlines - Multi-Factor Authentication (MFA) Setup and Troubleshooting.docx` | Security | MFA enrollment walkthrough covering FIDO2, authenticator app, and travel bypass scenarios |
| `KB003 - BlueStar Airlines - Cisco Meraki MR45-MR46 Access Point Status LED Guide.docx` | Infrastructure | LED status reference and escalation steps for Meraki wireless access points |
| `KB004 - BlueStar Airlines - APC Smart-UPS 3000 LCD and Battery Status Guide.docx` | Infrastructure | UPS LCD panel interpretation and battery replacement procedure |
| `KB005 - BlueStar Airlines - Sabre CrewTrac Login Failures and Session Errors.docx` | Applications | Troubleshooting guide for crew scheduling application login and session timeout issues |
| `KB006 - BlueStar Airlines - Submitting and Tracking IT Support Requests (Self-Service Portal).docx` | General | Step-by-step guide for using the IT self-service portal including ticket submission and status tracking |
| `KB007 - BlueStar Airlines - IT Equipment Request for New Hires and Transfers.docx` | General | IT equipment provisioning procedure for new hire and internal transfer scenarios |

The set is intentionally varied across all five KB categories the skill supports
(Security, Infrastructure, Applications, General) so you can see the full range of
review behavior in a single run.

---

## Setup steps

### 1. Create a document library

Create a new SharePoint document library on a site where AI in SharePoint is enabled.
Name it anything you like — for example **KB Test** or **KB Ready**.

### 2. Upload the sample files

Upload all `.docx` files from the `sample-files/` subfolder into the root of the library.
Do not create subfolders.

### 3. Run the skill — first run (column setup)

Select all files and ask Copilot:

> *"run kb-ai-review-lite on the selected KBs"*

On first run the skill will create all 9 required review columns and then stop with
a setup notice. **This is expected.** No files will be modified.

### 4. Enable unlimited length on two columns

Follow the instructions in the setup notice exactly:

1. Go to **Library Settings** → **Columns**
2. Click **AI Review Summary**
   - Find **Allow unlimited length in document libraries**
   - Select **Yes** → **Save**
3. Click **AI Draft Payload**
   - Find **Allow unlimited length in document libraries**
   - Select **Yes** → **Save**

### 5. Run the skill — second run (full review)

Return to the library, select all files, and ask Copilot again:

> *"run kb-ai-review-lite on the selected KBs"*

The skill will proceed directly to the review. All 7 files will be processed and
metadata written back. The run report is returned as a Markdown table in chat.

---

## What to expect after a successful run

- **AI Review State** column shows green **Review Complete** pills for all files
- **Review Score** column shows a color-coded percentage bar per file
- **AI Review Summary** column contains a structured verdict with finding counts
- **AI Draft Payload** column contains a full Markdown review with findings table,
  verification evidence, proposed updates, and risks
- **KB Category** is inferred per file (Security, Infrastructure, Applications, General)
- **Next Review Date** is set based on category cadence
- **Completed On** and **Reviewed By** are populated for each file

---

## Troubleshooting

**The skill stops with a setup notice on the second run**
You navigated away from the chat session before running again. This resets the session,
which is normal. Simply run the skill again — if the unlimited length setting was saved
correctly on both columns, the skill will proceed straight to the review.

**A file shows `Not Run` with a quality gate failure reason**
The skill enforces minimum evidence standards. Re-run the skill on that file alone.
If the failure persists, check that the document contains concrete factual claims
(URLs, version numbers, ports, timeouts, or procedural steps) for the AI to validate.

**Columns are missing after the first run**
The first run was cancelled before column creation completed. Run the skill again —
it will create only the missing columns and stop with the setup notice.
