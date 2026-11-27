# Masking

Exports carry real tenant data. Mask everything below before writing a page, a sample, or a public copy.

## What to look for

| Kind | Examples of where it hides | Replacement style |
| --- | --- | --- |
| Personal OneDrive site URL | `dataset` on SharePoint actions | `https://contoso-my.sharepoint.com/personal/alex_contoso_com` |
| SharePoint site URL | `dataset`, HTTP `uri` | `https://contoso.sharepoint.com/sites/team-site-1` |
| Other URLs (feeds, APIs) | trigger `feedUrl`, HTTP `uri` | `https://example.com/<generic path>` such as `https://example.com/podcast/rss` |
| URL with `sig=`, `code=`, `key=`, `token=` | HTTP request triggers, webhooks | `https://example.com/redacted` (redact) |
| Tenant host names | `*.sharepoint.com`, `*.onmicrosoft.com`, `*.dynamics.com` | `contoso.sharepoint.com` |
| Personal site paths | `/personal/first_last_company_com` | `/personal/alex_contoso_com` |
| Emails | To, Cc, connection display names | `alex@contoso.com`, `sam@contoso.com` |
| GUIDs | list `table` IDs, flow IDs, environment IDs | `00000000-0000-4000-8000-000000000001` and up |
| Connection IDs | `connectionName`, `connectionReferenceLogicalName` | `connection-1` and up |
| Keys, tokens, passwords | `Authorization`, `x-api-key`, `password`, JWTs, long base64 | `[REDACTED]` (redact, never a look-alike) |
| Names the user asks to hide | company, product, customer, person names in action names or text | a neutral name the user approves |

Never show the flow `metadata` block (creator, tenant, environment, subscription).

## How to show it

Show a table with a short ID, what the value is, where it appears, a **redacted** preview (first letter and `***`, or the first and last four characters of an ID), the proposed replacement, and the action (replace or redact). Never repeat the full real value, not even in the chat.

## Rules

- Same real value, same replacement, everywhere in the page.
- Keep public names the user says are public (for example their own show name). Ask; do not assume.
- After generating, search the page for the tenant name, the user's name, `@`, `sharepoint.com`, and long hex strings.
- Do not write the page until the user has approved the table. If the finished page still contains a real value, or a sensitive value that was not in the table, stop and add it to the table before handing the page over.
