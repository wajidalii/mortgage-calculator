# User Stories: Mortgage Ownership Calculator

Source: PRD.md, section 7. Version 0.2. Date: 2026-10-31.

Each story has a status of **Implemented** or **Not implemented**. A story is marked Implemented only after its acceptance criteria were checked against the running app (see "Verification" at the end). Money in examples is shown in dollars. The product stores cents (decision D-4). Rates are stored as integer millionths (decision D-5).

## How to read this file

- Each story sentence names one role. The **Roles** field lists every role the story serves.

- "Serves" links the story to a job in jobs-to-be-done.md.
- "Roles" links the story to a role in app-roles.md.
- Each acceptance criterion uses the Given, When, Then format.
- Numbers in the criteria are test values. They come from the golden cases in PRD.md, section 12.

## Release plan

Each release ships only after the release before it passes all tests. If the schedule slips, drop the latest release first.

| Release         | Content                                                                                                                   | Stories      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------ |
| R1 Core         | Fixed loan, tax, insurance, PMI, HOA, itemized total, amortization, 5/6 ARM, assumptions panel, validation, mobile layout | S-1 to S-10  |
| R2 Buyer        | Closing costs, cash to close, simplified affordability                                                                    | S-11, S-12   |
| R3 Owner        | Extra payments, refinance break-even, rate sensitivity, cost growth                                                       | S-13 to S-16 |
| R4 Professional | Comparison, saved scenarios, print report                                                                                 | S-17 to S-19 |

## R1 Core

### S-1 Enter purchase and loan inputs

**Serves:** J-1, J-2, J-3. **Roles:** AR-1, AR-2, AR-3. **Status:** Implemented.

"As a First-Time Buyer, I want to enter the home price, down payment, loan term, and interest rate, so that I can see the loan amount and the loan-to-value (LTV) ratio."

- Given price $500,000 and down payment 20%, when I view the result, then the loan amount is $400,000 and the LTV is 80.00%.
- Given I change the down payment from a percent to a dollar amount, when I leave the field, then the other form of the value updates to match.
- Given the down payment is 100%, when I view the result, then the loan amount is $0 and the principal and interest is $0.

### S-2 See the fixed monthly principal and interest

**Serves:** J-1, J-2, J-3. **Roles:** AR-1, AR-2, AR-3. **Status:** Implemented.

"As a First-Time Buyer, I want to see the monthly principal and interest for a fixed loan, so that I know the core payment."

- Given loan $400,000, rate 6.50%, and term 30 years, when I calculate, then principal and interest is $2,528.27.
- Given the same loan with a 20 year term, when I calculate, then principal and interest is $2,982.29.
- Given the same loan with a 15 year term, when I calculate, then principal and interest is $3,484.43.
- Given the rate is 0%, when I calculate, then principal and interest is the loan amount divided by the number of payments, rounded to cents.

### S-3 Estimate property tax by state

**Serves:** J-1, J-4. **Roles:** AR-1, AR-2, AR-3. **Status:** Implemented.

"As a First-Time Buyer, I want to pick a state and see an estimated property tax, so that I do not need to look it up first."

- Given price $500,000 and state NJ, when I view the result, then the annual tax is $10,000.00 and the monthly tax is $833.33.
- Given price $500,000 and state TX, when I view the result, then the annual tax is $8,000.00 and the monthly tax is $666.67.
- Given I enter my own annual tax, when I leave the field, then the product uses my value and shows the label "Manual override".
- Given I clear the override, when I leave the field, then the product returns to the state demo rate.
- Given any state is selected, when the tax shows, then the label "Illustrative estimate" is next to it.

### S-4 Enter insurance, HOA, and other monthly costs

**Serves:** J-1, J-4. **Roles:** AR-1, AR-2, AR-3. **Status:** Implemented.

"As a First-Time Buyer, I want to enter insurance, HOA, and other monthly costs, so that the total includes them."

- Given annual insurance $1,800, when I view the result, then monthly insurance is $150.00.
- Given monthly HOA $100, when I view the result, then HOA is $100.00 and it appears in the non-escrow group.
- Given I leave insurance empty, when I view the result, then the product uses the national default ($2,400 per year) and shows the label "Illustrative estimate".
- Given I enter a negative value, when I leave the field, then I see an error and the value is not used.

### S-5 See PMI and when it ends

**Serves:** J-1, J-4. **Roles:** AR-1, AR-2, AR-3. **Status:** Implemented.

"As a First-Time Buyer, I want to see an estimate of PMI and when it ends, so that I know how long I pay it."

- Given price $500,000 and down payment 10%, when I view the result, then the LTV is 90.00% and PMI is on.
- Given the PMI rate 0.50% and loan $450,000, when I view the result, then monthly PMI is $187.50.
- Given price $500,000, down payment 10%, rate 6.50%, and term 30 years, when I view the schedule, then PMI ends in month 109, which is the first month the scheduled balance is at or below 78% of the home price ($390,000).
- Given the same loan, when I view the result, then the product also shows month 95 as the first month the owner can request removal (80% of the home price).
- Given the LTV is exactly 80.00%, when I view the result, then PMI is off.

### S-6 See one itemized monthly estimate

**Serves:** J-1, J-4. **Roles:** AR-1, AR-2, AR-3. **Status:** Implemented.

"As a First-Time Buyer, I want one itemized monthly estimate, so that I can see what I pay the lender and what I pay elsewhere."

- Given price $500,000, down payment 20%, rate 6.50%, term 30 years, state NJ, annual insurance $1,800, and HOA $100, when I view the result, then I see principal and interest $2,528.27, tax $833.33, insurance $150.00, a lender payment of $3,511.60, HOA $100.00 (non-escrow), and a total of $3,611.60.
- Given any inputs, when the result shows, then the line items add up to the total shown.
- Given PMI is on, when the result shows, then PMI is in the lender payment group.

### S-7 See the amortization schedule

**Serves:** J-1, J-2, J-3. **Roles:** AR-1, AR-2, AR-3. **Status:** Implemented.

"As a Homeowner, I want a month-by-month amortization schedule, so that I can see interest, principal, and balance over time."

- Given loan $400,000, rate 6.50%, and term 30 years, when I view the schedule, then the lifetime interest is $510,179.81 and the final balance is $0.00.
- Given any fixed loan, when the schedule shows, then the principal paid over the term equals the original loan amount.
- Given I choose the yearly view, when the schedule shows, then each row shows the sum of its 12 months.
- Given tax, insurance, PMI, or HOA, when the schedule shows, then none of them reduce the principal balance.

### S-8 See a 5/6 ARM with true payment recalculation

**Serves:** J-1, J-2, J-3. **Roles:** AR-1, AR-2, AR-3. **Status:** Implemented.

"As a First-Time Buyer, I want to see a 5/6 ARM with a true payment recalculation, so that I understand the risk after the fixed period."

- Given loan $400,000, start rate 6.50%, margin 2.75%, caps 2/1/5, and a flat index of 3.75%, when I view the schedule, then the rate stays 6.50% and the payment stays $2,528.27.
- Given the same loan and an index of 9.00% from month 61, when I view the schedule, then the rates after each reset are 8.50%, 9.50%, 10.50%, then 11.50%, and the first reset payment is $3,015.13.
- Given the same loan and an index of 0.50% from month 61, when I view the schedule, then the rates after each reset are 4.50%, 3.50%, then 3.25%, and the rate never goes below the floor.
- Given a reset, when the product calculates the new payment, then it uses the current balance and the remaining months.
- Given any month after month 60, when the row shows, then the row has the label "Hypothetical rate".

### S-9 See all assumptions in one place

**Serves:** J-4. **Roles:** AR-1, AR-2, AR-3. **Status:** Implemented.

"As a First-Time Buyer, I want to see all assumptions in one place, so that I know what is real input and what is illustrative."

- Given I open the assumptions panel, when it shows, then it lists every default, its value, and whether it is "Entered", "Illustrative", or "Overridden".
- Given any result screen, when it shows, then the disclaimer text is visible without a click.
- Given a default value, when it shows in the assumptions panel, then the "as of" date and the source name show next to it. Example: "Insurance $2,400 per year. Illustrative. As of 2026-10-30. Source: national averages from four public sources."
- Given the "as of" date of a default is more than 365 days before today, when the panel or the result shows, then the label "May be out of date" shows next to the value.
- Given a printed report, when it prints, then it lists every default used, with its "as of" date.
- Given the user overrides a default, when the panel shows, then the "as of" date is hidden for that value and the label "Overridden" shows.

### S-10 Get clear input checks

**Serves:** J-1, J-2, J-3. **Roles:** AR-1, AR-2, AR-3. **Status:** Implemented.

"As a Homeowner, I want clear input checks, so that I do not get a wrong result without a warning."

- Given I enter an interest rate above 30% or below 0%, when I leave the field, then I see an error and no result shows.
- Given I enter a down payment greater than the price, when I leave the field, then I see the message "Down payment cannot be more than the price".
- Given I enter text in a money field, when I leave the field, then I see an error and the last valid result stays.
- Given a phone screen width of 360 px, when the page loads, then all inputs and results are usable without sideways scrolling.

## R2 Buyer

### S-11 See closing costs and cash to close

**Serves:** J-1. **Roles:** AR-1. **Status:** Implemented.

"As a First-Time Buyer, I want to enter closing costs and see the cash to close, so that I know how much money I need on closing day."

- Given down payment $100,000 and closing costs of $12,000, when I view the result, then cash to close is $112,000.00.
- Given I enter closing costs as a percent of the price, when I leave the field, then the dollar value shows next to it.
- Given any closing cost line, when the result shows, then the lines add up to the closing cost total.

### S-12 Check simplified affordability

**Serves:** J-1. **Roles:** AR-1. **Status:** Implemented.

"As a First-Time Buyer, I want a simple affordability check, so that I know if the payment is in a normal range."

- Given gross monthly income $10,000, housing payment $3,000, and other monthly debt $500, when I view the result, then the front-end ratio is 30.0% and the back-end ratio is 35.0%.
- Given a ratio is above its threshold, when the result shows, then the product marks it as "Above guideline".
- Given the affordability section, when I open it, then the default limits are 28% (front-end) and 36% (back-end), and I can edit them.
- Given any affordability result, when it shows, then the product states that it is not a loan approval.

## R3 Owner

### S-13 Add extra payments

**Serves:** J-2. **Roles:** AR-2. **Status:** Implemented.

"As a Homeowner, I want to add extra payments, so that I can see the payoff date and interest saved."

- Given loan $400,000, rate 6.50%, term 30 years, and an extra payment of $200 each month, when I view the result, then the loan is paid off in month 293 and the interest saved is $111,892.52.
- Given I enter a one-time lump sum, when I choose the month, then the schedule applies it to principal in that month.
- Given an extra payment is larger than the remaining balance, when the schedule shows, then the last payment pays only the remaining balance.

### S-14 See the refinance break-even

**Serves:** J-2. **Roles:** AR-2. **Status:** Implemented.

"As a Homeowner, I want a refinance break-even, so that I know how many months it takes to recover the cost."

- Given balance $300,000, 300 months left, current rate 7.50%, new rate 6.50%, and refinance costs $6,000, when I view the result, then the monthly saving is $191.35 and the break-even is 32 months.
- Given the new payment is not lower than the current payment, when the result shows, then the product shows "No monthly saving" and no break-even.
- Given any break-even result, when it shows, then the product states that the new term equals the remaining term.

### S-15 See rate sensitivity

**Serves:** J-1, J-2, J-3. **Roles:** AR-1, AR-2, AR-3. **Status:** Implemented.

"As a Homeowner, I want to see how the payment changes with the rate, so that I can judge rate risk."

- Given loan $400,000 and term 30 years, when I view rate sensitivity for 6.50%, then I see payments for 5.50%, 6.00%, 6.50%, 7.00%, and 7.50%.
- Given the step size is 0.50 points, when I change the base rate, then the five rows move with it.

### S-16 Set yearly growth for tax and insurance

**Serves:** J-1, J-2. **Roles:** AR-1, AR-2. **Status:** Implemented.

"As a First-Time Buyer, I want to set yearly growth for tax and insurance, so that I see how the cost can rise."

- Given tax growth 3% and year 1 monthly tax $833.33, when I view the yearly summary, then year 2 tax is based on $858.33 per month.
- Given growth is 0%, when I view the yearly summary, then tax and insurance stay the same each year.
- Given growth is applied, when the result shows, then it is labeled "Assumption".

## R4 Professional

### S-17 Compare two loans side by side

**Serves:** J-3. **Roles:** AR-3. **Status:** Implemented.

"As a Professional, I want to compare two loans side by side, so that I can show the tradeoff."

- Given a 15 year fixed loan and a 30 year fixed loan on $400,000 at 6.50%, when I view the comparison, then I see monthly payments of $3,484.43 and $2,528.27, and lifetime interest of $227,197.24 and $510,179.81.
- Given a fixed loan and a 5/6 ARM, when I view the comparison, then the ARM column carries the "Hypothetical rate" label.
- Given I change one input in Loan A, when the page updates, then only that loan's column and the differences summary recalculate, and the other loan's inputs and results do not change.

### S-18 Save and reopen scenarios

**Serves:** J-1, J-2, J-3. **Roles:** AR-1, AR-2, AR-3. **Status:** Implemented.

"As a Homeowner, I want to save and reopen scenarios in my browser, so that I do not enter data again."

- Given I save a scenario with a name, when I reload the page, then the scenario is in my list and opens with the same inputs.
- Given browser storage is blocked, when I save, then I see a message that saving is not available and the calculator still works.
- Given I delete a scenario, when I confirm, then it is removed from the list.
- Given saved data, when it is stored, then it stays on the device and is never sent to a server.

### S-19 Print a report

**Serves:** J-3, J-4. **Roles:** AR-3. **Status:** Implemented.

"As a Professional, I want a print-friendly report, so that I can give it to a client."

- Given a result, when I choose Print, then the page shows inputs, the itemized estimate, the schedule summary, the assumptions list, and the disclaimer.
- Given the print view, when it shows, then the navigation and input controls are hidden.
- Given any printed page, when I check it, then the disclaimer text is present.

## Story map

| Story | Release | Serves        | Roles            |
| ----- | ------- | ------------- | ---------------- |
| S-1   | R1      | J-1, J-2, J-3 | AR-1, AR-2, AR-3 |
| S-2   | R1      | J-1, J-2, J-3 | AR-1, AR-2, AR-3 |
| S-3   | R1      | J-1, J-4      | AR-1, AR-2, AR-3 |
| S-4   | R1      | J-1, J-4      | AR-1, AR-2, AR-3 |
| S-5   | R1      | J-1, J-4      | AR-1, AR-2, AR-3 |
| S-6   | R1      | J-1, J-4      | AR-1, AR-2, AR-3 |
| S-7   | R1      | J-1, J-2, J-3 | AR-1, AR-2, AR-3 |
| S-8   | R1      | J-1, J-2, J-3 | AR-1, AR-2, AR-3 |
| S-9   | R1      | J-4           | AR-1, AR-2, AR-3 |
| S-10  | R1      | J-1, J-2, J-3 | AR-1, AR-2, AR-3 |
| S-11  | R2      | J-1           | AR-1             |
| S-12  | R2      | J-1           | AR-1             |
| S-13  | R3      | J-2           | AR-2             |
| S-14  | R3      | J-2           | AR-2             |
| S-15  | R3      | J-1, J-2, J-3 | AR-1, AR-2, AR-3 |
| S-16  | R3      | J-1, J-2      | AR-1, AR-2       |
| S-17  | R4      | J-3           | AR-3             |
| S-18  | R4      | J-1, J-2, J-3 | AR-1, AR-2, AR-3 |
| S-19  | R4      | J-3, J-4      | AR-3             |

## Open items

- Known gap: S-5 and S-12 examples are checked by unit tests with the exact values; in the browser the same logic was checked with the app's own derived housing payment.
- Q-1 (business model) is not decided. R4 stays as written. See PRD.md, section 13.
- Q-4 (ARM caps and margin) and Q-5 (demo tax rates) are not verified. They affect S-8 and S-3.
- T-1: replace the PMI default before launch. It affects S-5.

## Verification

Checked on 2026-10-31 in Chromium (Playwright) against the running dev server, with a fresh browser profile, and against the automated tests (`yarn test`, 460 passing).

- S-1 to S-4, S-6, S-7, S-11, S-13 to S-16: every example value was entered in the browser and matched.
- S-5: month 95 (removal request) and month 109 (PMI ends) match for a 10% down payment. The $187.50 figure at a 0.50% PMI rate is covered by `pmi.test.ts` and `LoanCalculator.test.tsx`.
- S-8: with the shock index path, month 61 shows 8.50%, $3,015.13 and the "Hypothetical rate" label.
- S-9: assumptions panel, defaults labels and the printed assumptions list were seen. The 365-day "May be out of date" rule is covered by `AssumptionsPanel.test.tsx` (the dates in the app are all newer than 365 days today).
- S-10: errors for a rate above 30% or below 0%, a down payment above the price and text in a money field were seen; no horizontal scroll at 360 px.
- S-12: front-end and back-end ratios, "Above guideline" and the "not a loan approval" statement were seen.
- S-17: Loan B kept its inputs when Loan A changed. This replaces the earlier "both columns update" wording, which no longer matches the side-by-side workspace.
- S-18: save, reload, open, delete with confirmation, and the "Saving is not available in this browser" message with storage blocked.
- S-19: with print media emulated, the report shows the disclaimer and the assumptions with "as of" dates.
