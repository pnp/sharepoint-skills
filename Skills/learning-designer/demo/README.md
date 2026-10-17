# Learning Designer — Demo Content

Sample files for the [learning-designer](../) skill. This folder is for humans browsing GitHub. Do not upload `demo/` to SharePoint Skills.

## What's included

- `sample-files/learning-request-brief-template.docx` — the Learning Request Brief Word template with `{Field}` placeholders, for creating the Structured Document Generation form
- `sample-files/sample-learning-request-brief-custom-skills-powerpoint.docx` — a filled sample brief for the topic "Custom Skills in PowerPoint"

## Setup

1. Upload `learning-request-brief-template.docx` to a SharePoint document library and create a Document generation form from it.
2. Install the inner package `learning-designer/learning-designer/` into **Agent Assets → Skills**.
3. Submit the form, or upload the filled sample brief to the library.
4. Optionally, add an image named exactly `learning-visual.png` (or `learning-visual.jpg`) in the same folder as the brief.
5. Select the brief and ask Copilot: *"build the learning dashboard from this brief"*.

## What to expect

The skill produces one self-contained HTML learning dashboard that follows the layout of `learning-designer/references/test-output-custom-skills.html` (the bundled reference for the same topic), with the content of your brief and up to 3 stages.
