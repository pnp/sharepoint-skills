# The handoff file (content YAML or JSON)

The chat writes this file once the user has confirmed the playback, the masking table, and the gaps. The user never fills it in. Use it as your own checklist before filling the `DATA` block.

Step keys are the action names from the export (`Create_item`, not "Create item"). A key that is not in the export is an error, so the file can reword steps but never add them.

```yaml
draft: false                 # true while any answer is still the assistant's guess
goal: Every new episode lands as a clean list item in SharePoint.
audience: Makers who want to copy this flow.
quiz_focus: [one run per item, why the conversion exists]
test_evidence: none supplied # or a short sanitized summary

meta:
  title: "Build the flow: episodes into a SharePoint list"
  eyebrow: "Training module \u00b7 Power Automate"   # optional
  lede: Click + to add each step...                  # optional
  summaryHeading: You built the flow                 # optional
  summaryLead: Three steps ... Three guardrails keep it reliable.

parts:                       # optional groups for the "Whole flow" overview
  - {title: Get the episode, steps: [When_a_feed_item_is_published]}

steps:
  Create_item:
    title: Create item       # optional; defaults to the action name
    sub: "SharePoint \u00b7 Create item"   # optional second line on the node
    kicker: "SharePoint \u00b7 Create item" # optional card kicker
    what: One sentence.
    why: Two to four sentences linked to the previous step, the next step, and the goal.
    how:                     # optional; defaults to the inputs in the export
      - [Site Address, "`https://contoso-my.sharepoint.com/personal/alex_contoso_com`"]
      - [Title, "Trigger **Feed title** (`body/title`)"]
    tip: One line of advice.
    packet: plain text       # optional label that travels down the arrow into this step
    quiz:
      ask: You re-publish an episode. What happens?
      options:
        - {text: The item is updated, correct: false, feedback: Nothing looks for the existing item.}
        - {text: A second item is created, correct: true, feedback: A lookup on the link would prevent it.}
  Is_approved:               # conditions and switches
    arms: {yes: "YES \u00b7 approved", no: "NO \u00b7 not yet"}
  Wait_until_ready:          # Do until
    laps: ["state: Pending", "state: Pending", "state: Ready \u2713"]
  Apply_to_each_request:     # Apply to each
    counter: {label: requests, count: 12}
  By_priority__empty_default: # an empty arm (generated as "No action"); optional overrides
    why: Normal requests wait for approval.

guardrails:                  # numbered in flow order on the page
  - {title: One run per episode, text: Split On starts one run per feed item., step: When_a_feed_item_is_published}

checks:                      # the finish-screen checklist and doughnut
  title: What you covered    # use "Proven path in testing" only with real evidence
  center: covered
  caption: One slice per part of the walkthrough
  items:
    - {text: The trigger checks the feed every minute, done: true}
```

Text fields accept `**bold**` and `` `code` ``. Non-ASCII characters are fine in this file; escape them when writing the `DATA` block (see `data-schema.md`).
