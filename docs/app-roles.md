# App Roles: Mortgage Ownership Calculator

Source: PRD.md, section 4. Version 0.2. Date: 2026-10-31.

One product serves all three roles (decision D-1). A role is a type of user. It is not a login type. The product has no accounts in this version. The user picks the tools they need.

## How to read this file

- Each role starts with one sentence: "A [role] is [who they are]. They can [what they do]. They must never [what the app prevents]." The lists below it give the detail.
- "Can" lists what the role does in the product.
- "Must never" lists a rule the product enforces for this role.
- "Jobs" links to jobs-to-be-done.md.
- "Stories" links to user-stories.md.

## AR-1 First-Time Buyer

**In one sentence:** A First-Time Buyer is a person planning to buy a first home who does not yet know the full cost of owning it. They can enter a price, loan terms and costs and see one itemized monthly total and the cash needed at closing. They must never see a result presented as a loan offer, quote or approval, or an estimate without a label saying where it came from.

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

**In one sentence:** A Homeowner is a person who already has a mortgage and is thinking about paying extra or refinancing. They can enter their current loan, try extra payments or a lower rate and see the savings and the break-even time. They must never see a refinance result without its cost and term assumptions, or a break-even when there is no monthly saving.

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

**In one sentence:** A Professional is a real-estate or mortgage professional who shows loan tradeoffs to clients. They can compare two loans side by side, save scenarios in the browser and print a report. They must never produce a report that hides the disclaimer or the illustrative assumptions, or show an ARM result without the "Hypothetical rate" label after the fixed period.

A Professional is a real-estate or mortgage professional. They show tradeoffs to a client. They need results that are easy to compare and easy to print.

**Can**

- Compare two loans side by side. The loans can be fixed and fixed, or fixed and ARM.
- Change an input of either loan and see that loan and the differences summary update. The two loans keep separate inputs.
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
