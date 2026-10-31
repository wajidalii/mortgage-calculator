# Accessibility audit

PRD NFR "Accessibility" (issue #32). Audit date: 2026-10-31.

## What was run

- **axe-core 4.10.2** on the production build in headless Chrome (360 px wide), with the rules tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` and `best-practice`.
- Ten page states: home; calculator default; calculator with an ARM, PMI and an income; calculator with extra payments and cost growth; calculator with errors in several fields; calculator with the 360-row monthly schedule and an "Above guideline" ratio; calculator with the print report mounted; compare (fixed vs ARM); refinance with a result; refinance with no saving and an error.
- **Own contrast check** (a script that resolves every text element's color and its effective background, including alpha, and applies the WCAG AA ratios: 4.5, or 3 for large text). It was added because axe reports `color-contrast` as "incomplete" (could not decide) on most calculator states.
- **Keyboard traversal**: Tab through `/calculator`, `/compare` and `/refinance`, recording each stop and its accessible name.
- **Code review** of the signals that must be text, not color only.

## Findings and fixes

| Finding                                                                                          | Impact   | Fix                                                                                                      |
| ------------------------------------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------- |
| `definition-list`: the affordability card put a `<div>` with plain text directly inside a `<dl>` | serious  | Moved the "Housing payment ... income ..." sentence out of the `<dl>` into a `<p>` (`AffordabilityCard`) |
| `landmark-complementary-is-top-level`: the Disclaimer was an `<aside>` inside `<main>`           | moderate | Now `<div role="note" aria-label="Disclaimer">` (`Disclaimer`); tests updated to the `note` role         |

After the fixes axe reports **0 violations** in all ten states (critical, serious, moderate and minor).

## Results after the fixes

- **axe:** 0 violations in all ten states. `color-contrast` stays "incomplete" in six of them (axe cannot resolve the backgrounds); see the next point.
- **Contrast (own check):** 0 text elements below AA out of about 4,500 checked across the states (for example 490 on the calculator default and 2,162 with the monthly schedule).
- **Labels:** axe reports no label violations in any state. Every input has a visible `<label>`; the scrollable table regions have `aria-label`s and are keyboard reachable (`tabindex="0"`).
- **Keyboard:** `/calculator` has 44 tab stops, `/compare` 11 and `/refinance` 5 (Tab wrapped once in the headless browser, which is why the refinance run shows 10). Every stop has an accessible name, and focus leaves the page, so there is no trap. Tab order follows the visual order (Print report, saved scenarios, then the form top to bottom).
- **Errors are announced:** field errors render in `role="alert"` paragraphs and are linked to the input with `aria-describedby` and `aria-invalid` (`TextField`); result cards sit in `aria-live="polite"` regions; saved-scenario messages are `role="status"`.
- **Not color only:** every colored signal carries text. Error fields have a red ring plus a "⚠" message; the badges are text ("Hypothetical rate", "Above guideline", "May be out of date", "Assumption", "Illustrative", "Overridden", "Manual override"); the stale-default notice and the incomplete-input notices are sentences. Selected radio choices use `aria-pressed` or a checked radio, not color alone.

## Not covered

- **No screen reader was run** (NVDA, VoiceOver or TalkBack). The "announced" results above come from the roles and attributes in the DOM, not from listening. A pass with a real screen reader is still needed before launch.
- **Focus indicators** were checked in the code (`focus-visible` outlines on buttons and radios, `focus-within` rings on text fields), not by comparing pixels.
- Headless Chrome at one width (360 px); zoom to 200% and reflow were not tested.
- axe finds about a third of WCAG problems at most; the manual checks above are a sample, not a full conformance audit.
