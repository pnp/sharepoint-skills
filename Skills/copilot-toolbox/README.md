# Copilot Toolbox – SharePoint Skill Package

This package installs, synchronizes, repairs, and publishes the portable English Copilot Toolbox on a SharePoint site.

## Package contents

```text
copilot-toolbox-package/
├── README.md
└── copilot-toolbox/
    └── SKILL.md
```

## What the skill does

The `copilot-toolbox` skill:

- creates the English `copilot-toolbox` SharePoint list when it doesn't exist;
- creates the required schema, the `New Tools` review view, the `Set tool active` Quick Step, and `Toolbox.aspx`;
- imports and synchronizes the complete current Copilot tool catalog;
- calls `learn_tool` for every current tool, including direct tools, before planning any tool-record writes;
- stores the unchanged short catalog description in `description`, detailed learned guidance in `UseCase`, and every exact learned input with its verified meaning in `KeyParameters`;
- blocks all tool-record writes until every current tool passes the mandatory enrichment transaction gate;
- rejects placeholder, generic, provisional, emergency, simplified, or seed imports;
- automatically detects and repairs incomplete current-tool rows, including rows already marked `active`;
- safely resumes after timeouts, parser failures, expired confirmations, interrupted runs, and ambiguous write outcomes by fresh-reading the list first;
- creates only missing rows and updates only incomplete rows, avoiding duplicate writes;
- tracks `new`, `active`, `archived`, `removed`, and returning tools without deleting missing records automatically;
- reports success only after a fresh-read verification proves complete identity coverage, no duplicates, no missing required values, no filler, and meaningful parameter documentation;
- publishes one standalone English handbook named `copilot-toolbook-en.html` at the root of the target site's runtime-resolved standard document library (`Documents` or its localized equivalent, such as `Dokumente`);
- never modifies or replaces `Home.aspx`.

## Installation

1. Open the target SharePoint site.
2. Copy the complete `copilot-toolbox` folder into:

   `Agent Assets / Skills / copilot-toolbox`

3. Start a new Copilot conversation on the target site so the current skill version is selected.
4. Ask Copilot:

   > Install the toolbox and import all tools.

On first use, the skill provisions the complete solution and imports the current catalog only after the enrichment gate passes. On later runs, it synchronizes and repairs the existing toolbox without recreating artifacts.

## Regular synchronization and repair

Ask Copilot:

> Synchronize the Copilot Toolbox and fully enrich every current tool.

The skill reads the current list, learns every current tool, validates every planned row, repairs incomplete records, adds newly detected tools with status `new`, reactivates returning tools, and marks proven missing tools as `removed`.

## Enrichment transaction gate

Before any tool-record create or update, the skill must prove for every current tool that:

- `UseCase` contains `When to invoke`, `When not to invoke`, and `Usage notes` in order;
- learned exclusions, prerequisites, sequencing, limits, and constraints are retained;
- `KeyParameters` contains every exact learned parameter name and a verified meaning;
- `Category` is the most specific verified family;
- `Example` and `PromptTemplate` are capability-specific;
- no managed field contains placeholder or generic fallback text.

There is no degraded import mode. If the gate fails, the skill writes no tool records and reports `partial` with the failed checks.

## Failure recovery

After a timeout, parser error, expired confirmation, interrupted execution, or unknown write result, the skill:

1. fresh-reads every managed field;
2. classifies each authoritative tool as verified, missing, incomplete, or duplicate;
3. preserves verified rows and reviewed lifecycle state;
4. creates only missing rows;
5. updates only incomplete rows from retained learned definitions;
6. never repeats a write whose intended state is already present.

If the platform requires a new confirmation, approve it and rerun the same synchronization request. The skill resumes from the fresh-read state and must not fall back to placeholders.

## Toolbox.aspx button configuration

Both required controls must be real SharePoint **Button** web parts. For each button:

1. Set **Action / Action type** to **Copilot in SharePoint**.
2. Do **not** leave the default action as **Link** and do not enter a URL.
3. Enter the exact request in the **Prompt** field displayed below the Copilot in SharePoint action selector.

Required configuration:

| Button | Action | Prompt |
|---|---|---|
| `Update Toolbox` | `Copilot in SharePoint` | `Synchronize the Copilot Toolbox and fully enrich every current tool.` |
| `Toolbook HTML` | `Copilot in SharePoint` | `Create or refresh copilot-toolbook-en.html in this site's standard document library.` |

A button configured as `Link` is a failed installation, even if its label and visible text are correct. Page verification must prove the Button web-part type, the `Copilot in SharePoint` action, and the exact Prompt value. If page extraction can't expose these properties, report them as unverified rather than claiming that the buttons work.

## Publish the Toolbook

Ask Copilot:

> Create or refresh copilot-toolbook-en.html in this site's standard document library.

Only the English HTML Toolbook is published. The skill resolves the site's standard document library at runtime—commonly `Documents` or a localized equivalent such as `Dokumente`—and saves `copilot-toolbook-en.html` at that library's root. It includes `new`, `active`, and `archived` tools and excludes `removed` tools by default.

## Review workflow

Newly detected tools receive status `new`. Review them in the `New Tools` view and use the `Set tool active` Quick Step to change reviewed records to `active`.

An `active` status doesn't exempt a row from quality checks. A later synchronization repairs an active row if its learned documentation is incomplete.

## Expected artifacts

- SharePoint list: `copilot-toolbox`
- View: `New Tools`
- Quick Step: `Set tool active`
- SharePoint page: `Toolbox.aspx`
- English handbook: `copilot-toolbook-en.html` in the root of the standard document library

## Verification checklist

After installation or synchronization, verify that:

- the list contains every current authoritative tool identity exactly once;
- every current tool was processed through `learn_tool`;
- `description` keeps the original short catalog text unchanged;
- `UseCase` contains tool-specific learned invocation guidance and constraints;
- `KeyParameters` contains exact input names and verified meanings, not names only;
- no row contains `Needs review`, generic filler, or equivalent placeholder text;
- the `New Tools` view and `Set tool active` Quick Step work;
- `Toolbox.aspx` uses the `copilot-toolbox` list and `New Tools` view;
- `copilot-toolbook-en.html` exists at the root of the runtime-resolved standard document library;
- `Home.aspx` remains unchanged.

If any check fails, the run is `partial`, not complete.

## Attribution

**Built by Michael Greth**
- LinkedIn: linkedin.com/in/mgreth/
- Podcast: yourcopilot.de  
- GitHub: github.com/mysharepoint
