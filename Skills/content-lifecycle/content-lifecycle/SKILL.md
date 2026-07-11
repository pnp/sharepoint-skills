---
name: "content-lifecycle"
description: "Manages the content lifecycle for SharePoint documents — set retention labels, archive old content, manage expiry dates, and enforce deletion policies. Use when the user asks to set retention, archive old documents, manage content expiry, apply retention labels, clean up old content, or enforce document lifecycle policies."
---

# Content Lifecycle Management

Manage SharePoint document retention, archiving, and expiry. Supports applying retention labels, identifying content for archiving, managing version history, and handling expired content.

## Capabilities

1. **Retention Labels** — Apply, view, or remove retention labels on documents/libraries
2. **Archive Management** — Identify and flag content older than a threshold
3. **Version History Cleanup** — Reduce version count on large documents
4. **Expiry Review** — Find and report expired content

---

## 1. Retention Labels

### View labels on a document
Call `get_list_item_metadata` with the item ID and include the `ComplianceAssetId` and `_ComplianceTag` fields:
```
itemId: <id>, fieldInternalNames: ["FileLeafRef", "ComplianceAssetId", "_ComplianceTag", "_ComplianceTagWrittenTime"]
```

### Apply a retention label
Use `update_list_items` with the item ID and the retention tag field:
```
itemId: <id>, fieldInternalNames: ["_ComplianceTag"], newValues: ["<label-name>"]
```

> **Important:** The label must already exist in the Microsoft Purview compliance portal. Labels available for manual application are the user's responsibility. If the user asks to apply a label they haven't specified the name of, ask them which label to use.

### List available retention labels
If the user asks what labels are available, guide them to the Microsoft Purview compliance portal (https://compliance.microsoft.com/informationprotection). SharePoint does not expose the full label list through list item APIs.

---

## 2. Archive Management

Identify documents that haven't been modified in a specified period and summarize them for review.

### Steps

1. **Get the target library:** Use the current library if not specified. Call `get_current_list_or_library` to get the library ID.

2. **Get the library schema:** Call `get_list_schema` to confirm the library has `Modified` and `FileLeafRef` fields.

3. **Query old documents:** Call `get_list_item_metadata` with CAML filter:
   ```xml
   <Query>
     <Where>
       <And>
         <Lt><FieldRef Name='Modified'/><Value Type='DateTime' IncludeTimeValue='FALSE'><Today OffsetDays='-{threshold_days}'/></Value></Lt>
         <Eq><FieldRef Name='FSObjType'/><Value Type='Integer'>0</Value></Eq>
       </And>
     </Where>
     <OrderBy><FieldRef Name='Modified' Ascending='TRUE'/></OrderBy>
   </Query>
   ```
   Replace `{threshold_days}` with the user's threshold (e.g., 365 for 1 year).

4. **Show a summary table:**
   | # | File Name | Folder | Last Modified | Size |
   |---|---|---|---|---|
   | 1 | old-report.docx | /sites/Team/Reports | 2024-01-15 | 2.3 MB |
   | 2 | draft-plan.pptx | /sites/Team/Reports/Archive | 2024-03-01 | 8.1 MB |

5. **Ask the user what to do:** Options include:
   - Move to an archive library (guide user to create one if needed)
   - Apply a retention label
   - Delete (confirm twice before proceeding)
   - Take no action (skip)

6. **Execute the chosen action** per the user's instruction.

---

## 3. Version History Cleanup

When a document has an excessive version count (hundreds of versions), reduce it to a reasonable number.

### Steps

1. **Identify the target:** A specific document or all documents in a library.
2. **Check current version count:** Call `get_list_item_metadata` — if using CAML, include `_UIVersionString` and check the count endpoint.
3. **If version count exceeds a reasonable threshold** (user-specified, default 50):
   - Inform the user of the current count.
   - Suggest reducing to a target number (e.g., keep the latest 50 versions, remove the rest).
   - **Do not delete versions automatically** — SharePoint version deletion is irreversible. Always confirm with the user.
4. **Guide the user** to manage versions manually via:
   - Library settings → Versioning settings → "Keep the following number of major versions"
   - Or via SharePoint admin center for site-level policies

> ⚠️ Version deletion is destructive and irreversible. Never perform version deletion through the Copilot skill. Always guide the user to the appropriate settings page.

---

## 4. Expiry Review

Find content that is past its expiry date based on retention labels and the `_ComplianceTagWrittenTime` field.

### Steps

1. **Query the library** for items where `_ComplianceTag` is set and the content is past its intended lifecycle.
2. **Present a report:**
   | # | File Name | Label | Tag Applied | Age | Status |
   |---|---|---|---|---|---|
   | 1 | contract.docx | "7-Year Retention" | 2021-06-15 | 5 years | Active |
   | 2 | nda.pdf | "3-Year Retention" | 2021-01-10 | 5.5 years | **Past expiry** |
3. Flag items where age exceeds the expected retention period based on the label name.
4. **Recommend actions:** Extend retention, mark for deletion review, or remove the label.

> **Note:** SharePoint's `_ComplianceTag` field stores the label name, but the actual retention period is configured in Microsoft Purview. The skill cannot read retention periods from Purview — use the label name as a heuristic.

---

## Constraints

- **Never delete content without double confirmation.** Always say: "This will permanently delete the selected content. Are you sure?"
- **Never modify retention labels without the user specifying the label name.** If unsure, ask.
- **Retention labels come from Microsoft Purview**, not SharePoint. The skill can apply labels that exist but cannot create new ones.
- **Version history deletion is irreversible.** Guide users to the settings UI instead of performing the action through the skill.
- **Archiving is a recommendation step** — present findings and let the user decide.
- **Always preview before acting.** Show which items will be affected before making changes.

---

## Examples

**User:** "Find documents in this library that haven't been modified in over a year"
**Agent:** Queries with `Today OffsetDays='-365'`, presents the summary table, and asks what to do.

**User:** "Apply the '7-Year Retention' label to this contract"
**Agent:** Updates `_ComplianceTag` on the specified item with value "7-Year Retention".

**User:** "Clean up old versions of this file, it has 200 versions"
**Agent:** Reports the version count and guides user to Library settings → Versioning settings.

---

## Edge Cases

- **No retention label found:** Tell the user no label is currently applied and ask if they want to apply one.
- **Library with no old content:** Say "No documents found older than the specified threshold" — do not show an empty table.
- **User asks to delete:** Double-confirm. If the user confirms twice, use `delete_list_item` with the item ID.
- **Library has hundreds of items to archive:** Process in batches of 50 and report progress.
