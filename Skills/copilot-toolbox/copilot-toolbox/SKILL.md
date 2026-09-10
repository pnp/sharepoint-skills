---
name: copilot-toolbox
description: |-
  Creates, initializes, synchronizes, repairs, and publishes the portable English Copilot Toolbox, including its list, review workflow, Toolbox.aspx, and English HTML Toolbook. Blocks incomplete imports, enforces Copilot in SharePoint button actions, and resumes safely after failures.

  Use when the user says:
    - "Copilot Toolbox"
    - "install the toolbox and import all tools"
    - "synchronize the Agent Toolbox list"
    - "Synchronize the Copilot Toolbox and fully enrich every current tool."
    - "create the English Copilot Toolbook"
---
# Copilot Toolbox

## When to use

Use this portable workflow to install, synchronize, repair, review, or publish the English `copilot-toolbox` solution on the current SharePoint site unless another site is named.

- The generic list `copilot-toolbox` is the installation marker.
- If absent, provision the complete solution and import the current catalog.
- If present, never recreate existing artifacts; synchronize, repair, or publish as requested.
- Never create, replace, edit, or designate `Home.aspx` as the site home page.
- Never hard-code site URLs, list/view IDs, timestamps, page URLs, library paths, or tool counts.

## Inputs

- Target list: `copilot-toolbox`.
- Authoritative identities and short descriptions: complete current tool catalog plus supplied `--agenttools` where present.
- Mandatory enrichment source: complete `learn_tool` result for every current tool, including direct tools.
- Identity key: exact `Title`, compared trimmed and case-insensitive.
- Lifecycle: `new`, `active`, `archived`, `removed`.
- Page: `Toolbox.aspx` in Site Pages.
- Publication: `copilot-toolbook-en.html` in the current site's runtime-resolved standard document library (`Documents` or its localized equivalent, such as `Dokumente`).

Managed fields:

| Field | Required rule |
|---|---|
| `Title` | Exact tool identity; display name Tool Name. |
| `description` | Original short catalog description unchanged. |
| `Category` | Most specific verified functional family. |
| `UseCase` | Learned `When to invoke`, `When not to invoke`, `Usage notes`, in that order. |
| `Example` | Concrete valid English request specific to the tool. |
| `PromptTemplate` | Capability-specific reusable request with meaningful placeholders. |
| `KeyParameters` | Every exact learned input name and concise verified meaning. |
| `Status` | `new`, `active`, `archived`, or `removed`. |
| `Tags` | Conservative English search terms. |
| `Source` | `tool-catalog`, `--agenttools`, `manual`, or `generated`. |
| `FirstSeen` | Initial verified detection; preserve existing populated values. |
| `LastSeen` | Current verified detection. |
| `RemovedOn` | Set only for removed tools. |
| `workstep` | Quick Steps column for deterministic review. |

Do not create `Purpose`, `Prerequisites`, `Complexity`, `OutputType`, or `ReviewNotes`.

## Steps

### 1. Detect mode and read state

1. Discover generic lists and resolve `copilot-toolbox` by normalized title.
2. Do not use metadata `itemCount` as row truth.
3. If the list exists, read every row with all managed internal fields; re-read at returned count if truncated.
4. Preserve exact identities, accurate editorial content, `FirstSeen`, and active/archived lifecycle state unless verified current learning requires correction.

### 2. First-run provisioning

Run only when the list is absent.

1. Create the English generic list with all managed fields and rename built-in `Title` to Tool Name. Seed no fixed records.
2. Create view **New Tools** with query `<Where><Eq><FieldRef Name="Status"/><Value Type="Choice">new</Value></Eq></Where>`, fields `LinkTitle`, `description`, `Category`, `Status`, `FirstSeen`, `workstep`, and row limit 30.
3. Fetch actual schema and create exactly one active Quick Step named `Set tool active`, condition `[$Status] == 'new'`, action `SetValue`, Status = `active`, Choice overwrite, no prompt and no flow.
4. Configure only verified `workstep` with that Quick Step using paired CornflowerBlue classes. Never attach it to `Action0`.
5. Create exactly one full-width home-layout `Toolbox.aspx` through `create_page_workspace`, without changing the site home page.

Before page creation resolve actual list/view IDs and URLs and pass them in `providedContent`.

The `pageSpec` MUST include these exact binding and action rules:

`The List web part MUST use the list whose title is exactly copilot-toolbox and the view whose title is exactly New Tools. It MUST NOT use Documents, Shared Documents, Site Pages, or any other library.`

`Each required Button web part MUST set its Action / Action type to Copilot in SharePoint (the localized UI label may also be Copilot in SharePoint). It MUST NOT use Link, URL, text link, Quick Links, Hero link, or any navigation action. Enter the exact required request in the Prompt field shown below the Copilot in SharePoint action selector.`

The page must contain, in order:

1. Image-free white-to-teal/green-blue full-width surface with strong contrast.
2. Exact title `Copilot in SharePoint Toolbox`.
3. Exact subtitle `A Self-Updating SharePoint List of All Copilot in SharePoint Agent Tools`.
4. Short English explanation of create, synchronize, enrich, review, and publish.
5. Exactly two real SharePoint Button web parts:
   - `Update Toolbox`: Action / Action type = `Copilot in SharePoint`, never `Link`; Prompt field = `Synchronize the Copilot Toolbox and fully enrich every current tool.`
   - `Toolbook HTML`: Action / Action type = `Copilot in SharePoint`, never `Link`; Prompt field = `Create or refresh copilot-toolbook-en.html in this site's standard document library.`
6. List web part bound to actual `copilot-toolbox` and `New Tools` IDs.
7. `Built by Michael Greth — yourcopilot.de` and `Source: github.com/mysharepoint`.

The page agent must not put the prompt into a URL field, button URL, description, tooltip, or visible body text as a substitute. The prompt belongs in the Prompt field beneath the `Copilot in SharePoint` action selection.

Read the page once after creation. Verify what extraction exposes. A button is valid only if all three facts are proven: it is a real Button web part; its action is `Copilot in SharePoint` and not `Link`; its Prompt field equals the required prompt. Also verify image-free design, title/subtitle, List binding, and unchanged `Home.aspx`. If extraction cannot prove action type or prompt storage, report those requirements as unverified and the page provisioning as partial; never claim the buttons work. If a button uses Link, report it as failed provisioning and provide the exact manual correction.

### 3. Learn every current tool

1. Enumerate the complete authoritative tool set exactly, including direct-tool identities.
2. Call `learn_tool` for every current tool in safe batches and retain every complete result.
3. Map each tool independently:
   - Keep `description` unchanged from the short catalog.
   - Build `UseCase` only from learned guidance and preserve explicit exclusions, prerequisites, sequencing, limits, identifiers, and constraints.
   - Build `KeyParameters` from every exact learned input plus its verified meaning.
   - Choose the most specific family, such as `automation.approvals.*` → Approvals.
   - Write a capability-specific Example and PromptTemplate, not boilerplate.
   - Never invent a missing learned section; mark it unavailable and fail the gate below.

### 4. Mandatory enrichment transaction gate

Treat enrichment and synchronization as one logical transaction. Before any tool-record create or update:

1. Retain one complete `learn_tool` result for every authoritative current tool.
2. Build the complete final row for every current tool in memory.
3. Finish identity comparison, lifecycle decisions, timestamps, choices, and the full write plan.
4. Validate every current row against every blocking check.
5. Write nothing unless all current tools pass.

Blocking checks:

- `UseCase` has `When to invoke`, `When not to invoke`, and `Usage notes` in order.
- `UseCase` retains tool-specific exclusions, prerequisites, sequencing, limits, and constraints.
- `KeyParameters` contains every learned input and a non-empty verified meaning for each; name-only lists fail.
- `Category` is the most specific verified family.
- `Example` is a concrete valid request, not boilerplate.
- `PromptTemplate` has capability-specific placeholders.
- No managed field contains placeholder, fallback, or generic filler.

Forbidden patterns include `Needs review`, `requires enrichment`, `exact meanings require`, generic `verified inputs`, `concrete task`, `specific outcome`, `specific target`, copying the short description as the whole `UseCase`, name-only `KeyParameters`, and generic Examples or PromptTemplates reusable unchanged for unrelated tools.

This gate applies after timeout, throttling, parser errors, declined or expired confirmation, partial writes, and every fallback/recovery path. There is no emergency, simplified, provisional, placeholder, or seed import mode. If learning or validation is incomplete, stop before tool-record writes and report the failed gate.

### 5. Compare and lifecycle plan

- Match exact trimmed lowercase identity; use only confirmed aliases.
- New current tools → `new`.
- Preserve `archived`.
- Returning `removed` tools → `new`, clear `RemovedOn`.
- Mark missing tools `removed` only when the complete authoritative set proves absence; never delete automatically.
- Add required Category choices before writing affected rows.

### 6. Automatic repair and safe resume

At the start of every synchronization, scan all existing current-tool rows against the blocking checks. Treat a violating row as incomplete regardless of `Status`, including `active`.

After an ambiguous write result, timeout, expired confirmation, or interrupted execution:

1. Fresh-read every managed field.
2. Match by normalized exact `Title`.
3. Classify every authoritative identity as `verified`, `missing`, `incomplete`, or `duplicate`.
4. Preserve verified rows and human-reviewed lifecycle state.
5. Create only missing rows.
6. Update only incomplete rows from retained complete learned definitions.
7. Never repeat a write whose intended state is already present.
8. Do not delete duplicates automatically; report exact duplicate identities unless a verified safe correction is available.

When execution can continue safely, resume automatically from the fresh-read state. If the platform requires a new confirmation, stop before degraded writes; after confirmation, fresh-read and repeat the complete enrichment gate.

### 7. Write and verify

Write only after the transaction gate passes. Set `LastSeen`, preserve or initialize `FirstSeen`, set `Source`, clear `RemovedOn` for current tools, and fresh-read all rows. Verify exact identity coverage, duplicates, required fields, forbidden markers, lifecycle values, and parameter meanings. Sample every learned batch and compare stored `UseCase` and `KeyParameters` with retained learned definitions. After ambiguous timeouts, fresh-read before retrying.

### 8. Completion assertion

Report `created-and-initialized` or `existing-list-updated` as successful only when a fresh read proves exact authoritative identity coverage, zero duplicate current identities, zero missing required values, zero forbidden markers or generic filler, zero name-only `KeyParameters`, and stored samples from every learning batch matching retained definitions.

Otherwise report `partial`, name each failed check, list affected identities or a bounded sample plus count, and never describe the import as complete. Continue automatic repair when safely possible.

### 9. Publish English Toolbook

Create or refresh only `copilot-toolbook-en.html` in the current site's runtime-resolved standard document library. Discover the site's standard document library at runtime; its title is commonly `Documents` or a localized equivalent such as `Dokumente`. Never hard-code the library title or URL, and never save the Toolbook to AgentAssets, the skill folder, or any library other than the resolved standard document library. Save the file at the root of the resolved standard document library. Include `new`, `active`, and `archived`; exclude `removed` by default. Preserve multiline `UseCase` and exact `KeyParameters`, sort categories alphabetically, provide search, status filtering, collapsible categories and lifecycle badges, keep blue/orange design and attribution, use English only, verify file existence in the resolved standard document library, and return its browser link.

## Output format

Report briefly:

- Mode: `created-and-initialized`, `existing-list-updated`, `toolbook-published`, or `partial`.
- Artifact status: list, schema, New Tools, Quick Step, workstep, Toolbox.aspx, image-free header, two Button web parts, each button's action type, each Prompt field, and verified List binding.
- Current, created, updated, removed, reactivated, duplicate, and incomplete counts.
- Learned sent, successful, incomplete, and failed counts.
- Blocking-gate result and unresolved learned sections.
- New, Removed, Reactivated, and Needs repair sets; for more than 20 show totals and about five examples.
- Links to Toolbox.aspx, the list, and Toolbook when present.

If any tool or page operation fails or returns empty, say so plainly and never invent success.

## Constraints

- Never modify `Home.aspx`.
- Never rerun first-run provisioning when the list exists.
- Never seed fixed tool identities or counts.
- Never create duplicate lists, views, Quick Steps, pages, or Toolbook files.
- Never write tool records before complete mandatory learning and validation.
- Never use generic filler or placeholder imports.
- Never call name-only parameters complete.
- Never overwrite accurate editorial fields without verified reason.
- Never publish the Toolbook outside the runtime-resolved standard document library.
- Never produce German Toolbox or Toolbook artifacts.
- Never configure either Toolbox button with action `Link`; both MUST use `Copilot in SharePoint` and store the exact request in the Prompt field.
- A confirmation timeout is not permission to degrade quality; after confirmation, resume from fresh state and rerun the gate.