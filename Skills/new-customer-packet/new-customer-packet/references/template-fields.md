# Template fields: how to fill the templates

Read this before filling any template. The templates in the **Templates** library hold placeholders in double braces, such as `{{business_name}}`. Replace every placeholder with the value from the customer's application PDF. All companies and people in this demo are fictional.

## Rules

- Replace the whole placeholder, braces included. A finished document contains no `{{` or `}}`.
- Copy values exactly as the application shows them: names, numbers, limits and dates. Do not reformat, round or reword them.
- Never invent a value. If a template the package needs has a placeholder whose value is not on the application, stop: build nothing, set Package status to Needs information, and say which value is missing and for which document.
- Keep everything else in the template as it is, including the headers, seals, footers and disclaimer.

## Where each value is on the application

| Placeholder | Where on the application |
|---|---|
| `{{business_name}}` | Business information: Legal business name |
| `{{street_address}}` | Business information: Street address |
| `{{city}}`, `{{state}}`, `{{zip_code}}` | Business information: City, State, ZIP (`{{state}}` is the two-letter code of the business address, on every document: a Texas document for a Florida business still shows the Florida address) |
| `{{contact_name}}` | Contact: Contact name |
| `{{contact_email}}` | Contact: Email (not in any template; it goes on the completed packet's Contact email column) |
| `{{employee_count}}` | Business profile: Employees |
| `{{vehicle_count}}` | Business profile: Vehicles |
| `{{policy_number}}` | Quoted terms: Policy number |
| `{{policy_start_date}}` | Quoted terms: Policy period, the first date (the same date as "Requested policy start date") |
| `{{policy_end_date}}` | Quoted terms: Policy period, the second date |
| `{{liability_limit}}` | Quoted terms: Liability limit |
| `{{property_limit}}` | Quoted terms: Property limit |
| `{{wc_limit}}` | Quoted terms: Workers' compensation limit |
| `{{annual_premium}}` | Quoted terms: Annual premium |
| `{{billing_frequency}}` | Quoted terms: Billing frequency |
| `{{salesperson_name}}` | Producer of record: Producer |
| `{{underwriter_name}}` | Producer of record: Underwriter |
| `{{customer_signature}}` | Certification: Signature (for example "/s/ Janet Jennings") |
| `{{signature_date}}` | Certification: Date |
| `{{vehicle.year}}`, `{{vehicle.make}}`, `{{vehicle.model}}`, `{{vehicle.vin}}` | Vehicle schedule (page 2): the one vehicle a Proof of Insurance Card is for. "Test VIN" is the VIN. |
| `{{vehicle1.year}}` … `{{vehicle12.vin}}` | Vehicle schedule (page 2), in the Commercial Vehicle Schedule only: row N takes vehicle N in the application's order. Rows past the last vehicle are blanked: replace each of their placeholders with nothing. |

A value of "N/A" on the application means the coverage was not bought. It is a valid value: copy it exactly. The manifest never selects a coverage form for a coverage not bought, but documents that list every coverage (the Coverage Summary, each state's Policy) show "N/A" in that coverage's row. Never treat "N/A" as a missing value, with one exception: a count whose coverage is ticked (Vehicles when Commercial vehicles is ticked, Employees when Workers' compensation is ticked). Only there is "N/A" a missing value, and the manifest's stop rule applies. If the coverage is not ticked, "N/A" in that count means none and the build goes ahead.

## Completed packet columns

The merged PDF in **Completed Packets** carries the customer's details as columns, so the approval and the share step can use them without opening the application. Fill them with the same values used for the placeholders:

| Completed Packets column | Value |
|---|---|
| Business name | `{{business_name}}` |
| Contact name | `{{contact_name}}` |
| Contact email | `{{contact_email}}` |
| Policy number | `{{policy_number}}` |
| Policy start date | `{{policy_start_date}}` |
| Home state | `{{state}}` |
| Application | A link to the application PDF in New Customers |
| Approval status | `Ready for approval` |

## Vehicles

- **Proof of Insurance Card** (one per state section): make one filled copy per vehicle on the vehicle schedule, each with that vehicle's year, make, model and VIN. Five vehicles means five cards in each state section; a card from a second state is correct, not a duplicate.
- **Commercial Vehicle Schedule** (one per state section): the table has 12 numbered vehicle rows, `{{vehicle1.*}}` to `{{vehicle12.*}}`. Fill row N with vehicle N in the application's order; replace the placeholders of every unused row with nothing, so the row is empty. Never add, copy or delete rows.
- The number of vehicles listed must equal the Vehicles count on the application. If they differ, stop and set Package status to Needs information.
