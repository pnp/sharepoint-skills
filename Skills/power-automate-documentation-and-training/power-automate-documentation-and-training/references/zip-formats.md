# Export formats and how to walk them

Power Automate cloud flows use the Azure Logic Apps workflow definition language. Every format below ends in the same object: `triggers`, `actions`, and `parameters`.

## 1. Legacy package (My flows > Export > Package (.zip))

```
manifest.json                                   package name, resources, connection display names
Microsoft.Flow/flows/manifest.json              list of flow folders
Microsoft.Flow/flows/<id>/definition.json       the flow: properties.definition + properties.connectionReferences
Microsoft.Flow/flows/<id>/apisMap.json          connector key -> manifest resource id (connector)
Microsoft.Flow/flows/<id>/connectionsMap.json   connector key -> manifest resource id (connection)
connections.json, flow.json                     sometimes present
```

- Flow name: `properties.displayName`.
- Connector display name: `apisMap[key]` -> `manifest.resources[id].details.displayName` (for example "Content Conversion").
- Connection display name: `connectionsMap[key]` -> `manifest.resources[id].details.displayName`. For SharePoint and Outlook this is often the signed-in account's email, so it must be masked.
- `properties.definition.metadata` holds creator, tenant, environment, and subscription IDs. Do not show any of it.

## 2. Solution export (.zip)

```
solution.xml                       UniqueName of the solution
customizations.xml                 <Workflow Name="..."> and <connectionreference> display names
Workflows/<Name>-<GUID>.json       one file per flow: properties.definition + properties.connectionReferences
```

- Flow name: `customizations.xml` `Workflow/@Name`, matched by the GUID at the end of the file name.
- Connector: `properties.connectionReferences[key].api.name` (for example `shared_sharepointonline`).
- Connection: `properties.connectionReferences[key].connection.connectionReferenceLogicalName`, then its display name in `customizations.xml`.
- If the solution holds several cloud flows, make one page per flow and list the others so the user can pick.

## 3. A loose definition JSON

Either the whole flow JSON (`properties.definition`) or a bare `{ "triggers": ..., "actions": ... }` object.

## Walking the definition

1. Take the first trigger as the START step. Read `type` (`Recurrence`, `Request`, `OpenApiConnection`, ...), `recurrence`, `splitOn`, `conditions`, and `inputs`.
2. Read the top-level `actions`. Order siblings by `runAfter`: an empty `runAfter` follows the trigger (or the parent container). Break ties by the order in the JSON.
3. Recurse into every container:

| Type | Children | Notes |
| --- | --- | --- |
| `Foreach` | `actions` | Input is `foreach`. Concurrency is in `runtimeConfiguration.concurrency`. |
| `Until` | `actions` | Exit condition is `expression`; the cap is `limit.count` and `limit.timeout`. |
| `If` | `actions` (YES), `else.actions` (NO) | `expression` is an object such as `{"and":[{"equals":[a,b]}]}`. An empty arm is still an arm. |
| `Switch` | `cases.<name>.actions`, `default.actions` | Each case has a `case` value. |
| `Scope` | `actions` | Often used with run-after `Failed` as a try / catch. |

4. For each action, note the connector (`inputs.host.connectionName` or `apiId`), the operation (`inputs.host.operationId`), the parameters (`inputs.parameters`), and every expression (strings that start with `@` or contain `@{...}`).
5. Flag these as you go: a `runAfter` status other than `Succeeded` (error handling), two siblings with the same `runAfter` (parallel branch), a `splitOn`, a `recurrence` under 5 minutes, a missing `limit` on `Until`, hard-coded IDs, and HTTP actions with headers.

`scripts/parse_flow.py` does all of this and writes the result as a step graph (`flow-step-graph/1`). See `data-schema.md` for how the graph maps to the page.
