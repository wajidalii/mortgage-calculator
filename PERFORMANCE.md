# Performance audit: input to result under 100 ms

PRD NFR "Performance" (issue #31): every input change should update the result in under 100 ms on a mid-range phone with a 360-row schedule.

## Method

- Production build (`yarn build`), served with `serve`, opened at `/calculator` in headless Chrome 360 x 800, device scale 2, mobile.
- CPU throttled with the DevTools protocol (`Emulation.setCPUThrottlingRate`): **4x** is the main profile (the usual mid-range phone setting); **6x** is a stress profile.
- A script sets a field value (or clicks) the way a user would, then watches the page frame by frame. Numbers are milliseconds from the event until:
  - **paints**: the next frame is painted after the event (the field shows the keystroke, the button shows pressed). This is the INP-style number.
  - **result**: the monthly estimate card (or the extra-payment card for extra payments) shows the new text and a frame has painted. Frame granularity is about 16 ms, so a 1x run reads about 20.
- Each interaction is sampled 4 to 9 times (typing is one sample per keystroke that changes a result). Samples are few, so treat differences under about 30 ms as noise.
- Loan used: $500,000 home, 20% down, 6.50%, 30 years, NJ. Interactions covered: typing price, rate and down payment; toggling term, fixed/ARM and PMI; typing an ARM start rate; typing an extra payment; switching the schedule between yearly and monthly (360 rows); typing an extra payment while the 360-row table is shown.
- Headless Chrome on a desktop CPU is not a phone. The throttling scales CPU time only (not memory or GPU), so these are indicative, not a device test.

## Results at 4x CPU throttling (ms)

| Interaction                                  | Before: paints (max) | Before: result median | Before: result max | After: paints (max) | After: result median | After: result max |
| -------------------------------------------- | -------------------- | --------------------- | ------------------ | ------------------- | -------------------- | ----------------- |
| Type home price (6 keystrokes)               | 32                   | 32                    | 69                 | 41                  | 29                   | 76                |
| Type interest rate (5)                       | 38                   | 32                    | 77                 | 32                  | 30                   | 64                |
| Type down payment % (4)                      | 28                   | 52                    | 54                 | 33                  | 33                   | 68                |
| Toggle term 15/20/30 (9 clicks)              | 64                   | 50                    | 69                 | 40                  | 33                   | 49                |
| Toggle fixed/ARM (8 clicks)                  | 58                   | 58                    | 110                | 54                  | 61                   | 98                |
| ARM: type start rate (4)                     | 37                   | 32                    | 56                 | 34                  | 31                   | 36                |
| Type extra payment (4)                       | 35                   | 35                    | 61                 | 40                  | 33                   | 74                |
| Toggle PMI (6 clicks)                        | 48                   | 31                    | 48                 | 36                  | 29                   | 41                |
| Schedule yearly/monthly (360 rows, 6 clicks) | **158**              | 30                    | 158                | **41**              | 40                   | 62                |
| Type extra payment, 360-row table shown (4)  | 48                   | 110                   | 173                | 38                  | 140                  | 165               |

## Results at 6x CPU throttling, after the change (ms)

| Interaction                             | Paints (max) | Result median | Result max |
| --------------------------------------- | ------------ | ------------- | ---------- |
| Type home price                         | 45           | 49            | 95         |
| Type interest rate                      | 42           | 59            | 114        |
| Type down payment %                     | 36           | 64            | 81         |
| Toggle term                             | 47           | 55            | 90         |
| Toggle fixed/ARM                        | 65           | 83            | 151        |
| ARM: type start rate                    | 51           | 40            | 99         |
| Type extra payment                      | 39           | 49            | 74         |
| Toggle PMI                              | 41           | 50            | 59         |
| Schedule yearly/monthly                 | 60           | 60            | 286        |
| Type extra payment, 360-row table shown | 66           | 226           | 301        |

## Findings

- With the schedule on its default yearly view, every interaction updates the result in under 100 ms at 4x (worst case 98 ms, the fixed/ARM toggle) and input fields and buttons always paint in under 60 ms. The loan math itself is cheap; the cost is React rendering the result cards. At 6x a few worst cases pass 100 ms (rate typing 114, fixed/ARM toggle 151).
- **Hot path 1, fixed.** Switching the schedule to the 360 monthly rows blocked the click for up to 158 ms at 4x (a 115 ms long task). `ScheduleTable` now follows `useDeferredValue(view)` for the table body while the buttons follow the real state. The click now paints in 41 ms at 4x (60 ms at 6x) and the table finishes in 62 ms.
- **Hot path 2, not fixed.** With the monthly (360-row) table on screen, each keystroke in the extra-payment field re-renders all 360 rows: the extra card takes 140 ms median / 165 ms max at 4x (226 / 301 at 6x), with 97 ms long tasks. The field itself still paints in under 40 ms at 4x. Two attempts did not help in the measurements, so they were not kept: deferring the table rows a second time in `LoanCalculator`, and splitting each row into its own component. A fix that works would be to window the table (render only visible rows) or to render the monthly view in chunks. That is a larger change, so it is left as a follow-up.
- Nothing else was memoized or deferred: no other interaction showed a measured problem.

## Repeat the audit

Use the method above; the profile numbers vary by several tens of ms between runs on a laptop, so repeat each case a few times before acting on a difference.
