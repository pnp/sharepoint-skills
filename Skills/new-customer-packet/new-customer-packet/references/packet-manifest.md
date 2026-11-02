# Packet manifest: New Customer Package

Read this before building any package. It is the rulebook for what goes in a new customer's package and why. A business owner changes the packet by editing this file, not the skill. All companies and people in this demo are fictional.

## 1. What a complete package is

A package has a standard section, then one state section for each state the customer touches.

**Standard section**, in this order:
1. Welcome Letter
2. Coverage Summary
3. Privacy Notice
4. Billing and Payment Schedule
5. How to Report a Claim

**State sections**, home state first, then each other state in the order the application mentions it. Each section holds, in this order:
1. The state's Commercial Policy
2. The coverage forms for coverages the customer bought: Business Liability, Property
3. Workers' Compensation Notice of Coverage and Employee Rights Posting, if Workers' compensation was bought
4. Uninsured Motorist Coverage Election and Commercial Vehicle Schedule, if Commercial vehicles was bought
5. The state's Proof of Insurance Card, if Commercial vehicles was bought: one card per vehicle, in every state section. Two states and three vehicles means six cards: three for each state, each with its own vehicle.
6. The state's Policyholder Notice

State documents carry that state's seal in the header. Standard documents carry the Contoso Insurance logo.

**Where it goes:** fill each document with the customer's details, save them in a folder named after the business in the Packages library, and merge them into one PDF named `<Business name> - New Customer Package.pdf` in that folder. Copy that merged PDF to the root of the **Completed Packets** library and set its columns (Business name, Contact name, Contact email, Policy number, Policy start date, Home state, Application, Approval status) as `template-fields.md` says. Completed Packets holds only the merged PDFs, never working documents or folders.

## 2. Where the templates are and how to choose them

The templates are in the **Templates** library. Choose them by their columns, never by file name:

- Take a template if its **Scope** is Standard, or its **State** is one of the customer's states.
- And its **Coverage trigger** is blank, or is one of the coverages the customer bought.
- And its **Business type trigger** is blank, or matches the customer's type of business.
- Sort by **Packet order**: the standard section first, then the home state's section, then each other state's section.

## 3. How to read the application

Fill these New Customers columns from the application PDF:

| Application field | Column |
|---|---|
| Legal business name | Business name |
| Contact name | Contact name |
| Email | Contact email |
| The state in City, State, ZIP | Home state (two-letter code) |
| Type of business | Type of business |
| Coverage requested (the checked boxes) | Coverage |
| Employees | Employees |
| Vehicles | Vehicles |
| Requested policy start date | Policy start date |

Read the address, phone, vehicle schedule and the rest of the form directly from the PDF when filling the templates.

**Home state** is the state in the business address.

**Other states** come only from the "Additional information from the sales conversation" box. Write them in the Other states column as the state name followed by the quoted sentence. Resolve any city, job site or project named there to its state. Add that state if the customer will do business there, now or planned: a job, a route, a contract, events, a new or prospective location. A place mentioned for any other reason does not add a state. For each state you add, quote the exact sentence from the application, word for word.

## 4. Stop rules

- **Missing count.** Two counts, each tied to one coverage. Test each one in this order:
  1. Is the coverage ticked? Commercial vehicles for the Vehicles count; Workers' compensation for the Employees count.
  2. If the coverage is **not** ticked, the count is not required. "N/A", blank or anything else there is fine: it means none, and nothing is built or dropped because of it. Most applications in the set have "N/A" in one of the two counts for this reason.
  3. If the coverage **is** ticked, the count must be a whole number greater than zero. "N/A" or blank there is a missing value: build nothing, set Package status to Needs information, and say exactly which value is missing. Never guess or invent a value.

  A count on its own never stops a build; only the pair (coverage ticked, no number) does. Across the sample set exactly five applications stop on this rule.
- **State with no templates.** If the customer touches a state that has no templates in the library: build everything else, set Package status to Needs information, and say which state has no templates. Never use another state's form in its place.

## 5. Output: "Documents included and why"

One line per document, in package order:

`<Title> (<Form number>): <reason>`

The reason names what triggered the document: "Standard, every packet", the coverage bought, the home state, or the business type. For a document included because of another state, quote the application sentence word for word, the same quote as in Other states. For proof-of-insurance cards, say how many cards and why.

Example:

`Louisiana Commercial Policy (CI-POL-LA-01): Work in Louisiana: "Crew starts a three-month roofing job in Baton Rouge in March."`

## 6. Status

**Package status**, on the application in New Customers:

| Status | Set by | When |
|---|---|---|
| New | The library | A new application arrives |
| Needs information | This skill | A stop rule applies |
| Package ready | This skill | The merged PDF is in Completed Packets with its columns set, and its link is in Package link |

**Packet status**, on the merged PDF in Completed Packets:

| Status | Set by | When |
|---|---|---|
| Packet Complete | The build skill (new-customer-packet) | The merged PDF is copied to Completed Packets with its columns set |
| Customer Ready | The review skill (review-customer-packet) | A reviewer has checked the packet against the application and this manifest and replied "Confirm packet ready" |
| Customer Sent | The send skill (send-customer-packet) | The email with the view-only link has been delivered to the customer |

Approval status is a legacy column: the build skill still sets it to `Ready for approval`, and nothing reads it.

## 7. Change log

| Date | Who | Change |
|---|---|---|
| 2026-10-03 | Hassan Moses | First version: Texas, Florida and Louisiana; four coverages; five business types. |
| 2026-10-05 | Hassan Moses | Approval and sending move to the merged PDF in Completed Packets, which carries the customer's details; new Approval status. |
| 2026-10-11 | Hassan Moses | Proof of Insurance Cards are per state: each state section holds one card per vehicle, after the Commercial Vehicle Schedule. There is no Standard card. |
| 2026-10-11 | Hassan Moses | Section 6 describes Packet status (build, review, send skills) instead of the retired approval button. |
| 2026-10-11 | Hassan Moses | Missing count: "N/A" in a count that rates a requested coverage is a missing value, not a valid one. |
| 2026-10-12 | Hassan Moses | Missing count restated as a pair test: the coverage must be ticked before the count is required; "N/A" with the coverage unticked means none and builds. |
