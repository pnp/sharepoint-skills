---
name: change-communication-pack
description: Turns a Microsoft 365 Message Center post, roadmap item or release note into a ready-to-use change communication pack - a user announcement, a service desk FAQ, a SharePoint news draft and a short checklist for admins - saved as one HTML file in the current site. Use when the user says - "make a change pack for this message" - "write the user announcement for MC..." - "prepare service desk notes for this change" - "turn this Message Center post into communication" - "how do I tell users about this change"
---

# Change Communication Pack

## Purpose

Every week Microsoft announces changes that users will notice: a button moves, a feature is renamed, an agent disappears. IT reads the Message Center post, but users, champions and the service desk need it in their own words. This skill turns one change notice into a small, consistent communication pack, so the same facts reach everyone and nothing is invented along the way.

The skill only writes new content. It never changes settings, publishes news pages or sends messages.

## Trigger Phrases

Activate this skill when the user says any of the following (or close variations):

- "make a change pack for this message"
- "write the user announcement for MC1234567"
- "prepare service desk notes for this change"
- "turn this Message Center post into communication"
- "how do I tell users about this change"
- "change communication for this roadmap item"

## Inputs

Accept the change notice in one of these forms:

- **Pasted text** of a Message Center post, roadmap item or release note
- **A file** in the current site (Word, PDF, text or a saved web page) that contains the notice
- **An ID only** (for example `MC1234567`). If the text isn't available in the conversation or the site, ask the user to paste it. Do not reconstruct a notice from memory.

Optional inputs the user may give:

- **Audience** - all staff, a department, champions, executives (default: all staff)
- **Language and tone** - default: the language of the request, plain and friendly
- **Organisation specifics** - the name of the service desk, intranet or change channel

## Rules

- Use only facts stated in the source notice. If a date, licence or behaviour is not in the source, do not add it.
- Mark anything the source leaves open as **"Not stated by Microsoft"**, and list it under open questions.
- Keep Microsoft's dates exactly as written, including words like "expected" or "planned".
- Never include tenant names, people or customer data unless the user provided them for this pack.
- Write for the audience. Users get what changes for them and what to do. Admins get the actions and settings.

## Steps

### Step 1 - Read and extract

From the source, extract into a short fact sheet:

- ID and title (for example `MC1234567`)
- What changes, in one sentence
- Who is affected (licences, roles, platforms)
- Timeline (start, end, retirement dates) exactly as stated
- Admin actions required or recommended
- What users will see or need to do
- Anything explicitly not changing

Show the fact sheet to the user and ask them to confirm or correct it before writing the pack. If the user has asked you to go straight to the pack, continue and include the fact sheet at the top of the output.

### Step 2 - Classify impact

Classify the change as one of:

- **Notice** - users will see something different, no action needed
- **Action** - users must do something (for example recreate, save or migrate content)
- **Decision** - the organisation must choose a setting or policy before a date

Use the classification to set the tone and the order of the pack.

### Step 3 - Write the pack

Write these five parts:

1. **User announcement** (80-150 words): what changes, when, what users need to do, where to get help. No jargon, no ID in the headline.
2. **Service desk FAQ** (4-6 questions): the questions users will actually ask, with short answers based only on the source. Include one question about what to do if something looks wrong.
3. **SharePoint news draft**: a headline (max 70 characters), a one-sentence summary for the news card, and a body of 150-250 words.
4. **Admin checklist**: 3-6 checkbox items with the actions and the dates they relate to.
5. **Open questions**: everything the source doesn't answer, so IT can follow up instead of guessing.

### Step 4 - Save the pack

Create one self-contained HTML file with the five parts in clearly labelled sections and a copy-friendly layout:

- File name: `change-pack-<ID or short title>-<YYYY-MM-DD>.html`
- Save it in the current site's default document library (or a library the user names)
- Include the source reference and the date the pack was created at the top

### Step 5 - Report back

Reply with a short summary: the classification, the key date, the file link, and the number of open questions.

## Example

**Input:** "Make a change pack for this" + pasted text of a post about a button moving in OneDrive for the web.

**Output (summary):**

- Classification: Notice
- Key date: rollout until early December
- Saved: `change-pack-mc1521617-2026-11-16.html`
- Open questions: 1 (what users should do in views where the button is removed)

## Limitations

- The skill doesn't read the Microsoft 365 Message Center directly. Paste the notice or store it in the site.
- It doesn't publish news, send email or post in Teams. A person reviews and publishes.
- Quality depends on the source. Vague notices produce more open questions, which is intended.
