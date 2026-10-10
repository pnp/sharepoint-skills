# Knowledge Readiness Advisor — Demo Content

Demo content for the ../ skill.

Use these fictional sample documents to set up a working Knowledge Management and Copilot Readiness assessment in SharePoint.

## What's included

The `sample-files/` folder contains six fictional Contoso business documents:

* `Employee Onboarding Guide.docx`
* `Expense Reimbursement Procedure.docx`
* `IT Support Contacts.docx`
* `Remote Work FAQ.docx`
* `Travel Policy - 2023.docx`
* `Travel Policy - Updated.docx`

The sample set intentionally combines well-governed content with knowledge-quality and governance issues.

### Employee Onboarding Guide

A well-structured onboarding guide that includes:

* Explicit ownership
* Version information
* Review dates
* Role responsibilities
* First-week, 30-day, and 90-day milestones
* Security and collaboration guidance

This document provides positive evidence for Currency, Clarity, Ownership, and AI Suitability.

### Expense Reimbursement Procedure

A structured financial procedure that includes:

* An accountable business team
* Review information
* Submission requirements
* Approval steps
* Receipt requirements
* Expense limits
* Retention guidance

Some instructions intentionally differ from the travel-policy content, allowing the skill to evaluate cross-document consistency.

### IT Support Contacts

A reference document containing:

* Service Desk contact details
* Network and application support contacts
* Security and emergency channels
* Mixed contact formats
* No clearly defined owner
* No visible review date
* Potentially outdated support information

This document tests Currency, Ownership, and AI Suitability.

### Remote Work FAQ

An employee-facing FAQ containing a combination of clear and ambiguous answers.

Some responses use expressions such as:

* "Generally"
* "May"
* "Depending on the situation"
* "Consult your leadership"

The document intentionally lacks clear ownership and lifecycle information, allowing the skill to evaluate Clarity, Ownership, and AI Suitability.

### Travel Policy - 2023

An older travel policy containing:

* Manual PDF request forms
* Booking through a partner agency
* Taxi-preferred local transportation
* A US$40 daily meal allowance
* A 15-calendar-day expense-submission deadline
* No clearly identified content owner
* No visible next-review date

The document remains available alongside a newer policy and is not explicitly marked as superseded.

### Travel Policy - Updated

A newer travel policy containing:

* Digital travel requests
* Booking through a corporate portal
* Approved mobility applications
* A US$75 daily meal allowance
* A five-business-day expense-submission deadline
* Explicit ownership
* Annual review requirements
* A future review date
* Change-history information

The differences between the two travel policies are intentional and allow the skill to identify conflicting guidance.

## Scenario design

The demo is designed to test whether the skill can identify:

* Older and newer policy versions available together
* Conflicting financial limits
* Conflicting expense-submission deadlines
* Different booking and transportation processes
* Potentially outdated operational contacts
* Missing content ownership
* Missing review controls
* Ambiguous employee guidance
* Strong governance signals in selected documents
* Conditions that could produce plausible but incorrect Copilot answers

All company names, scenarios, contacts, links, policies, and operational details in the demo must be treated as fictional.

## Setup

1. Create or open a SharePoint site where Copilot in SharePoint and SharePoint Skills are available.

2. Create or select a document library for the demonstration.

3. Upload all six files from the `sample-files/` folder to the same document library.

4. Keep the original file names so that the assessment can identify and compare the two travel-policy versions.

5. Open the site's **Agent Assets** library.

6. Open the **Skills** folder.

7. Upload the inner runtime package:

   ```text
   knowledge-readiness-advisor/
   └── SKILL.md
   ```

8. Confirm that the skill appears in the list of available SharePoint skills.

9. Open Copilot in the SharePoint site.

10. Run the primary assessment prompt:

    ```text
    Assess the knowledge readiness of this site.
    ```

The skill should automatically discover the relevant business documents. The user should not need to list the six file names.

## Portuguese test

To test multilingual behavior, run:

```text
Avalie a prontidão do conhecimento deste site e apresente o relatório em português do Brasil.
```

Document titles should remain in their original language while the assessment is produced in Portuguese.

## What to expect

The skill should:

* Include the six DOCX files in the assessment scope
* Exclude SharePoint pages, Agent Assets, skill files, images, and unrelated content
* Evaluate exactly six dimensions:
  1. Currency
  2. Clarity
  3. Consistency
  4. Findability
  5. Ownership
  6. AI Suitability
* Use visual traffic-light indicators
* Identify material document conflicts
* Generate evidence-based recommendations
* Generate Client Conversation Starters
* Disclose scope and assessment limitations
* Avoid numerical readiness scores or percentages

## Expected evidence

The assessment should normally detect the following evidence.

### Currency

* `Travel Policy - 2023.docx` remains accessible beside `Travel Policy - Updated.docx`
* `IT Support Contacts.docx` lacks a clear review date and contains potentially outdated information
* Newer documents include stronger review and lifecycle signals

### Clarity

* `Employee Onboarding Guide.docx`, `Expense Reimbursement Procedure.docx`, and `Travel Policy - Updated.docx` provide structured and actionable guidance
* `Remote Work FAQ.docx` contains conditional or ambiguous answers without complete decision criteria

### Consistency

The skill should identify conflicting travel guidance, including:

| Subject | Travel Policy - 2023 | Travel Policy - Updated |
| --- | --- | --- |
| Booking | Partner agency and PDF forms | Corporate portal and digital workflow |
| Local transportation | Taxi preferred | Approved mobility applications |
| Meal allowance | US$40 per day | US$75 per day |
| Expense submission | 15 calendar days | Five business days |

The skill should not decide which policy is authoritative unless the accessible evidence explicitly establishes authority.

### Findability

* Document titles are generally descriptive
* Both travel-policy versions appear relevant and potentially authoritative
* The older travel policy is not clearly marked as superseded or archived

### Ownership

* `Travel Policy - Updated.docx`, `Employee Onboarding Guide.docx`, and `Expense Reimbursement Procedure.docx` identify accountable teams
* `Remote Work FAQ.docx` and `IT Support Contacts.docx` lack clear ownership or lifecycle responsibility

### AI Suitability

The assessment should identify a risk that Copilot could provide:

* An obsolete meal allowance
* An incorrect expense-submission deadline
* The wrong booking process
* An outdated IT support contact
* An incomplete remote-work answer

## Expected overall outcome

Because the sample set contains material conflicts and potentially unreliable operational guidance, the overall readiness result will normally indicate a high-priority condition.

Exact indicators and wording may vary based on:

* Content successfully retrieved by the agent
* Available document metadata
* SharePoint indexing
* Changes made to the sample documents
* The language requested by the user

The assessment should remain evidence-based rather than forcing a predefined result.

## Expected priority recommendations

The skill should normally recommend actions such as:

1. Confirm the authoritative travel policy.
2. Mark or archive the superseded travel-policy version.
3. Validate and update IT support contacts.
4. Assign owners and review cadences to ungoverned content.
5. Clarify remote-work decision criteria and escalation paths.
6. Apply consistent status, version, owner, and review metadata.

Suggested owners should be expressed as accountable roles or teams rather than named individuals.

## Expected Client Conversation Starters

The skill should generate questions similar to:

* Which travel policy is the authoritative source?
* How should superseded policies be marked or archived?
* Who owns the IT support contact directory?
* What review cadence should apply to employee-facing FAQs?
* Which remote-work decisions require standardized criteria?
* How should Copilot distinguish current guidance from obsolete content?

Questions should be grounded in findings from the sample documents.

## Validation checklist

After running the demo, verify:

- [ ] The correct skill was activated.
- [ ] All six DOCX files were considered.
- [ ] SharePoint pages were excluded by default.
- [ ] Agent Assets and `SKILL.md` were excluded.
- [ ] Exactly six assessment dimensions were returned.
- [ ] The dimensions appeared in the required order.
- [ ] Traffic-light icons were used.
- [ ] No numerical readiness score was generated.
- [ ] Both travel policies were compared.
- [ ] Conflicting travel values and deadlines were identified.
- [ ] Missing ownership was identified.
- [ ] Potentially outdated IT contacts were identified.
- [ ] Ambiguous remote-work guidance was identified.
- [ ] Recommendations referenced observable evidence.
- [ ] Client Conversation Starters were connected to findings.
- [ ] Scope and limitations were included.

## Important demo-content guidance

Do not include:

* Credentials
* Secrets or access tokens
* Personal information
* Real customer information
* Confidential tenant information
* Proprietary documents
* Production links that should not be public

Use only the fictional files included with this demo or appropriately sanitized content.

## Cleanup

After testing:

1. Remove the fictional sample documents from the test library if they are no longer needed.
2. Remove the demo skill package from **Agent Assets > Skills** if the test site will be reused.
3. Do not use the fictional findings to support real organizational decisions.