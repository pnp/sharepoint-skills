# Demo — Sync Blocker Auditor

This demo gives you a ready-made **Sync Demo** file set (10 files across 3 folder levels) with a
deliberate mix of sync-safe, legacy-hostile, lock-file, and junk-artifact names, so you can see
the skill separate real technical blockers from names that merely *look* untidy.

## Files

| File | Purpose |
|---|---|
| [`sample-files/`](./sample-files/) | 10 demo files (3 of them intentionally clean) plus a `Projects/2026 Q3/Northwind Traders/` folder chain |

## Step 1 — Upload the demo files

1. In your SharePoint site, create a document library named **Sync Demo**.
2. Open the library in the browser and **drag the whole contents of `sample-files/` into it**,
   including the `Projects` folder. Uploading through the browser matters — the OneDrive sync
   client silently skips some of these files, which is exactly the behaviour this skill exists
   to explain.
3. Do not rename anything on the way in. The names *are* the test data.

> **`~$Proposal Draft.txt` disappeared?** Two things can cause that. Some browsers hide it
> because it starts with `~$` — if your upload lands 9 files instead of 10, upload that one on
> its own via **Upload → Files**. But SharePoint may also **reject it outright**, because `~$`
> names are on Microsoft's disallowed list. That rejection *is the rule working at the front
> door*, and it is why Step 4 gives you two valid expected outcomes.

## Step 2 — (Optional) Add the cases that cannot be shipped in Git

Two rule categories can't travel inside this repository, so add them by hand if you want full
coverage:

| Rule | How to reproduce | Why it isn't shipped |
|---|---|---|
| `I1` junk artifacts | Create an empty file named `Thumbs.db` and upload it | The repo's `.gitignore` excludes `Thumbs.db`, `desktop.ini`, and `.DS_Store` |
| `R4` long check-out | Check out any file (**⋮ → More → Check out**) | Check-out state is server-side, not a file |

Hard blockers `B1`–`B5` (illegal characters such as `:` and `*`, trailing spaces, trailing
periods, reserved names like `CON.docx`, `.lock`, `desktop.ini`) **cannot be created through the
modern SharePoint UI or through Windows** — both reject them. In the real world they arrive
through migrations, third-party tools, and the API, which is precisely why nobody notices them
until sync starts failing.
The report in
[`../assets/Sync-Blocker-Audit-Project-Files-2026-08-20-1130.html`](../assets/Sync-Blocker-Audit-Project-Files-2026-08-20-1130.html)
shows what a migrated library full of those blockers looks like.

## Step 3 — Run the skill

Open the Copilot agent on the site and say any trigger phrase, for example:

> **"Run a sync blocker audit on the Sync Demo library."**

or

> **"Why won't the Sync Demo library sync?"**

The audit is **strictly read-only** — it produces the report and summary without renaming,
moving, or checking in anything. Rename suggestions are proposals for you to approve.

## Step 4 — Verify the results

There are **two correct outcomes**, depending on whether your tenant let `~$Proposal Draft.txt`
through the upload. Check which one you got before comparing numbers.

| | Outcome A — the `~$` file uploaded | Outcome B — SharePoint rejected it |
|---|---|---|
| Items scanned | 13 (10 files + 3 folders) | 12 (9 files + 3 folders) |
| 🔴 Blocker | 1 | 0 |
| 🟠 Risk | 4 | 4 |
| 🔵 Info | 2 | 2 |
| ✅ No findings | 6 | 6 |
| **Sync readiness** | **92%** (12 ÷ 13) | **100%** (12 ÷ 12) |

Outcome B is not a failed demo. It is the honest reality of this skill: hard Blockers do not
survive a modern upload, so a library only contains them if the content arrived through a
migration, the API, or a third-party tool — which is exactly when nobody notices until sync
starts failing.

Expected findings, item by item:

| Item | Severity | Rule | Why | Proposed safe name |
|---|---|---|---|---|
| `~$Proposal Draft.txt` | 🔴 Blocker | `B6` | Orphaned Office lock file — on Microsoft's disallowed-names list | `file-Proposal Draft.txt` |
| `Q3 Budget #final.txt` | 🟠 Risk | `R1` | `#` is fine in SharePoint Online, but breaks hand-built REST/CSOM URLs and migration tools | — (advisory) |
| `Sales 100% Target.txt` | 🟠 Risk | `R1` | `%` reads as URL escaping in legacy and third-party clients | — (advisory) |
| `Marketing R&D Plan {draft}.txt` | 🟠 Risk | `R1` | `&`, `{`, `}` trip up tooling that builds URLs by hand | — (advisory) |
| `Quarterly-Report.tmp` | 🟠 Risk | `R6` | OneDrive **never** syncs TMP files — this one is invisible on every desktop | — (advisory) |
| `Legacy-Notes.bak` | 🔵 Info | `I2` | Backup artifact, shouldn't be in a synced library | — |
| `empty-draft.txt` | 🔵 Info | `I3` | Zero-byte file | — |
| `Contoso Agreement 2026.txt` | ✅ | — | Fully sync-safe | — |
| `Copy of Copy of Untitled Document (3).txt` | ✅ | — | Untidy, but technically sync-safe | — |
| `Projects/2026 Q3/Northwind Traders/Northwind-Traders-Phase-2-…-2026-08-20.txt` | ✅ | — | Longest URL in the library, still under both limits | — |
| `Projects`, `2026 Q3`, `Northwind Traders` | ✅ | — | Sync-safe folders | — |

Sync readiness is **items with no Blocker ÷ total items**. Risk and Info findings do not reduce
the score — they are advisory.

> **The three folders must not appear as findings.** `I1`, `I2`, `I3`, and `R4` are file-only
> rules. Folders report a size of 0 bytes, so an agent applying `I3` to folders would wrongly
> flag all three and report 6 Info findings. If you see that, the rule scoping was ignored.

> Added `Thumbs.db` in Step 2? Outcome A becomes **14 items, 3 Info findings, and 93%**
> readiness (13 ÷ 14); Outcome B becomes 13 items and stays at 100%.

## What to look for

- **`Copy of Copy of Untitled Document (3).txt` is not flagged.** This is the point of the
  skill: it reports what breaks the sync engine, not what looks messy. Untidy names are the job
  of `library-cleanup` and `analyze-document-library`.
- **`Quarterly-Report.tmp` is a Risk, not Info** — OneDrive never syncs TMP files, so it is
  genuinely invisible on every desktop, which is more than cosmetic noise.
- **The path-length table** shows the nested Northwind file as the longest URL, measured against
  the 400-character SharePoint limit and the 260-character Windows limit — well before either
  becomes a problem.
- **Nothing was renamed.** Re-check the library after the run: every name is exactly as you
  uploaded it.
