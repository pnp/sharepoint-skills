# Invoice to Purchase Order Reconciliation

Reconciles one or more user-selected invoice files against their matching purchase orders in the Purchase Order library. Reads invoice and PO totals from metadata or file content, compares them, writes reconciliation status back to invoice metadata, and returns a formatted summary table — no Power Automate, no custom code.

![preview](./assets/preview.png)

## What you get

- Automatic match between each selected invoice and its PO record in the Purchase Order library, by PO Number
- A **Compliant** / **Non Compliant** verdict per invoice based on Invoice Total vs PO Total
- Remaining-budget or overage amount calculated and surfaced in plain English
- `Reconciliation Status` and `Reconciliation Details` columns written back on the invoice item
- A single Markdown summary table covering every reconciled invoice in the run
- Graceful fallbacks when metadata columns are missing — the skill reads the file content instead

## When to use

Ask Copilot any of the following (or close variations):

- *"reconcile invoice"*
- *"invoice to po reconciliation"*
- *"po reconciliation"*
- *"match invoice to po"*
- *"check invoice against po"*
- *"invoice po match"*
- *"compare invoice to po"*

Have the invoice file (or files) selected in the document library before triggering — the skill needs a selection to know what to reconcile.

## Prerequisites

- A SharePoint document library containing invoice files.
- A separate **Purchase Order** library (or one named `Purchase Orders` / `PO`) containing the matching PO records.
- Recommended columns on the invoice library: `Invoice Number`, `Invoice Total`, `PO Number`. The skill will read content from the file if these are empty.
- Recommended columns on the PO library: `PO Number`, `PO Total`. Same content-fallback applies.

## SharePoint Skill

| Solution | Author(s) |
| --- | --- |
| invoice-po-reconciliation | Arbindo Chattopadhyay &#124; [GitHub](https://github.com/Arbindoc) &#124; [LinkedIn](https://www.linkedin.com/in/arbindoc/) |

## Version history

| Version | Date | Comments |
| --- | --- | --- |
| 1.0 | May 2026 | Initial Release |

## Demo videos

The first demo shows the skill in action:

[Invoice to PO Reconciliation with Skills in SharePoint — Watch on YouTube](https://youtu.be/bevHxmaFys4)

The second demo walks through how the skill was created:

[Creating a Skill in SharePoint for Invoice to PO Reconciliation — Watch on YouTube](https://youtu.be/AA0fdsnFl_g)

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

<img src="https://m365-visitor-stats.azurewebsites.net/sharepoint-skills/skills/invoice-po-reconciliation" />
