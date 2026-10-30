# App Roles: Mortgage Ownership Calculator

Source: PRD.md, section 4. Version 0.1 (draft). Date: 2026-10-30.

One product serves all three roles (decision D-1). A role is a type of user. It is not a login type. The product has no accounts in this version. The user picks the tools they need.

## How to read this file

- "Can" lists what the role does in the product.
- "Must never" lists a rule the product enforces for this role.
- "Jobs" links to jobs-to-be-done.md.
- "Stories" links to user-stories.md.

## AR-1 First-Time Buyer

A First-Time Buyer is a person who plans to buy a home for the first time. They do not know all the costs of ownership. They need one clear number for the monthly cost and one clear number for the cash needed at closing.

**Can**

- Enter the home price, down payment, loan term, and interest rate.
- Select a state and see an estimated property tax.
- Enter insurance, HOA, and other monthly costs.
- See PMI and the month when it ends.
- See an itemized monthly estimate.
- Enter closing costs and see the cash to close.
- Check a simplified affordability ratio.
- Save their own scenarios in the browser.

**Must never**

- See a result that is presented as an approved loan, a quote, or a guaranteed price.
- See an estimated value without a label that says if it is entered, illustrative, or overridden.
- See an affordability result without the statement that it is not a loan approval.

**Jobs:** J-1, J-4

**Stories:** S-1 to S-12, S-15, S-16, S-18

## AR-2 Homeowner

A Homeowner is a person who owns a home and has a mortgage. They think about refinancing or paying extra. They know their current loan. They need to see the savings and the time it takes to recover the cost.

**Can**

- Enter data for a current loan.
- Add extra monthly payments or a one-time lump sum.
- See the payoff month and the interest saved.
- Test a refinance and see the break-even point.
- See how the payment changes with the interest rate.
- Save their own scenarios in the browser.

**Must never**

- See a refinance result without the stated cost and term assumptions.
- See a break-even result when the new payment is not lower than the current payment. The product shows "No monthly saving" instead.

**Jobs:** J-2, J-4

**Stories:** S-1 to S-10, S-13 to S-16, S-18

## AR-3 Professional

A Professional is a real-estate or mortgage professional. They show tradeoffs to a client. They need results that are easy to compare and easy to print.

**Can**

- Compare two loans side by side. The loans can be fixed and fixed, or fixed and ARM.
- Change one input and see both loans update.
- Save and reopen scenarios in the browser.
- Print a report for a client.

**Must never**

- Print or export a report that hides the disclaimer.
- Print or export a report that hides the list of illustrative inputs and their "as of" dates.
- Show an ARM result without the label "Hypothetical rate" on the months after the fixed period.

**Jobs:** J-3, J-4

**Stories:** S-1 to S-10, S-15, S-17 to S-19

## Role and release map

| Role                  | R1 Core | R2 Buyer | R3 Owner | R4 Professional |
| --------------------- | ------- | -------- | -------- | --------------- |
| AR-1 First-Time Buyer | Yes     | Yes      | Some     | Some            |
| AR-2 Homeowner        | Yes     | No       | Yes      | Some            |
| AR-3 Professional     | Yes     | No       | Some     | Yes             |

R1 serves all three roles. Each later release adds depth for one role.

## Open items

- Q-1 (business model) is not decided. It can change what AR-3 gets in R4. See PRD.md, section 13.
