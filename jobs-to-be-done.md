# Jobs to Be Done: Mortgage Ownership Calculator

Source: PRD.md, section 5. Version 0.1 (draft). Date: 2026-10-30.

A job states the situation, the motivation, and the result the user wants. Each job below serves one or more roles. Each job links to the stories that serve it.

## Job format

"When [situation], I want to [motivation], so I can [expected outcome]."

## J-1 First-Time Buyer: know the full cost

**Role:** AR-1 First-Time Buyer.

**Job:** "When I plan to buy my first home, I want to know the full monthly cost and the cash I need, so I can decide what price I can afford."

**Why this job is hard today**

- Free calculators often show only principal and interest.
- Tax, insurance, PMI, and HOA are easy to forget.
- Cash needed at closing is a separate number that many tools hide.

**Success looks like**

- The user sees one itemized monthly total.
- The user sees what goes to the lender and what is paid elsewhere.
- The user sees the cash to close.
- The user knows which numbers are estimates.

**Stories:** S-1 to S-12, S-15, S-16, S-18

## J-2 Homeowner: decide to change the loan

**Role:** AR-2 Homeowner.

**Job:** "When I think about refinancing or paying extra, I want to see the savings and the break-even point, so I can decide if the change is worth it."

**Why this job is hard today**

- The savings from extra payments are hard to picture.
- A lower rate can still lose money if closing costs are high.
- Users do not know how long it takes to recover the cost.

**Success looks like**

- The user sees the payoff month and the interest saved.
- The user sees the break-even month for a refinance.
- The user sees the assumptions used.

**Stories:** S-1 to S-10, S-13 to S-16, S-18

## J-3 Professional: show tradeoffs to a client

**Role:** AR-3 Professional.

**Job:** "When I advise a client, I want to show the tradeoffs between loans side by side, so the client can decide with clear numbers."

**Why this job is hard today**

- Professionals often use more than one tool for one meeting.
- Results are hard to compare when each is on a different screen.
- A client needs a report to take home.

**Success looks like**

- The user sees two loans in two columns.
- The user changes one input and both columns update.
- The user prints a report that the client can keep.

**Stories:** S-1 to S-10, S-15, S-17 to S-19

## J-4 All roles: trust the numbers

**Roles:** AR-1, AR-2, AR-3.

**Job:** "When I see a number, I want to know which inputs are estimates, so I can trust it or correct it."

**Why this job matters**

- Every default in the product is an estimate.
- State-level tax is a coarse estimate. A user can see a different number on a listing site.
- Defaults can become old. A user must be able to see how old they are.

**Success looks like**

- The user sees a label on each value: entered, illustrative, or overridden.
- The user sees the "as of" date and the source of each default.
- The user sees "May be out of date" when a default is more than 365 days old.
- The user can override any default.
- The user sees the disclaimer on every result and every printed page.

**Stories:** S-3, S-4, S-5, S-8, S-9, S-10, S-19

## Job and story map

| Job | R1                            | R2         | R3           | R4           |
| --- | ----------------------------- | ---------- | ------------ | ------------ |
| J-1 | S-1 to S-10                   | S-11, S-12 | S-15, S-16   | S-18         |
| J-2 | S-1 to S-10                   | None       | S-13 to S-16 | S-18         |
| J-3 | S-1 to S-10                   | None       | S-15         | S-17 to S-19 |
| J-4 | S-3, S-4, S-5, S-8, S-9, S-10 | None       | None         | S-19         |

## Open items

- Q-1 (business model) is not decided. If the model is lead generation, a new job may be needed for the lender or agent who receives the lead. If the model is a paid professional tier, J-3 may split into free and paid parts. See PRD.md, section 13.
