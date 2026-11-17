---
name: annual-processes-year-wheel
description: |-
  Build an animated D3.js year-wheel dashboard (HTML) that reads a SharePoint list of annual processes live, using the canonical template in references/. Works on the user's existing annual-processes list, or sets up a new "Annual Processes" list seeded with fictional, industry-neutral sample data when the user has no list or asks for a demo.

  Use when the user says:
    - "create an annual processes dashboard"
    - "build a year wheel" / "årshjul" / "annual cycle wheel"
    - "set up the annual processes list and dashboard"
    - "make a D3 year wheel for this list"
    - "show our yearly processes on a wheel"
---

# Annual Processes Year Wheel

## When to use
Use this skill when the user wants a yearly rhythm of recurring processes (who runs what, in which months) shown as an interactive year wheel. It covers two scenarios:

- **Own-data mode (preferred):** the user points to, or the site already has, a list of annual processes. Skip seeding, map their columns to the template's fields, then build the dashboard from their rows.
- **Demo mode (fallback):** create a new list, seed it with the 30 fictional sample rows, then build the dashboard. Use this only when the user has no list yet or explicitly asks for a demo or sample.

Always use the user's own processes, departments, owners and titles when they provide them. The Northwind Outfitters sample rows are fallback seed data only. Never mix sample rows, sample department names or the sample company name into a dashboard built on the user's own data.

Do not use this skill for project roadmaps by quarter, Gantt charts, contract renewals or event calendars with exact dates. Those need a different layout.

## Reference files
Load both before building anything:

| File | What it is | How to use it |
|---|---|---|
| `references/annual-processes-wheel-template.html` | **Canonical template.** A working, self-contained sample of the finished dashboard with the same 30 rows embedded. | Copy TEMPLATE PART 1 (CSS) and TEMPLATE PART 3 (helpers + `render(results)`) verbatim. Never copy the parts marked SAMPLE ONLY or OFFLINE FALLBACK ONLY into a live page. |
| `references/sample-data.md` | The 30 sample rows (fictional company "Northwind Outfitters"). | Use exactly these values to seed the list in demo mode only. Do not use them in own-data mode. |

The template is the source of truth for layout, colors, animation and interaction. Do not redesign the dashboard, rename sections, add effects or change the visual language unless the user explicitly asks.

## Inputs
- List name. Default: `Annual Processes`. If a list with that name already exists, ask whether to reuse it or create `Annual Processes 2`.
- Mode: own data (the user names or links a list, or the site already has one) or demo (no list yet, or the user asks for a sample).
- Optional: dashboard title, company name for the eyebrow text, save location. Default save location: the site's `Documents` library.

## Steps

### 1. Set up the list (demo mode)
1. Check whether the list already exists on this site. Never overwrite or delete an existing list.
2. Create the list with these columns, in this order:

| Column | Type | Settings |
|---|---|---|
| Title | Single line of text | (default column) holds the process name |
| Department | Choice | Sales; Product; Customer Support; Operations; Facilities; Human Resources; Accounting |
| Quarter | Choice | Quarter 1; Quarter 2; Quarter 3; Quarter 4 |
| Start Month | Number | 1–12, no decimals |
| End Month | Number | 1–12, no decimals; may be lower than Start Month when the process crosses the year end |
| Number of Months | Number | no decimals |
| Process Owner | Single line of text | a job title, never a person's name |
| About | Multiple lines of text | plain text |
| Comments | Multiple lines of text | plain text |
| More information | Hyperlink | optional |

3. Set the default view to show Title, Department, Quarter, Start Month, End Month, Number of Months and Process Owner, sorted by Start Month.
4. Add all 30 rows from `references/sample-data.md` exactly as written. Leave Comments empty where the table is empty, and leave More information empty.
5. Read the list back and confirm that it has 30 items and that Start Month and End Month are filled on every row. If any row failed, retry that row once; if it still fails, report it and continue.

### 1b. Map an existing list (own-data mode)
1. Read the list schema and the first 50 items.
2. Map the list's columns to the template fields: Title, Department, Quarter, Start Month, End Month, Number of Months, Process Owner, About, Comments, More information. Use the internal column names in the page.
3. Minimum required: Title and Start Month (a number 1–12). If Start Month is missing but a multi-choice Month column exists, the first ticked month may be used as the start and the count of ticked months as the length. Tell the user which mapping you used.
4. Report data gaps before building: rows without Start Month, rows without Department (they go to an "Unassigned" ring), and rows where Number of Months disagrees with Start/End Month. Do not change the user's data unless asked.

### 2. Build the dashboard
1. Create a new HTML page that reads the list **live** through SharePoint's live-data support (list rows arrive as `results[0] = {headers, rows}`), and loads D3 v7 through the page's library manifest.
2. Paste TEMPLATE PART 1 (the full `<style>` block) and TEMPLATE PART 3 (helper functions and the full `render(results)` function) from the template **verbatim**. Call `render(results)` with the live results.
3. Allowed changes only:
   - the eyebrow line (replace `SAMPLE DATA · NORTHWIND OUTFITTERS (FICTIONAL COMPANY)` with the user's title, or `ANNUAL PROCESSES` if none);
   - column names in the `col(...)` lookups if the list's internal names differ;
   - the Department choice list, if the user's departments differ (colors are assigned automatically).
4. Do not include the sample banner, the embedded sample data, the offline D3 modules or the offline selection layer.
5. Save the page as `<List name> Year Wheel.html` in the chosen library.

### 3. Verify
Open or reread the saved page and check:
- It names the correct list and site in its live-data settings.
- `render(results)` is present and unchanged apart from the allowed edits.
- No `<script>` contains the sample rows, and the sample banner text is absent.
- In own-data mode, the text "Northwind" and the sample department names that the user's list does not use appear nowhere in the page.
- The page shows: the "How to read the wheel" key, filters (search, quarter, department), three KPI cards (Active now, Starting in the next 30 days, Busiest month), Next up, the wheel with one ring per department, the red today line, the department legend, the Manager workload bar chart and the side panel.

## What the finished dashboard does (for your summary to the user)
- One ring per department; each process is one arc from start month to end month; processes that don't overlap share a lane, so the wheel stays readable.
- A red dashed line marks today; a small dot marks processes starting within 30 days.
- Clicking a month (or a workload bar) filters to that month with a banner and a Clear button.
- Hover shows a tooltip; click opens details (owner, About, Comments, link) in the side panel.
- Drag to rotate; "Back to today" turns the wheel back.
- Animations respect the reduced-motion setting.

## Guardrails
- Sample data must stay fictional and industry-neutral. Do not add real employee names, real company names or internal department names to the sample.
- Never delete or overwrite an existing list, page or file. Use a new name instead and say so.
- If the list can't be created or the page can't be saved, stop and report the exact step that failed.
- Do not invent columns or values in own-data mode; report gaps instead.

## Output format
Reply with:
1. A link to the list and the number of items it contains (or the mapping used, in own-data mode).
2. A link to the dashboard page.
3. One or two sentences on what the wheel shows.
4. Any data gaps, failed rows or deviations from the template, stated plainly.
