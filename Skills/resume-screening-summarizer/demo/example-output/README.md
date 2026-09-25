# Example output — real Copilot run

This folder captures an actual Copilot in SharePoint run against the `sample-files/` demo set:

- `copilot-response-screenshot.png` — the chat reply Copilot returned after screening
- `Resume-Screening-Report-Front-End-Engineer.html` — the saved HTML report it generated

## A note on Marcus Johnson's tier

In this captured run, Copilot scored **Marcus Johnson as a Possible match (5 of 6 must-haves)**, crediting him for React/JavaScript/Git/degree despite his resume stating only 6 months of actual front-end work (recently transitioned from a backend role). The 3+ years must-have was evaluated against his total job tenure rather than the front-end-specific duration his own resume states.

`SKILL.md` has since been tightened (see Step 3 and the note in Step 4's scoring guidance) to explicitly require counting only the duration a resume attributes to the specific type of experience a must-have names, rather than a candidate's overall tenure. Re-running this same sample set is expected to score Marcus as a **Weak match (2 of 6)** instead — the case is kept in the demo set specifically because it exercises this instruction.

This folder is left as-is as a real, unedited example of the skill's output and as a regression case for that fix.
