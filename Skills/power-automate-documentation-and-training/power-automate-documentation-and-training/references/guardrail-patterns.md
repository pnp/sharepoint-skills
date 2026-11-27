# Guardrail patterns

Settings in the export that usually deserve a guardrail card, a sticker on the step, or a quick check.

| Pattern in the JSON | What can go wrong | A good quick check |
| --- | --- | --- |
| Polling trigger with `recurrence` of a few minutes (RSS, "When an item is created") | Runs pile up; re-published or edited items look new and create duplicates | "You re-publish an item. What happens?" |
| `splitOn` on the trigger | One run per item, so steps see a single item, not a list | "Three items arrive at once. How many runs?" |
| No lookup before a create action | Reruns create duplicates | "Why look up the key before creating?" |
| `If` with an empty arm | People think the flow failed when it did nothing on purpose | "What happens to an item that fails the condition?" |
| `Until` without a sensible `limit` | Endless loops until the 30-day run limit | "When does this loop stop if the status never changes?" |
| `Until` reading the HTTP status code | Stops too early: 200 means the request worked, not that the job is done | "Which value should the loop read?" |
| `Foreach` with `runtimeConfiguration.concurrency` | Parallel iterations race on shared variables | "Why is concurrency set to 1 here?" |
| `runAfter` with `Failed` or `TimedOut` | An error path that only runs when something broke | "When does this scope run?" |
| Two siblings with the same `runAfter` | Parallel branches; order is not guaranteed | "Which branch finishes first?" |
| Hard-coded IDs in an action (export ID, item ID) | Works once, then reads the wrong record | "Which ID should this step use?" |
| HTML or rich text from a trigger | Raw tags end up in plain-text columns | "Why convert before saving?" |
| `secureInputs` / `secureOutputs` off on HTTP with keys | Secrets show up in run history | "Where could this key leak?" |

Pick three or four for the finish screen. Turn two or three into quick checks. Put each guardrail on the step where the learner meets it, and number them in flow order.
