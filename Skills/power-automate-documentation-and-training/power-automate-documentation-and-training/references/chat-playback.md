# Chat playback patterns

The goal of the playback is that the user sees their own flow described back to them, in plain words, before anything is generated. Keep it to about three turns: (1) one playback message covering trigger, every action, goal and audience, and guardrails, ending with one question; (2) one message with the masking table plus the gap questions; (3) a short confirm before generating. Never stop after the trigger or after a single part to ask for confirmation.

## Order

Turn 1 (one message): trigger, actions in run order (containers with inner steps indented), inferred goal and audience, guardrails spotted. End with: "Is anything wrong or missing? Correct any part by number."

Turn 2 (one message): masking table, then the gaps (whys, gotchas, quiz focus, test evidence). End with: "Approve the table and answer what you can; I'll use my drafts for anything you skip."

Turn 3: a one-line summary of what you will build, then generate.

## Patterns

**Opening (after reading the export)**

> I read your export: a legacy package with one cloud flow, "Name", 3 steps (1 trigger, 2 actions). Here is how I read it. Correct any part by number.

**Turn 1: the whole playback in one message**

**Trigger**

> **1. The trigger.** It starts when <event>, checking <how often>. <Split On / conditions in plain words>.

**Actions**

> **2. The actions, in order.**
> - **Step 2, <Action name>** (<Connector>): <what it does>, using <earlier output>.
> - **Step 3, <Action name>** (<Connector>): ...

For containers, say what repeats or branches, then list the inner steps underneath:

> - **Step 5, Apply to each request** (Control): runs the next 8 steps once per request.
>   - **Step 6, Is approved?** YES: steps 7 to 11. NO: steps 12 and 13.

**Goal and audience**

> **3. What I think it is for.** Goal: "<one sentence>". Audience: <who>.

**Guardrails**

> **4. Things that usually trip people up here.**
> 1. <setting> means <consequence>.
> 2. ...
>
> Is anything wrong or missing? Correct any part by number, and tell me anything you learned the hard way.

**Turn 2: masking and gaps in one message**

**Masking**

> **5. What I will hide.** Here is every real value I found, shortened so I never repeat it in full, and the made-up value I would use instead. Approve it, edit it, or add names to hide.

**Gaps**

> **6. A few things the export cannot tell me.**
> - Why <step> is there. My guess: "<draft>". Right?
> - Which two or three of the guardrails should become quick checks?
> - Do you have a test result to show (a count, or "it worked when...")? If not, the finish screen will list what the walkthrough covered.

**Before generating**

> Thanks. I will now build one HTML page with <N> steps, <G> guardrails, and <Q> quick checks, using the approved fictional values. Ready?

## Rules

- Never paste a real URL, email, ID, or key back into the chat. Use the redacted preview.
- Do not ask for anything the export already answers.
- If the user corrects a step, update the playback and repeat only the changed line.
- If the user skips a question, use your draft and mark it as a draft in the handoff file.
