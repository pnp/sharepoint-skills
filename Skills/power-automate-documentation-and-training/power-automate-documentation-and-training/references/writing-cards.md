# Writing the cards

Each step gets one card. Keep the order: what, then why, then how. Plain American English, short sentences, no em dashes.

## What (one sentence)

Say what the step does in the learner's words. "Turn the episode summary from HTML into plain text." Not "Executes the HtmlToText operation."

## Why (two to four sentences)

Link three things:

1. **The previous step:** what it handed over, or what is still missing. "The trigger gave us one episode, but its summary arrives as HTML."
2. **This step's reason:** the problem it solves. "If we saved that straight into the list, people would see the tags."
3. **The next step and the goal:** what this enables. "Next, the clean text goes into the new list item."

The trigger's why should state the goal of the whole flow. The step where the goal is reached should say so ("This is where the goal happens").

## How to configure

Rows of label and value that match what the maker sees in the designer. Use the masked values. Show the dynamic content name in bold and the expression in backticks: "Trigger **Feed title** (`body/title`)". Mention defaults only if changing them matters.

## Tip (optional)

One line of practical advice, often how to make the step safer.

## Quick check (on two or three guardrail steps)

- One question about a real consequence, not trivia.
- Two or three options; exactly one correct.
- Feedback on every option explains the reason. Do not start feedback with "Right" or "Correct"; the page adds that.
- The rest of the card stays hidden until the learner answers, and the + is locked until then.

## Finish screen

- Summary lead: the steps in one sentence, then the number of guardrails.
- Guardrails: a short title and one or two sentences each.
- Checklist: real test evidence if the user gave some ("Proven path in testing"), otherwise what the walkthrough covered.
