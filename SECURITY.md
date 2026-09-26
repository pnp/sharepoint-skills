# Security Policy

## Scope

This repository contains community-provided Markdown skill instructions, documentation, metadata, and supporting assets. Skill packages do not include executable code, but their instructions can guide Copilot to act on SharePoint content. Security concerns can therefore include:

- Instructions that could cause unauthorized, destructive, or misleading actions
- Instructions designed to override user intent or expose information
- Credentials, tenant data, customer data, or personal information committed to the repository
- Malicious or deceptive links, files, metadata, or supporting assets

Only content on the `main` branch is actively maintained. Historical commits, forks, and modified copies are not supported by this repository.

## Reporting a Security Concern

Report suspected security concerns privately through [GitHub Security Advisories](https://github.com/pnp/sharepoint-skills/security/advisories/new). Do not disclose sensitive details in a public issue.

Include the affected skill or file path, the potential impact, concise reproduction steps, and a suggested mitigation when available. Use synthetic or redacted examples only; never include credentials or real tenant, customer, or personal data.

If private reporting is unavailable, open a [problem report](https://github.com/pnp/sharepoint-skills/issues/new?template=problem.yml) with only a high-level description and no sensitive or actionable details. A maintainer can then coordinate an appropriate follow-up.

For ordinary quality, documentation, or functional problems that do not require confidential handling, use the repository's [issue forms](https://github.com/pnp/sharepoint-skills/issues/new/choose).

## Safe Use

Review every skill before uploading it, test with representative non-sensitive content, and grant users only the SharePoint permissions needed for their work. Skills do not expand a user's existing permissions, but they may perform actions that the user is already authorized to perform.
