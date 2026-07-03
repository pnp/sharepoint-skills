# Demo — Metadata Completeness Auditor

This demo gives you a ready-made **Contracts** dataset (30 rows) with a deliberate mix of good,
partial, empty, and *placeholder* metadata so you can see the skill flag real gaps end to end.

## Files

| File | Purpose |
|---|---|
| [`sample-files/contracts.csv`](./sample-files/contracts.csv) | 30 contract rows with intentionally uneven metadata quality |

Columns: `Title`, `Owner`, `Contract Type`, `Effective Date`, `Review Date`, `Department`.
The data includes empty cells and placeholder values (`TBD`, `N/A`, `-`, `pending`,
`Choose an option`) that the skill treats as **missing**, not filled.

## Step 1 — Create the list from the CSV

1. In your SharePoint site, click **+ New → List → From CSV**.
2. Upload `contracts.csv`.
3. Confirm the column types when prompted:
   - `Title`, `Owner`, `Contract Type`, `Department` → **Single line of text**
   - `Effective Date`, `Review Date` → **Date and time** (or leave as text — the skill reads both)
4. Name the list **Contracts** and finish.

> Tip: keep `Owner` as text for the demo so the import is clean. In production it can be a
> Person column — the skill handles empty person fields too.

## Step 2 — Run the skill

Open the Copilot agent on the site and say any trigger phrase, for example:

> **"Run a metadata audit on the Contracts list."**

or, to be explicit about which columns count:

> **"Metadata completeness check on Contracts — audit Owner, Contract Type, Effective Date, Review Date, Department."**

The audit is **strictly read-only** — it produces the dashboard and summary without touching
your list or items. No columns are created and nothing is written back.

## Step 3 — Verify the results

With those 5 columns audited, you should get an **overall completeness of ~71%**, with this
per-column fill rate:

| Column | Fill rate |
|---|---|
| Contract Type | 83% |
| Effective Date | 80% |
| Owner | 70% |
| Department | 70% |
| **Review Date** | **53%** (worst column) |

> **Seeing ~76% and 0 Empty instead?** That happens when the agent also audits the `Title`
> column, which is always populated — it inflates completeness and reclassifies the two blank
> rows as Partial. The skill excludes `Title`/`Name` by default; if you see this, just say
> *"exclude Title, audit only Owner, Contract Type, Effective Date, Review Date, Department."*

Expected verdicts (10 Complete · 18 Partial · 2 Empty) — these appear in the HTML dashboard's
item table, with the missing fields listed per row:

| Title | Health | Missing fields (placeholders shown in parentheses) |
|---|---|---|
| MSA-Acme-2025 | ✅ Complete | — |
| MSA-Litware-2026 | ✅ Complete | — |
| Lease-Wingtip | ✅ Complete | — |
| MSA-Coho | ✅ Complete | — |
| Retainer-Alpine-Ski | ✅ Complete | — |
| MSA-Fourth-Coffee | ✅ Complete | — |
| Lease-Contoso-Pharma | ✅ Complete | — |
| Retainer-Woodgrove-Bank | ✅ Complete | — |
| Purchase-Wide-World | ✅ Complete | — |
| MSA-Blue-Yonder-Air | ✅ Complete | — |
| NDA-Contoso | ⚠️ Partial | Review Date, Department |
| SOW-Northwind-Q3 | ⚠️ Partial | Review Date |
| Amendment-2-Tailspin | ⚠️ Partial | Review Date (TBD), Department |
| License-Adventure-Works | ⚠️ Partial | Owner (N/A) |
| Services-Proseware | ⚠️ Partial | Review Date, Department (Choose an option) |
| NDA-Woodgrove | ⚠️ Partial | Effective Date |
| Purchase-Agreement-Graphic-Design | ⚠️ Partial | Owner, Review Date (-) |
| Amendment-1-Trey | ⚠️ Partial | Contract Type, Department |
| Consulting-Blue-Yonder | ⚠️ Partial | Owner (TBD), Review Date (pending) |
| NDA-Southridge | ⚠️ Partial | Owner |
| SOW-Margie-Travel | ⚠️ Partial | Effective Date, Review Date |
| Amendment-3-Humongous | ⚠️ Partial | Review Date (TBD), Department |
| License-Fabrikam-Cloud | ⚠️ Partial | Effective Date |
| Services-Tailspin-Toys | ⚠️ Partial | Owner, Review Date, Department (N/A) |
| Consulting-Coho-Vineyard | ⚠️ Partial | Review Date (-), Department |
| NDA-Alpine-House | ⚠️ Partial | Owner (pending), Review Date |
| Amendment-4-Trey | ⚠️ Partial | Contract Type |
| Renewal-Fabrikam | ⚠️ Partial | Owner, Contract Type, Effective Date, Review Date |
| Draft-Untitled-copy | ❌ Empty | Owner, Contract Type, Effective Date, Review Date, Department |
| Draft-New-Vendor | ❌ Empty | Owner, Contract Type, Effective Date, Review Date, Department (Choose an option) |

Each row's **Health** and **Missing fields** in the saved HTML dashboard should match the table
above. The report is saved to a `Metadata Reports` folder on the site.

## What to look for

- **Placeholders are caught** — `TBD`, `N/A`, `-`, `pending`, and `Choose an option` are all
  reported as missing, not as filled values.
- **Review Date** surfaces as the worst column and top remediation item.
- **Draft-Untitled-copy** and **Draft-New-Vendor** are the two fully **Empty** items — the kind
  of rows you'd want to fix or remove before archiving.
