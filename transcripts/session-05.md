 ▐▛███▛█   Claude Code v2.1.314
▝▜██████▀  Sonnet 5.5 · Claude Pro
 ▝▝   ▝▝   ~/Documents/projects/Mortgage_Calculator


❯ /clear                                                                        

❯ Act as a senior financial software engineer reviewing the Mortgage            
  Calculator's amortization precision requirements.                             
                                                                                
  Repository: wajidalii/mortgage-calculator                                     
                                                                                
  Review:                                                                       
  - PR #53                                                                      
  - GitHub issue #8                                                             
  - PRD.md sections 8.3, 8.4 and 12.2                                           
  - src/lib/payment.ts                                                          
  - src/lib/amortization.ts                                                     
  - src/lib/amortization.reference.test.ts                                      
                                                                                
  Product decision:                                                             
                                                                                
  We will preserve the existing cent-rounded ledger and final-payment           
  adjustment policy. We will not change the financial engine merely to satisfy  
  the original universal $5 closed-form tolerance.                              
                                                                                
  Your tasks:                                                                   
                                                                                
  1. Independently verify why 179 of the 3,000 cases exceeded the $5 tolerance. 
  2. Review the proposed rounding growth bound. Derive or independently justify 
  a conservative mathematical bound that accounts for:                          
     - Rounding the scheduled payment.                                          
     - Monthly interest rounding.                                               
     - Compounding of rounding differences.                                     
     - The final payoff adjustment.                                             
  3. Confirm the new bound is valid for the permitted loan terms, principal     
  amounts and rates. Do not assume a passing randomized test proves universal   
  correctness.                                                                  
  4. Update PRD.md section 12.2 to replace the unconditional $5 tolerance with  
  a mathematically justified rate-dependent tolerance. Preserve the $5          
  assertion for cases where that limit is guaranteed.                           
  5. Update issue #8's acceptance criteria to reflect the approved financial    
  policy. Explain the change transparently.                                     
  6. Improve amortization.reference.test.ts where necessary:                    
     - Preserve the independent BigInt reference.                               
     - Preserve the 3,000 seeded test cases.                                    
     - Preserve zero-mismatch ledger assertions.                                
     - Preserve the floating-point regression sensitivity test.                 
     - Add appropriate boundary tests.                                          
     - Avoid assertions based only on a sampled maximum or unexplained          
  tolerance.                                                                    
  7. Verify PR #53's actual GitHub merge status before doing anything. Do not   
  merge it again.                                                               
  8. Create a new documentation/testing issue if required, and implement the    
  changes on a dedicated branch from the latest dev.                            
  9. Run:                                                                       
     - yarn check                                                               
     - yarn typecheck                                                           
     - yarn test                                                                
     - yarn build                                                               
  10. Push the branch and open a PR against dev. Do not merge without my        
  approval.                                                                     
                                                                                
  Return:                                                                       
  - The mathematical justification.                                             
  - The revised acceptance criterion.                                           
  - Test results.                                                               
  - Any remaining risks.                                                        
  - The new PR URL.                                                             
                                                                                
  Do not silently weaken financial correctness requirements.                    

● I'll start by checking the repo state and PR #53's actual merge status.

  Searched for 1 pattern, ran 2 shell commands (ctrl+o to expand)

● PR #53 is already MERGED (merge commit d2e7b86, 2026-10-30, into dev), so I
  won't touch it. Next I'll check the permitted input domain and reproduce the
  179 failures.

  Searched for 1 pattern, ran 1 shell command (ctrl+o to expand)

● The app has no rate cap and accepts loans up to $10M, beyond the PRD test
  domain, which I'll log as a risk. Next I'll reproduce the 179 cases with a
  standalone script sharing no code with src/, and check my derived bound
  exactly in BigInt. · summary

  Ran 1 shell command (ctrl+o to expand)

● My tally for the over-$5 count was wrong, so I'll redo it.

  Ran 1 shell command (ctrl+o to expand)

● The exact bound holds in all 3,000 cases, with the closest case at 49.5% of
  its bound. Now I'll tabulate where $5 is guaranteed, and check the
  early-payoff precondition over the whole rate/term grid.

  Ran 1 shell command (ctrl+o to expand)

● The precondition holds for all 243 rate/term combinations at the $50k minimum,
  with 15-year loans within $5 and 20- and 30-year loans up to 8.375% and
  3.875%. I'm now creating the issue and branch. · summary

  Ran 1 shell command (ctrl+o to expand)

● Now I'll rewrite the reference test, keeping the BigInt reference, seed, 3,000
  cases, exact-match and float-sensitivity tests.

  Ran 1 shell command (ctrl+o to expand)

● All 11 pass. To confirm the bound assertion can fail, I'll halve the bound and
  check that the test catches it.

  Ran 1 shell command (ctrl+o to expand)

● Even the halved bound holds on the sample (worst case 49.5% of the full
  bound). I'll try a quarter of the bound.

  Ran 1 shell command (ctrl+o to expand)

● The mutation check works. I'll quickly reconcile 179 (rounded closed form)
  with 180 (exact).

  Ran 1 shell command (ctrl+o to expand)

● That reconciles it: 179 against the cent-rounded closed form (as in #53), 180
  against the exact one. I'll fix the test comment and update PRD 12.2 and 8.4.

  Ran 1 shell command (ctrl+o to expand)

● All four checks pass. Now I'll look for other references to the old $5 rule,
  update issue #8, then commit.

  Ran 1 shell command (ctrl+o to expand)

● I wrote "20 and 30 year loans" in the PRD without checking. I'll verify the
  term split.

  Ran 1 shell command (ctrl+o to expand)

● All 180 are 30-year loans, so I'll correct the PRD wording. Then I'll update
  issue #8 and commit.

  Created PR #55, ran 1 shell command (ctrl+o to expand)

● I've opened PR #55 against dev and haven't merged it. The new test and PRD
  tolerance are in place, and yarn check, yarn typecheck, yarn test (158 passed)
  and yarn build all pass. I verified each step as follows.

  PR #53: it was already merged into dev (merge commit d2e7b86, 2026-10-30), so
  I left it alone. I branched from the latest dev, which includes it. I opened
  issue #54 for this work and edited #8's criteria.

  Why 179 cases exceeded $5: I re-ran the 3,000 seeded cases in a separate
  BigInt script that shares no code with src/. 179 exceed $5 against the
  cent-rounded closed form, which is the figure from #53. Against the exact
  closed form, 180 do. All of them are 30-year loans at higher rates. The ledger
  matches the reference on every line, so this is cent rounding compounding,
  not an engine bug.

  Mathematical justification

  Let r be the monthly rate, n the number of payments, and P* the unrounded
  payment. The rounded payment is P = P* + d0. Month t's interest has rounding
  error e_t. Every error is at most half a cent.

  1. Let x_t be the ledger balance minus the exact balance. Then x_t =
     (1+r)·x_(t−1) + e_t − d0, with x_0 = 0. So each half-cent error grows by
     (1+r) every later month.
  2. The final payment clears the balance, so it equals P* + (1+r)·x_(n−1) +
     e_n.
  3. Ledger interest minus closed-form interest = (n−1)·P + final payment −
     n·P*. This equals d0·((n−1) − G) + Σ e_t·(1+r)^(n−t), where G = ((1+r)^n −
     (1+r))/r ≥ n−1.
  4. Bounding each error by half a cent gives |gap| ≤ S − n/2 cents, where S =
     ((1+r)^n − 1)/r. This is slightly tighter than the S bound in #53, and the
     test now uses it.
  5. Precondition (no early payoff): the derivation needs every payment before
     the last to be the full payment. That holds when P*/(1+r) > S_(n−1), where
     S_(n−1) is the same sum with n−1 terms.

  I checked step 5 exactly in BigInt for all 243 rate/term combinations at
  $50,000, and it holds. The bound doesn't depend on loan size, and the
  precondition only gets easier as loans grow. The tests also run the 729 grid
  loans: every grid rate and term at $50,000, an odd balance, and $2,000,000.

  Worst case in the PRD domain is 12% over 30 years, $33.15. The worst observed
  gap was $14.95, and no case reached more than 49.5% of its bound.

  Revised acceptance criterion

  - |ledger interest − exact closed-form interest| ≤ T(r, n) = S − n/2 cents,
    checked exactly in BigInt for every case.
  - Also ≤ $5 wherever T ≤ $5. That covers all 15-year rates, 20-year loans up
    to 8.375%, and 30-year loans up to 3.875%.
  - The no-early-payoff precondition is verified for every case and every grid
    rate and term.

  PRD 12.2 carries the full text. I also added a note to PRD 8.4. Issue #8 now
  has a dated change note.

  Tests

  - Kept: the independent BigInt reference, the seed, the 3,000 cases, the exact
    ledger-line assertions and the float-regression sensitivity test.
  - Added: the exact bound over all cases and the grid corners, the precondition
    check, and a check that a $1,000 loan fails the precondition.
  - Added: the $5 assertion where guaranteed, and a check that every over-$5
    case has T above $5.
  - Removed: the Math.max(...) < 2000 sampled-maximum assertion.
  - Mutation check: shrinking the bound to 1/8 makes 5 tests fail. Halving it
    doesn't fail anything, because the worst sampled case sits at 49.5% of the
    bound. So the sample alone wouldn't catch a bound that is too tight, which
    is why the derivation is in the PRD.

  Remaining risks

  - App domain wider than the PRD domain: the app accepts any rate and prices up
    to $10M, but the proof and tests cover rates of 2–12%, 15/20/30-year terms
    and loans of at least $50,000. Very small loans or very high rates can fail
    the no-early-payoff precondition. I'd suggest either capping inputs or
    extending the precondition check.
  - Bound is conservative: it's an upper bound, not the exact maximum. It's safe
    to assert, but a ledger regression smaller than the bound could pass.
  - 20-year loans: the PRD says they can exceed $5 above 8.375% in principle. No
    seeded case showed it.
  - No ARM rule: I didn't cover ARM or extra-payment ledgers, which would need
    their own bound.

  PR URL: https://github.com/wajidalii/mortgage-calculator/pull/55 — please
  approve before merging.

✻ Worked for 4m 31s · done 3:02 AM

※ recap: Goal: replace the unachievable flat $5 ledger tolerance with a proven, rate-dependent bound without changing the engine. PR #55 is open against dev with everything passing; next, you review it and approve the merge.

❯ I have tested the acceptance criteria manually in browser, reviewed and       
  merged the pr. pull dev branch. start next issue 9                            

  Ran 1 shell command (ctrl+o to expand)

● Dev is pulled and PR #55 is merged. Next I'll look at the existing calculator
  feature, the defaults registry and the PRD sections.

  Ran 6 shell commands (ctrl+o to expand)
● I've built the tax module and UI. I'm fixing a typecheck error in an existing
  test helper, then I'll write the tests.

  Ran 1 shell command (ctrl+o to expand)

● The test turned up an edge case: for annual amounts under about $1.32,
  rounding the first 11 months up makes the twelfth month negative. I'll round
  those amounts down instead, so the months still sum correctly. · summary

  Ran 1 shell command (ctrl+o to expand)

● Everything passes. Now I'll review the staged diff and commit.

  Created PR #56 (ctrl+o to expand)

● Issue #9 (estimated property tax by state, with a manual override) is built,
  and I opened PR #56 against dev. I haven't merged it. yarn check, yarn 
  typecheck, yarn test (176 passed) and yarn build all pass. I didn't try the UI
  in a browser, so please check it there.

  - State selector: it offers NY, FL, CA, TX and NJ, defaults to NJ, and shows
    each demo rate in its option.
  - Tax maths: annual tax is round(price × rate) and monthly tax is round(annual
    / 12). Month 12 takes the remainder, so the 12 months add up to the annual
    amount exactly. It only shows when it differs from the other months.
  - Override: the optional annual tax field replaces the state rate and shows
    "Manual override". Clearing it returns to the state rate. A bad value shows
    an error after you leave the field.
  - Label: "Illustrative estimate" shows whenever a state rate is used.
  - Golden cases: $500,000 in NJ gives $10,000.00 a year and $833.33 a month. In
    TX it gives $8,000.00 and $666.67.
  - Not in a total yet: the tax appears in its own section. Adding it to the
    monthly total is issue #12.

  Edge case in PRD 8.6: for annual amounts under about $1.32, the rule as
  written makes month 12 negative. With 7 cents, eleven months of 1 cent already
  exceed it. For those amounts I round months 1–11 down instead, so no month is
  negative and the sum stays exact. Normal amounts follow the PRD unchanged,
  which I tested for every amount from $0 to $50. PRD 8.6 could mention this.

  PR URL: https://github.com/wajidalii/mortgage-calculator/pull/56

✻ Baked for 2m 19s · done 3:12 AM

※ recap: Building the mortgage calculator's issue #9 feature, property tax by state with a manual override. It's finished and open as PR #56 against dev, with all checks passing. Next, you review it in the browser and approve the merge.

❯ I have tested the acceptance criteria manually in browser, reviewed and       
  merged the pr. pull dev branch. start next issue 10                           

  Ran 5 shell commands (ctrl+o to expand)

● The code compiles. I'm simplifying a clumsy helper in monthlyCosts.ts, then
  adding tests.

  Searched for 1 pattern, ran 1 shell command (ctrl+o to expand)

● The test counts every $0.00 on the page, and the new HOA and other-cost rows
  add two more. I'll scope it to the loan summary.

  Created PR #57, ran 1 shell command (ctrl+o to expand)

● Issue #10 (insurance, HOA and other monthly costs) is built, and I opened PR
  #57 against dev. I haven't merged it. yarn check, yarn typecheck, yarn test
  (190 passed) and yarn build all pass. I didn't try the UI in a browser, so
  please check it there.

  - Inputs: annual homeowners insurance, an optional extra annual insurance
    field (flood or wind), monthly HOA, and one optional "other" monthly amount.
  - Insurance maths: monthly insurance is the annual amount divided by 12,
    rounded half up. $1,800 a year gives $150.00 a month.
  - Extra insurance: it is added to the annual figure before dividing, so it
    shows inside the insurance line. No premium is added automatically.
  - Default: if you leave insurance empty, the $2,400 a year default is used and
    labelled "Illustrative estimate, not a quote." An explicit 0 stays $0.
    Insurance you type is labelled "Your estimate, not a quote."
  - Grouping: insurance sits under "Lender payment (escrow)". HOA and other sit
    under "Non-escrow", so $100 HOA shows as $100.00 there.
  - Negative values: a negative, non-numeric or oversized value shows an error
    after you leave the field. None of the costs are used until you fix it, and
    the section then asks you to fix the highlighted fields.

  These costs aren't part of a total payment yet. The itemized total is #12.

  I also replaced the special case in the reducer that decides when to sync the
  down payment with a set of price-linked fields. An existing test counted every
  $0.00 on the page, and the new rows broke it, so I scoped it to the loan
  summary.

  PR URL: https://github.com/wajidalii/mortgage-calculator/pull/57

✻ Churned for 2m 5s · done 3:26 AM

※ recap: We're building the Mortgage Calculator issue by issue, and issue #10 (insurance, HOA and other monthly costs) is done and open as PR #57. Next, you review and merge it, then tell me to start issue #11.

❯ I have tested the acceptance criteria manually in browser, reviewed and       
  merged the pr. pull dev branch. start next issue 11                           

  Ran 3 shell commands (ctrl+o to expand)

● The Python edit script stopped part-way because biome had reformatted
  LoanCalculator.tsx. I'll look at its current state and finish the remaining
  edits.

  Ran 2 shell commands (ctrl+o to expand)

● It compiles. Now the tests, starting with the golden values: month 109 for PMI
  end, month 95 for removal request, and $187.50.

  Ran 1 shell command (ctrl+o to expand)

● The golden values come out as the PRD says: month 109 for PMI end, month 95
  for removal request, and $187.50 for PMI at 0.50% on $450,000. Committing and
  opening the PR.

  Created PR #58 (ctrl+o to expand)

● Issue #11 (PMI estimate, end month and removal-request month) is built, and I
  opened PR #58 against dev. I haven't merged it. yarn check, yarn typecheck,
  yarn test (213 passed) and yarn build all pass. I didn't try the UI in a
  browser, so please check it there.

  - When PMI applies: only when the loan is above 80% of the price. Exactly
    80.00% is off, and 80.01% is on. The comparison uses whole cents, so there's
    no rounding drift.
  - Controls: when PMI applies, an "Include PMI" checkbox (on by default) and a
    PMI rate field appear. A blank rate uses the 0.75% default and shows
    "Illustrative estimate". A negative, non-numeric or over-100% rate shows an
    error and isn't used.
  - Monthly amount: it is round(loan × rate / 12), level on the original loan.
    PMI sits in the lender payment (escrow) group.
  - Months: "PMI ends" is the first month the scheduled balance is at or below
    78% of the price. "Can request removal" is the first month at or below 80%.
    Both come from the original schedule with no extra payments.
  - Golden values, all tested:
    - $500,000 with 10% down, 6.50%, 30 years gives LTV 90.00%, PMI ends in
      month 109, and removal can be requested in month 95.
    - 0.50% PMI on $450,000 gives $187.50.
    - The default 0.75% gives $281.25.
    - The tests pass the rate explicitly, as the issue asked.

  Two ambiguities, both in the PR description:
  - Month 109: I show "PMI ends: Month 109" exactly as the PRD words it. The PRD
    doesn't say whether month 109's own payment still includes PMI.
  - 80% comparison: LTV is shown rounded to two decimals but compared exactly. A
    $400,000.01 loan on $500,000 shows 80.00% with PMI on. Tell me if you'd
    rather compare the displayed value.

  PMI isn't part of a total payment yet. The itemized total is #12.

  PR URL: https://github.com/wajidalii/mortgage-calculator/pull/58

✻ Baked for 2m 7s · done 3:38 AM

※ recap: We're building the Mortgage Calculator issue by issue, and issue #11 (PMI estimate) is done and sitting in PR #58, awaiting your browser test and merge. Next action: once you merge it and say so, I'll pull dev and start issue #12.

❯ I have tested the acceptance criteria manually in browser, reviewed and       
  merged the pr. pull dev branch. start next issue 12                           

  Searched for 1 pattern, ran 3 shell commands (ctrl+o to expand)

● The P&I figure now appears in both the new card and the existing loan summary,
  so those two older tests find two matches. I'll scope them to the loan
  summary region.

  Ran 2 shell commands (ctrl+o to expand)

● Everything passes, including the golden case ($3,611.60 total) and the
  2,000-input sum property. Committing and opening the PR.

  Created PR #59 (ctrl+o to expand)

● Issue #12 (the itemized monthly estimate) is built, and I opened PR #59
  against dev. I haven't merged it. yarn check, yarn typecheck, yarn test (221
  passed) and yarn build all pass. I didn't try the UI in a browser, so please
  check it there.

  - Layout: a new "Estimated monthly cost" card sits at the top of the results,
    with the grand total at the head. Under "Lender payment (escrow)" it lists
    P&I, property tax, homeowners insurance and PMI (only when PMI is on), then
    a lender payment subtotal. Under "Non-escrow" it lists HOA and the other
    monthly cost, then a subtotal.
  - Why the lines always add up: the subtotals and total are sums of the cent
    amounts already shown on the lines. Nothing is rounded again.
  - Incomplete inputs: if any input is invalid, the card asks you to fix the
    highlighted fields instead of showing a partial total.
  - Golden case: $500,000, 20% down, 6.50%, 30 years, NJ, $1,800 insurance, $100
    HOA gives P&I $2,528.27, tax $833.33 and insurance $150.00. The lender
    payment is $3,511.60, HOA is $100.00 and the total is $3,611.60.
  - Sum test: a seeded property test runs 2,000 random inputs and checks that
    every group and the total equal the sum of their lines. It also checks that
    the run really included PMI cases.
  - Disclaimer: it now renders inside the estimate card, and I removed it from
    CalculatorPage so it appears once.
  - Tax month 12: the card uses the regular monthly tax, which is months 1–11.
    The few-cent month 12 difference only shows in the property tax detail
    section.
  - Existing tests: two existing tests looked for the P&I figure on the whole
    page, and it now appears twice. I scoped them to the loan summary.

  PR URL: https://github.com/wajidalii/mortgage-calculator/pull/59

✻ Sautéed for 1m 51s · done 3:47 AM

❯ I have tested the acceptance criteria manually in browser, reviewed and       
  merged the pr. pull dev branch. start next issue 13                           

  Ran 1 shell command (ctrl+o to expand)

● I checked the PRD examples by hand and both match the issue: a 9.00% index
  gives the capped reset sequence up to the 11.50% lifetime ceiling, and a 0.50%
  index never hits the floor. Next I'll pull the monthly rules out of
  buildSchedule into a shared step so the ARM engine can reuse them. · summary
  Ran 1 shell command (ctrl+o to expand)

● The refactor leaves all 221 tests green, including the 3,000-case reference
  suite. Now the ARM engine.

  Ran 4 shell commands (ctrl+o to expand)

● The probe matches the PRD in all three cases: shock rates and first reset
  payment, crash rates, and a flat rate with a $1.32 lifetime interest gap. Next
  I'll run the real test file with an independent BigInt payment check at each
  reset. · summary

  Ran 1 shell command (ctrl+o to expand)

● Two of the three failures are mistakes in my own test expectations. The third
  is informative, so I'll look at the numbers before deciding anything.

  Ran 1 shell command (ctrl+o to expand)

● The probe's "flat" index sat below the 2.75% floor at low start rates, so the
  huge numbers came from the ARM not really being flat, and the test needs a
  zero floor there. The real flat run also drifts by one cent because the
  payment is recomputed from the actual balance, as the PRD requires. I'm
  re-probing with a zero floor next. · summary

  Ran 1 shell command (ctrl+o to expand)

● The flat-index ARM can drift up to $14.50 from the fixed loan on 30-year,
  roughly 11.9% loans, beyond the PRD's "a few dollars" and still under the
  fixed-ledger bound, which doesn't hold for ARMs. I'm keeping the exact $1.32
  golden, swapping the fixed "$5" test for a labelled regression guard, and
  flagging the PRD wording for you instead of editing it. · summary

  Ran 1 shell command (ctrl+o to expand)

● All green. A quick mutation check: if I introduce an off-by-one in the
  remaining months, the tests should catch it.

  Ran 1 shell command (ctrl+o to expand)

● Both mutations are caught (7 and 4 tests fail), and the restored file passes.
  Committing and opening the PR.

  Created PR #60 (ctrl+o to expand)

● Issue #13 (the 5/6 ARM calculation engine) is built, and I opened PR #60
  against dev. I haven't merged it. yarn check, yarn typecheck, yarn test (249
  passed) and yarn build all pass. This is a calculation engine only, so there's
  nothing to click in the browser yet. The ARM screen is issue #14.

  - Engine: the new src/lib/arm.ts follows PRD 8.5.
    - Resets happen in months 61, 67, 73 and so on. The target rate is the index
      plus margin, rounded to the nearest 0.125%.
    - The result is limited by the initial cap at the first reset and the
      periodic cap after, then the lifetime cap and the floor.
    - The new payment is recalculated from the current balance and the remaining
      months, so the term never restarts.
    - Margin, caps and floor are parameters built from the defaults registry.
      Caps or margin above 100%, negative values and non-integers are rejected.
  - Index paths: flatIndex, stepIndex (a shock steps up, a crash steps down) and
    risingIndex.
  - Rows: each row has its rate, scheduled payment, a reset flag, and a
    hypothetical flag on every month after month 60. The flag is for the
    "Hypothetical rate" label in #14.
  - Shared ledger step: I pulled one month of the ledger out of buildSchedule so
    the fixed-rate and ARM schedules share the same rounding and final-payment
    rules. The fixed-rate behaviour is unchanged, and the 3,000-case reference
    suite still passes.
  - Acceptance cases:
    - Flat 3.75% keeps the rate at 6.50%, and the first reset payment is
      $2,528.27.
    - A 9.00% index gives rates of 8.50, 9.50, 10.50 and 11.50%, and the first
      reset payment is $3,015.13.
    - A 0.50% index gives 4.50, 3.50 and 3.25%, never below the floor.
  - Invariants: caps, principal paid equal to the loan, and a $0.00 final
    balance hold on flat, rising, shock and crash paths and on 300 seeded random
    loans. Every reset payment is also checked against a separate BigInt
    formula. Two deliberate bugs I introduced were caught by 7 and 4 failing
    tests.

  Three things I'd like you to see:
  1. Flat-index payment drifts by a cent. Recomputing from the real balance
     gives $2,528.27 at the first reset, but $2,528.28 at some later resets.
     Your criterion holds at the first reset, and the test allows a one-cent
     difference.
  2. PRD 12.2's "a few dollars" doesn't hold for every ARM. A flat-index ARM
     differs from the fixed loan by exactly $1.32 on the reference loan,
     matching the PRD. On 30-year loans near 11.9% it can reach about $14.50,
     which is the same rounding effect as in #8. My test compares against the #8
     bound, but that bound isn't proven for an ARM, so it is a regression
     guard, not a proof. I left the PRD alone. Do you want a follow-up issue to
     give 12.2 the same rate-dependent wording?
  3. Clamp edge case: if the floor is above the highest rate the caps allow, I
     let the caps win, because the PRD formula doesn't say.

  PR URL: https://github.com/wajidalii/mortgage-calculator/pull/60

✻ Churned for 4m 12s · done 3:53 AM

● Keeping auto (1m tokens) · /autocompact to change

※ recap: We're building the mortgage calculator issue by issue, and PR #60 for issue 13 (the ARM calculation engine) is open and awaiting your review. Next, merge it and tell me to start issue 14, and say if you want the PRD 12.2 follow-up issue.