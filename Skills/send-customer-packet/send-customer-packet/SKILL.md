---
name: send-customer-packet
description: |-
  Prepare, preview, and send a customer packet email with a view-only packet link. Gate sending on Packet status Customer Ready, require confirmation bound to an immutable preview, and set Packet status to Customer Sent only after delivery.

  Use when the user says:
  - "send to customer"
  - "share with customer"
  - "email customer packet"
  - "send the customer packet"
metadata:
  author: HassanJMoses
---
# Send Customer Packet

## When to use
Use for one selected Completed Packets file whose Packet status is Customer Ready.

## Inputs
- One selected completed packet file.
- Its Contact email, Contact name, Business name, Policy number, Policy start date, and Packet status.
- `Email templates/customer-packet-email.md`.

## Immutable send-preview receipt
- Before asking for confirmation, freeze a send-preview receipt containing packet identity and version, verified metadata values, recipient, view-only sharing link, finalized subject, and finalized HTML body.
- Display the complete receipt-bound preview: To, Subject, and Email.
- `Confirm to send` authorizes only the exact receipt that was shown. Before delivery, compare the current packet identity/version and metadata, recipient, link, subject, and body with the receipt.
- Any changed packet version, metadata, recipient, link, subject, body, or requested edit invalidates the receipt. Show a fresh complete preview and require a fresh `Confirm to send`.
- Only send and update status when the confirmed receipt matches the current packet and metadata.

## Steps
1. Verify exactly one file is selected; otherwise ask the user to select one packet.
2. Use `tools.lists.getItems({listId:completedPacketsId, viewFields:[...]})` to read the selected file’s metadata. Use only custom `PacketStatus` as the send gate.
3. Require `PacketStatus = Customer Ready` plus nonblank Contact email, Policy number, and Policy start date. If any check fails, do not share, email, or update status; report the blocker.
4. Do not read, use, or update native approval status or custom Approval status.
5. Read `Email templates/customer-packet-email.md` with `tools.files.read({path:"Email templates/customer-packet-email.md", webUrl})`. Do not invent substitute wording.
6. Create a view-only sharing link for the selected file only, addressed only to Contact email, using `tools.files.share({itemPaths:[selectedPacketPath], ...})`.
7. Fill all template placeholders from verified metadata and the link. Preserve all remaining subject and body text exactly. Stop if any placeholder remains unresolved.
8. Freeze the immutable send-preview receipt and show the completed To, Subject, and Email in chat. Ask: **Reply “Confirm to send” to deliver this email, or “Edit to send” followed by your changes.**
9. Do not send, update metadata, or claim delivery until exact `Confirm to send` is received for the current receipt.
10. For `Edit to send`, apply only requested changes, invalidate the prior receipt, show the full revised email, freeze a new receipt, and ask again for confirmation.
11. On confirmation, verify the current packet and metadata against the receipt. If any field differs, do not send; state that the preview was invalidated and show a fresh preview.
12. After a matching confirmation, send the finalized message with `tools.email.send({to:[contactEmail], subject, htmlBody})`.
13. Only after email delivery succeeds, use `tools.lists.updateItems({listUrl:completedPacketsUrl, items:[...]})` to set only `PacketStatus` to `Customer Sent`.
14. If sharing, reading, sending, receipt verification, or status update fails, state that plainly. Never claim delivery or set Packet status to Customer Sent unless the email was sent.

## Output format
Before sending, show the receipt-bound complete To, Subject, Email, and confirmation choices. After sending, report packet file name, recipient, sharing result, email result, receipt verification, and final Packet status.

## Constraints
Share only the selected file. Never send without explicit confirmation for a matching receipt, never send when required metadata is missing, and never read or update approval-status fields.