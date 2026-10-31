# Product Requirements Document: Mortgage Ownership Calculator

Version 0.1 (draft). Date: 2026-10-30. Status: for review.

## 1. Purpose

This product is a web calculator for U.S. home buyers and owners. It does more than compute a loan payment. The user selects a state, enters purchase and loan data, and chooses a fixed-rate or adjustable-rate loan. The product then shows an itemized monthly ownership estimate, upfront costs, an amortization schedule, and loan comparisons.

All results are estimates. The product must always show which inputs are illustrative.

## 2. Scope

### 2.1 In scope

- Fixed-rate loans with 15, 20, and 30 year terms.
- One adjustable-rate mortgage (ARM): the 5/6 SOFR ARM.
- Five demo state tax profiles with a manual override.
- Homeowners insurance, HOA, other costs, and simple conventional PMI.
- Amortization schedule and lifetime interest.
- Closing costs and cash to close.
- Extra payments, refinance break-even, rate sensitivity, and cost growth.
- Simplified affordability (DTI).
- Side-by-side comparison, saved scenarios in the browser, and a print report.

### 2.2 Out of scope for this version

- ZIP code or address lookup of tax rates, assessments, and exemptions.
- State and local recording or transfer taxes.
- Agent and lender fees.
- Automatic risk premiums for flood, wind, wildfire, or earthquake cover.
- FHA, VA, and jumbo loan rules.
- User accounts and server storage.
- Real lender quotes. The product must never present a result as a quote.

## 3. Product decisions

| ID  | Decision                                                             | Reason                                                                     |
| --- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| D-1 | One product serves three user roles.                                 | Product owner decision.                                                    |
| D-2 | The sample tax profile stays as a state-level demo table.            | Product owner decision. It is a known limit and has a future upgrade path. |
| D-3 | The ARM is a 5/6 SOFR ARM. The 5/1 ARM is not built.                 | The 5/1 structure is legacy. New ARMs mostly adjust every 6 months.        |
| D-4 | All money is stored as integer cents.                                | Avoids floating-point error in sums.                                       |
| D-5 | All rates are stored as integer millionths. 6.5% is stored as 65000. | Makes interest rounding exact.                                             |
| D-6 | The product is built in JavaScript.                                  | Technical constraint.                                                      |

## 4. App roles

- **First-Time Buyer.** A person who plans to buy a home for the first time. They can enter purchase data, see the monthly cost, see cash to close, and check affordability. They can save their own scenarios. They must never see a result that is presented as an approved loan or a guaranteed price.
- **Homeowner.** A person who owns a home and thinks about refinancing or paying extra. They can enter their current loan data, test extra payments, and test a refinance. They must never see a refinance result without the stated cost and term assumptions.
- **Professional.** A real-estate or mortgage professional who shows tradeoffs to a client. They can compare loans side by side, save scenarios, and print a report. They must never be shown, or be able to print, a report that hides the disclaimers or the list of illustrative inputs.

## 5. Jobs

- **J-1 (First-Time Buyer).** "When I plan to buy my first home, I want to know the full monthly cost and the cash I need, so I can decide what price I can afford."
- **J-2 (Homeowner).** "When I think about refinancing or paying extra, I want to see the savings and the break-even point, so I can decide if the change is worth it."
- **J-3 (Professional).** "When I advise a client, I want to show the tradeoffs between loans side by side, so the client can decide with clear numbers."
- **J-4 (All roles).** "When I see a number, I want to know which inputs are estimates, so I can trust it or correct it."

## 6. Release plan

Each release ships only after the release before it passes all tests. If the schedule slips, drop the latest release first.

| Release         | Content                                                                                                                   | Stories      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------ |
| R1 Core         | Fixed loan, tax, insurance, PMI, HOA, itemized total, amortization, 5/6 ARM, assumptions panel, validation, mobile layout | S-1 to S-10  |
| R2 Buyer        | Closing costs, cash to close, simplified affordability                                                                    | S-11, S-12   |
| R3 Owner        | Extra payments, refinance break-even, rate sensitivity, cost growth                                                       | S-13 to S-16 |
| R4 Professional | Comparison, saved scenarios, print report                                                                                 | S-17 to S-19 |

## 7. User stories

All story statuses are "Planned". Money in examples is shown in dollars. The product stores cents.

### 7.1 R1 Core

**S-1 (serves J-1, J-2, J-3).** "As a user, I want to enter the home price, down payment, loan term, and interest rate, so that I can see the loan amount and the loan-to-value (LTV) ratio."

- Given price $500,000 and down payment 20%, when I view the result, then the loan amount is $400,000 and the LTV is 80.00%.
- Given I change the down payment from a percent to a dollar amount, when I leave the field, then the other form of the value updates to match.
- Given the down payment is 100%, when I view the result, then the loan amount is $0 and the principal and interest is $0.

**S-2 (serves J-1, J-2, J-3).** "As a user, I want to see the monthly principal and interest for a fixed loan, so that I know the core payment."

- Given loan $400,000, rate 6.50%, and term 30 years, when I calculate, then principal and interest is $2,528.27.
- Given the same loan with a 20 year term, when I calculate, then principal and interest is $2,982.29.
- Given the same loan with a 15 year term, when I calculate, then principal and interest is $3,484.43.
- Given the rate is 0%, when I calculate, then principal and interest is the loan amount divided by the number of payments, rounded to cents.

**S-3 (serves J-1, J-4).** "As a user, I want to pick a state and see an estimated property tax, so that I do not need to look it up first."

- Given price $500,000 and state NJ, when I view the result, then the annual tax is $10,000.00 and the monthly tax is $833.33.
- Given price $500,000 and state TX, when I view the result, then the annual tax is $8,000.00 and the monthly tax is $666.67.
- Given I enter my own annual tax, when I leave the field, then the product uses my value and shows the label "Manual override".
- Given I clear the override, when I leave the field, then the product returns to the state demo rate.
- Given any state is selected, when the tax shows, then the label "Illustrative estimate" is next to it.

**S-4 (serves J-1, J-4).** "As a user, I want to enter insurance, HOA, and other monthly costs, so that the total includes them."

- Given annual insurance $1,800, when I view the result, then monthly insurance is $150.00.
- Given monthly HOA $100, when I view the result, then HOA is $100.00 and it appears in the non-escrow group.
- Given I leave insurance empty, when I view the result, then the product uses the national default and shows the label "Illustrative estimate".
- Given I enter a negative value, when I leave the field, then I see an error and the value is not used.

**S-5 (serves J-1).** "As a user, I want to see an estimate of PMI and when it ends, so that I know how long I pay it."

- Given price $500,000 and down payment 10%, when I view the result, then the LTV is 90.00% and PMI is on.
- Given the PMI rate 0.50% and loan $450,000, when I view the result, then monthly PMI is $187.50.
- Given price $500,000, down payment 10%, rate 6.50%, and term 30 years, when I view the schedule, then PMI ends in month 109, which is the first month the scheduled balance is at or below 78% of the home price ($390,000).
- Given the same loan, when I view the result, then the product also shows month 95 as the first month the owner can request removal (80% of the home price).
- Given the LTV is exactly 80.00%, when I view the result, then PMI is off.

**S-6 (serves J-1, J-4).** "As a user, I want one itemized monthly estimate, so that I can see what I pay the lender and what I pay elsewhere."

- Given price $500,000, down payment 20%, rate 6.50%, term 30 years, state NJ, annual insurance $1,800, and HOA $100, when I view the result, then I see principal and interest $2,528.27, tax $833.33, insurance $150.00, a lender payment of $3,511.60, HOA $100.00 (non-escrow), and a total of $3,611.60.
- Given any inputs, when the result shows, then the line items add up to the total shown.
- Given PMI is on, when the result shows, then PMI is in the lender payment group.

**S-7 (serves J-1, J-2, J-3).** "As a user, I want a month-by-month amortization schedule, so that I can see interest, principal, and balance over time."

- Given loan $400,000, rate 6.50%, and term 30 years, when I view the schedule, then the lifetime interest is $510,179.81 and the final balance is $0.00.
- Given any fixed loan, when the schedule shows, then the principal paid over the term equals the original loan amount.
- Given I choose the yearly view, when the schedule shows, then each row shows the sum of its 12 months.
- Given tax, insurance, PMI, or HOA, when the schedule shows, then none of them reduce the principal balance.

**S-8 (serves J-1, J-2, J-3).** "As a user, I want to see a 5/6 ARM with a true payment recalculation, so that I understand the risk after the fixed period."

- Given loan $400,000, start rate 6.50%, margin 2.75%, caps 2/1/5, and a flat index of 3.75%, when I view the schedule, then the rate stays 6.50% and the payment stays $2,528.27.
- Given the same loan and an index of 9.00% from month 61, when I view the schedule, then the rates after each reset are 8.50%, 9.50%, 10.50%, then 11.50%, and the first reset payment is $3,015.13.
- Given the same loan and an index of 0.50% from month 61, when I view the schedule, then the rates after each reset are 4.50%, 3.50%, then 3.25%, and the rate never goes below the floor.
- Given a reset, when the product calculates the new payment, then it uses the current balance and the remaining months.
- Given any month after month 60, when the row shows, then the row has the label "Hypothetical rate".

**S-9 (serves J-4).** "As a user, I want to see all assumptions in one place, so that I know what is real input and what is illustrative."

- Given I open the assumptions panel, when it shows, then it lists every default, its value, and whether it is "Entered", "Illustrative", or "Overridden".
- Given any result screen, when it shows, then the disclaimer text is visible without a click.
- Given a default value, when it shows in the assumptions panel, then the "as of" date and the source name show next to it. Example: "Insurance $2,400 per year. Illustrative. As of 2026-10-30. Source: national averages from four public sources."
- Given the "as of" date of a default is more than 365 days before today, when the panel or the result shows, then the label "May be out of date" shows next to the value.
- Given a printed report, when it prints, then it lists every default used, with its "as of" date.
- Given the user overrides a default, when the panel shows, then the "as of" date is hidden for that value and the label "Overridden" shows.

**S-10 (serves J-1, J-2, J-3).** "As a user, I want clear input checks, so that I do not get a wrong result without a warning."

- Given I enter an interest rate above 30% or below 0%, when I leave the field, then I see an error and no result shows.
- Given I enter a down payment greater than the price, when I leave the field, then I see the message "Down payment cannot be more than the price".
- Given I enter text in a money field, when I leave the field, then I see an error and the last valid result stays.
- Given a phone screen width of 360 px, when the page loads, then all inputs and results are usable without sideways scrolling.

### 7.2 R2 Buyer

**S-11 (serves J-1).** "As a First-Time Buyer, I want to enter closing costs and see the cash to close, so that I know how much money I need on closing day."

- Given down payment $100,000 and closing costs of $12,000, when I view the result, then cash to close is $112,000.00.
- Given I enter closing costs as a percent of the price, when I leave the field, then the dollar value shows next to it.
- Given any closing cost line, when the result shows, then the lines add up to the closing cost total.

**S-12 (serves J-1).** "As a First-Time Buyer, I want a simple affordability check, so that I know if the payment is in a normal range."

- Given gross monthly income $10,000, housing payment $3,000, and other monthly debt $500, when I view the result, then the front-end ratio is 30.0% and the back-end ratio is 35.0%.
- Given a ratio is above its threshold, when the result shows, then the product marks it as "Above guideline".
- Given the thresholds, when I open the assumptions panel, then the defaults are 28% (front-end) and 36% (back-end), and I can edit them.
- Given any affordability result, when it shows, then the product states that it is not a loan approval.

### 7.3 R3 Owner

**S-13 (serves J-2).** "As a Homeowner, I want to add extra payments, so that I can see the payoff date and interest saved."

- Given loan $400,000, rate 6.50%, term 30 years, and an extra payment of $200 each month, when I view the result, then the loan is paid off in month 293 and the interest saved is $111,892.52.
- Given I enter a one-time lump sum, when I choose the month, then the schedule applies it to principal in that month.
- Given an extra payment is larger than the remaining balance, when the schedule shows, then the last payment pays only the remaining balance.

**S-14 (serves J-2).** "As a Homeowner, I want a refinance break-even, so that I know how many months it takes to recover the cost."

- Given balance $300,000, 300 months left, current rate 7.50%, new rate 6.50%, and refinance costs $6,000, when I view the result, then the monthly saving is $191.35 and the break-even is 32 months.
- Given the new payment is not lower than the current payment, when the result shows, then the product shows "No monthly saving" and no break-even.
- Given any break-even result, when it shows, then the product states that the new term equals the remaining term.

**S-15 (serves J-1, J-2, J-3).** "As a user, I want to see how the payment changes with the rate, so that I can judge rate risk."

- Given loan $400,000 and term 30 years, when I view rate sensitivity for 6.50%, then I see payments for 5.50%, 6.00%, 6.50%, 7.00%, and 7.50%.
- Given the step size is 0.50 points, when I change the base rate, then the five rows move with it.

**S-16 (serves J-1, J-2).** "As a user, I want to set yearly growth for tax and insurance, so that I see how the cost can rise."

- Given tax growth 3% and year 1 monthly tax $833.33, when I view the yearly summary, then year 2 tax is based on $858.33 per month.
- Given growth is 0%, when I view the yearly summary, then tax and insurance stay the same each year.
- Given growth is applied, when the result shows, then it is labeled "Assumption".

### 7.4 R4 Professional

**S-17 (serves J-3).** "As a Professional, I want to compare two loans side by side, so that I can show the tradeoff."

- Given a 15 year fixed loan and a 30 year fixed loan on $400,000 at 6.50%, when I view the comparison, then I see monthly payments of $3,484.43 and $2,528.27, and lifetime interest of $227,197.24 and $510,179.81.
- Given a fixed loan and a 5/6 ARM, when I view the comparison, then the ARM column carries the "Hypothetical rate" label.
- Given I change one input, when the page updates, then both columns recalculate.

**S-18 (serves J-1, J-2, J-3).** "As a user, I want to save and reopen scenarios in my browser, so that I do not enter data again."

- Given I save a scenario with a name, when I reload the page, then the scenario is in my list and opens with the same inputs.
- Given browser storage is blocked, when I save, then I see a message that saving is not available and the calculator still works.
- Given I delete a scenario, when I confirm, then it is removed from the list.
- Given saved data, when it is stored, then it stays on the device and is never sent to a server.

**S-19 (serves J-3).** "As a Professional, I want a print-friendly report, so that I can give it to a client."

- Given a result, when I choose Print, then the page shows inputs, the itemized estimate, the schedule summary, the assumptions list, and the disclaimer.
- Given the print view, when it shows, then the navigation and input controls are hidden.
- Given any printed page, when I check it, then the disclaimer text is present.

## 8. Calculation rules

### 8.1 Definitions

| Symbol | Meaning                            |
| ------ | ---------------------------------- |
| H      | Home price                         |
| d      | Down payment fraction              |
| L      | Loan amount. L = H x (1 - d)       |
| LTV    | L / H                              |
| a      | Annual note rate as a decimal      |
| r      | Monthly rate. r = a / 12           |
| n      | Number of payments. n = years x 12 |

### 8.2 Money and rate storage

- Store all money as integer cents.
- Store all rates as integer millionths. 6.125% is 61250.
- Do not parse money with `parseFloat(x) * 100`. Parse the text. Split at the decimal point and pad to two digits.
- Do not use `toFixed` for money. Use one rounding helper.
- Round half up to the cent.
- Convert to dollars only when the value is displayed.
- Reject loan sizes where `balance x rate` can pass 9,007,199,254,740,991. Use BigInt for the interest line if you must allow larger loans.

### 8.3 Fixed principal and interest

When r > 0: `PI = L x r / (1 - (1 + r)^(-n))`. Round to cents.

When r = 0: `PI = L / n`. When L = 0: `PI = 0`.

### 8.4 Monthly amortization

For month t, with balance B and monthly rate r:

1. `interest = round(B x r)`. Use integer half-up math: `floor((B x micro x 2 + den) / (2 x den))` with `den = 12,000,000`.
2. `regularPayment = min(PI, B + interest)`.
3. `principal = max(0, min(B, regularPayment - interest))`.
4. `extra = min(max(0, requestedExtra), B - principal)`.
5. `B = B - principal - extra`.

In the last month, add any small remaining balance to the final payment. The final payment can differ from PI by a few dollars. In the reference tests the difference was $2.61.

The displayed lifetime interest is the sum of the ledger interest. It is not the closed-form value, and the two can differ by more than $5 on long, high-rate loans (see 12.2 for the bound). For the reference loan the closed-form value is $510,177.95 and the ledger value is $510,179.81.

### 8.5 5/6 SOFR ARM

| Parameter           | Default         | Note                                               |
| ------------------- | --------------- | -------------------------------------------------- |
| Fixed period        | 60 months       | Parameter                                          |
| Adjustment interval | 6 months        | Parameter. Resets in months 61, 67, 73, and so on. |
| Initial cap         | 2.00 points     | Against the start rate                             |
| Periodic cap        | 1.00 point      | Against the previous rate                          |
| Lifetime cap        | 5.00 points     | Ceiling is start rate + 5.00                       |
| Margin              | 2.75%           | Illustrative                                       |
| Floor               | Equal to margin | Editable                                           |
| Rate rounding       | Nearest 0.125%  | Before the caps are applied                        |

Rules:

- `target = round(index + margin)` to the nearest 0.125%.
- `newRate = clamp(target, max(previousRate - cap, floor, startRate - lifetimeCap), min(previousRate + cap, startRate + lifetimeCap))`.
- `cap` is the initial cap at the first reset and the periodic cap after it.
- `newPI = PI(currentBalance, newRate, remainingMonths)`. Do not restart the term.
- All caps and rates are decimals in code. A cap of 2 percentage points is stored as 20000 millionths. Reject any cap above 100%.
- Index paths are assumptions. Offer three presets: flat, rising 1 point per year, and shock.
- Label every month after the fixed period "Hypothetical rate".

Cap values and the margin come from the author's knowledge of typical 5/6 SOFR terms. They have not been checked against a current Loan Estimate. Check them before launch.

### 8.6 Property tax

`annualTax = round(H x demoRate)`. `monthlyTax = round(annualTax / 12)`.

If the displayed months do not add to the annual value, put the remainder in month 12.

### 8.7 Insurance, HOA, and other costs

- `monthlyInsurance = round(annualInsurance / 12)`.
- `monthlyHOA` is the entered value.
- `monthlyOther` is one optional number. It is not a list.
- Insurance is user-entered or a labeled example. It is never a quote.
- One optional field for extra annual insurance (flood, wind, and so on) is allowed. It has no automatic premium.

### 8.8 PMI

- PMI is on when `LTV > 80%` and the user turns it on.
- `monthlyPMI = round(L x annualPmiRate / 12)`. It is a level amount on the original loan.
- PMI ends in the first month where the scheduled balance is at or below 78% of H.
- Show the first month where the balance is at or below 80% of H as the "Can request removal" month.
- The 78% date uses the original schedule. Extra payments do not move it. Extra payments can move the 80% date.
- PMI counts in the lender payment group.

### 8.9 Cost groups

| Group                   | Items                                                |
| ----------------------- | ---------------------------------------------------- |
| Lender payment (escrow) | Principal and interest, property tax, insurance, PMI |
| Non-escrow              | HOA, other monthly costs                             |

### 8.10 Closing costs and cash to close

`cashToClose = downPayment + sum(closingCostLines) - credits`. Credits are optional. All lines are in cents.

### 8.11 Simplified affordability

- `frontEnd = housingPayment / grossMonthlyIncome`.
- `backEnd = (housingPayment + otherMonthlyDebt) / grossMonthlyIncome`.
- Housing payment is the lender payment plus HOA.
- Default thresholds are 28% and 36%. They are editable and illustrative.

### 8.12 Refinance break-even

- `monthlySaving = currentPI - newPI`.
- `breakEvenMonths = ceil(refinanceCosts / monthlySaving)`.
- The new term equals the remaining term of the current loan. This is a stated assumption.
- The result is simple. It does not model taxes, cash-out, or the time value of money.

## 9. Data and defaults

### 9.1 Demo state tax rates

These rates are illustrative. They are a state-level simplification. Real tax depends on county, city, assessed value, and exemptions.

| State | Demo rate |
| ----- | --------- |
| NY    | 1.40%     |
| FL    | 0.95%     |
| CA    | 1.10%     |
| TX    | 1.60%     |
| NJ    | 2.00%     |

As of date for this table: 2026-10-30. The date is stored with the table and shown to the user (see S-9).

Source check (2026-10-30): the rates are not fully confirmed. Public sources conflict. NJ sources show about 2.11% to 2.23%. CA sources show a statewide rate near 0.7%, but a new buyer in CA is reassessed at the purchase price, so about 1.1% is reasonable for a purchase estimate. Label the column "Illustrative new-buyer estimate".

Store the table in one module. A later ZIP-level data source must replace only that module.

### 9.2 Other defaults

| Item                 | Default                             | Confidence                                                | Source                                                                                             | As of      |
| -------------------- | ----------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------- |
| Demo state tax rates | See 9.1                             | Low to moderate                                           | Product owner table. Not fully confirmed.                                                          | 2026-10-30 |
| Homeowners insurance | $2,400 per year ($200.00 per month) | Moderate for the national average. Low for any one state. | Four public 2026 estimates between $2,377 and $2,543, based on about $300,000 of dwelling coverage | 2026-10-30 |
| PMI rate             | 0.75% per year                      | Low                                                       | Midpoint of the commonly cited 0.5% to 1.0% range. No authoritative rate matrix was found.         | 2026-10-30 |
| ARM margin and caps  | 2.75% margin. Caps 2/1/5.           | Low                                                       | Author's knowledge of typical 5/6 SOFR terms. Not checked against a Loan Estimate.                 | 2026-10-30 |
| DTI thresholds       | 28% front-end, 36% back-end         | Moderate                                                  | Common industry rules of thumb. Not verified.                                                      | 2026-10-30 |
| Index path presets   | Flat, +1 point per year, shock      | Not applicable                                            | Product choice                                                                                     | 2026-10-30 |

The insurance default is flat. It does not scale with the home price. Premiums follow rebuild cost, not purchase price.

### 9.3 Data freshness rules

- Every default is stored as a record with these fields: `value`, `source`, `asOf` (date), and `confidence`.
- The product shows `asOf` and `source` next to every default (see S-9).
- The stale limit is 365 days. It is one constant that the team can change.
- A default past the stale limit shows "May be out of date". It still works. The product does not block the calculation.
- Changing a default value requires a new `asOf` date in the same change. A test must fail if a value changes and the date does not.
- Before launch, refresh the PMI rate from a current insurer rate card or the Fannie Mae PMI matrix, and update the date (see T-1).

## 10. Non-functional requirements

- **Precision.** All money math uses integer cents. All rates use integer millionths.
- **Display.** Line items must add up to the displayed total after rounding.
- **Responsive.** The layout works at 360 px width with no sideways scroll.
- **Performance.** A change to any input updates the result in under 100 ms on a mid-range phone. A 30 year schedule has 360 rows.
- **Storage.** Saved scenarios use browser storage only. The product works if storage is blocked.
- **Privacy.** The product does not send user inputs to a server.
- **Accessibility.** Inputs have labels. Errors are read by screen readers. Color is never the only signal.
- **Print.** The print view contains the disclaimer and the assumptions list.
- **Data freshness.** Every default has an "as of" date, a source, and a confidence level. The user can see them. See 9.3.

## 11. Disclaimers

The product must show this text, or text with the same meaning, on every result screen and every printed page:

"This tool gives estimates only. It is not a loan offer, a quote, or financial advice. Tax, insurance, PMI, and ARM index values are illustrative. Your real costs can differ. Check all numbers with a lender."

## 12. Test plan

### 12.1 Golden cases

| Case                      | Expected                                                       |
| ------------------------- | -------------------------------------------------------------- |
| $400,000, 6.50%, 30 years | PI $2,528.27. Ledger lifetime interest $510,179.81.            |
| Same, 20 years            | PI $2,982.29. Lifetime interest $315,750.75.                   |
| Same, 15 years            | PI $3,484.43. Lifetime interest $227,197.24.                   |
| Same, rate 0%             | PI $1,111.11.                                                  |
| Same, loan $0             | PI $0.                                                         |
| $500,000, NJ              | Annual tax $10,000.00. Monthly tax $833.33.                    |
| PMI case (S-5)            | PMI ends in month 109. Removal request in month 95.            |
| ARM shock (S-8)           | Rates 8.50, 9.50, 10.50, 11.50. First reset payment $3,015.13. |
| Extra $200 (S-13)         | Payoff month 293. Interest saved $111,892.52.                  |
| Refinance (S-14)          | Saving $191.35. Break-even 32 months.                          |

### 12.2 Rules

- Principal paid must equal the original loan on every fixed and ARM run.
- Final balance must be $0.00.
- No ARM reset may break a cap. Test with flat, rising, shock, and crash index paths.
- Compare the JavaScript results to a decimal reference on at least 3,000 random loans. Use 15, 20, and 30 year terms, balances of $50,000 to $2,000,000, and rates of 2% to 12% in 0.125% steps.
- In the earlier prototype, the integer half-up interest matched the reference on all 3,000 cases. Interest computed with a float rate multiplication did not (9 mismatches, up to 4 cents). Do not use the float method.
- Compare the ledger interest to the exact closed-form interest `n x PI - L` (PI unrounded) with a rate-dependent tolerance, not a flat $5. With `r` the monthly rate, `n` the number of payments and `S = ((1 + r)^n - 1) / r`, the tolerance in cents is `T(r, n) = S - n / 2`. Assert `|ledger - closed form| <= T` for every case, and also assert `<= $5` whenever `T <= $5`.
  - Why a flat $5 fails: the ledger rounds the payment once and the interest every month, and the final payment absorbs the difference. A rounding error of half a cent in month `t` grows by `(1 + r)` each later month, so it is worth up to `(1 + r)^(n-t)` cents by the end. With 360 payments at 12% that is far above $5. The 3,000-case run had 180 cases over $5 (179 when the closed form is rounded to the cent), all of them 30 year loans at higher rates (20 year loans can also exceed $5 in principle, above 8.375%). The ledger itself matched the reference on every line, so this is a property of cent rounding and not an engine defect.
  - Derivation, in cents. Every rounding error is at most half a cent: the payment error `d0` and each month's interest error `e_t`. Let `x_t` be the ledger balance minus the exact balance. Then `x_t = (1 + r) x_(t-1) + e_t - d0` and `x_0 = 0`. The final payment clears the balance, so it equals `PI* + (1 + r) x_(n-1) + e_n`, where `PI*` is the unrounded payment. Summing, `gap = d0 ((n - 1) - G) + sum e_t (1 + r)^(n-t)`, where `G = ((1 + r)^n - (1 + r)) / r >= n - 1`. Bounding each error by half a cent gives `|gap| <= (G - (n - 1)) / 2 + S / 2 = S - n / 2`.
  - Precondition: no payment before the last may pay the loan off early. This holds when `PI* / (1 + r) > S_(n-1)` (the same sum with `n - 1` terms). The test checks this exactly for every case and for every grid rate and term at $50,000, and it holds. If the precondition fails (very small loans at high rates) the bound does not apply and the case must be reasoned about separately.
  - Where the flat $5 is guaranteed (`T <= $5`): every rate from 2% to 12% at 15 years, up to 8.375% at 20 years, and up to 3.875% at 30 years. The worst case in the test domain is 12% over 30 years, `T = $33.15`.
  - The bound uses the exact rational closed form and exact BigInt arithmetic. It is not derived from, and must not be replaced by, the largest gap seen in a sample.
  - The ledger and final-payment policy in 8.4 is unchanged. Do not change the engine to meet $5.
- A flat-index ARM may differ from the fixed loan by a few dollars, because each reset rounds to the cent. The prototype difference was $1.32.
- Test the money parser with `1.005`, `19.99`, `0.1`, and an empty field.
- Test the 12-month tax split so that the months add up to the annual value.

## 13. Open questions and risks

| ID  | Item                                                                                                                     | Owner         | Impact                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q-1 | What is the business model or launch success metric? (lead generation, professional tier, white label, or free traffic). | Product owner | Changes the R4 scope and the call-to-action design. Not decided (2026-10-30). R4 stays as written. The call-to-action is a placeholder until this is decided. |
| Q-2 | Default for homeowners insurance.                                                                                        | Product owner | Closed 2026-10-30. $2,400 per year. See 9.2.                                                                                                                  |
| Q-3 | Default PMI rate.                                                                                                        | Product owner | Closed 2026-10-30. 0.75% per year, low confidence. See 9.2.                                                                                                   |
| T-1 | Replace the PMI default with a figure from a current insurer rate card or the Fannie Mae PMI matrix. Update the date.    | Product owner | Task before launch.                                                                                                                                           |
| Q-4 | Check the 5/6 ARM caps and margin against a current Loan Estimate.                                                       | Product owner | Needed for S-8.                                                                                                                                               |
| Q-5 | Verify the five demo tax rates against a primary source (Census ACS or Tax Foundation state table).                      | Product owner | Trust risk.                                                                                                                                                   |
| R-1 | One product for three roles can become three weak products.                                                              | Product owner | Control it with the release layers in section 6.                                                                                                              |
| R-2 | State-level tax is a coarse estimate. The user can see a number that differs from a listing site.                        | Product owner | Control it with the "Illustrative" label and a visible override.                                                                                              |
| R-3 | The state list covers high insurance cost states (FL, CA, TX). A flat insurance default can be far off.                  | Product owner | Consider state insurance defaults with the future tax upgrade.                                                                                                |
| R-4 | There is no stated differentiator against free calculators.                                                              | Product owner | Related to Q-1.                                                                                                                                               |

## 14. Glossary

- **Amortization.** The slow payoff of a loan through regular payments.
- **ARM.** Adjustable-rate mortgage. The rate changes after a fixed period.
- **Cap.** The most a rate can change in one reset, or in the whole loan.
- **DTI.** Debt-to-income ratio.
- **Escrow.** An account the lender uses to pay tax and insurance for the owner.
- **Index.** A market rate that an ARM follows. The 5/6 ARM uses SOFR.
- **LTV.** Loan-to-value ratio. Loan amount divided by home price.
- **Margin.** A fixed number of points added to the index.
- **PMI.** Private mortgage insurance. It protects the lender when the down payment is small.
- **Principal.** The part of a payment that reduces the loan balance.
