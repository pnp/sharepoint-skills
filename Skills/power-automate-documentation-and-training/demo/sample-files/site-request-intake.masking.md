# Masking table: Weekly site request intake

Previews are redacted. The real values stay inside the export and are never written to any output.

| ID | What it is | Where | Real value (redacted) | Fictional replacement | Action |
| --- | --- | --- | --- | --- | --- |
| M1 | GUID (list, flow, or resource ID) | `source.flowPath, flow.id` | `4D2C...0D11` | `00000000-0000-4000-8000-000000000001` | replace |
| M2 | Connection ID | `connections[0].connectionName` | `nw_s...f3a1` | `connection-1` | replace |
| M3 | Connection ID | `connections[1].connectionName` | `nw_s...b9c4` | `connection-2` | replace |
| M4 | Connection ID | `connections[2].connectionName` | `nw_s...d1e0` | `connection-3` | replace |
| M5 | SharePoint site URL | `steps[2].inputs.dataset` | `https://n***.sharepoint.com/sites/I***` | `https://contoso.sharepoint.com/sites/team-site-1` | replace |
| M6 | GUID (list, flow, or resource ID) | `steps[2].inputs.table` | `5b1f...8a64` | `00000000-0000-4000-8000-000000000002` | replace |
| M7 | URL with a key or signature | `steps[8].inputs.uri` | `https://p***.n***.net/a***/s***` | `https://example.com/redacted` | redact |
| M8 | Key, token, or password | `steps[8].inputs.headers/Authorization` | `Bea***` | `[REDACTED]` | redact |
| M9 | Key, token, or password | `steps[8].inputs.headers/x-api-key` | `k9F***` | `[REDACTED]` | redact |
| M10 | Email address | `steps[10].inputs.emailMessage/Cc` | `i***@n***.example` | `alex@contoso.com` | replace |
