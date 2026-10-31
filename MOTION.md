# Motion design system

Motion here gives feedback, clarifies a change, or sets hierarchy. It never decorates. Issue #82.

## Principles

- **Transform, opacity and paint only.** No animated width, height, top or left. No `transition-all`. List the properties (`transition-[color,background-color,box-shadow]`).
- **Native CSS first.** No animation library. React state is used only where a result must be known (the chart year, the value-change count).
- **Responsive, not restless.** Nothing loops. Entrances and reveals play once.
- **Reduced motion keeps meaning.** Entrances, reveals, lifts and highlights are removed; hover, focus, pressed and validation feedback stay as instant state changes.
- **Never animate a stale figure** as if it were new.

## Tokens (`src/styles/index.css`, `@theme`)

| Token                                | Value                             | Use                                      |
| ------------------------------------ | --------------------------------- | ---------------------------------------- |
| `--duration-micro`                   | 150 ms                            | Presses, toggles, field ring, row hover  |
| `--duration-hover`                   | 200 ms                            | Hover lift, button and nav color changes |
| `--duration-expand`                  | 250 ms                            | Advanced section open, chevron           |
| `--duration-enter`                   | 400 ms                            | Hero entrance, scroll reveal             |
| `--ease-out-soft`                    | `cubic-bezier(.22, 1, .36, 1)`    | Entrances and lifts                      |
| `--ease-standard`                    | `cubic-bezier(.4, 0, .2, 1)`      | State changes                            |
| `animate-rise`, `animate-rise-quick` | opacity 0 to 1, 8 px up to rest   | Hero stagger, advanced section           |
| `animate-fade`                       | opacity 0 to 1, 150 ms            | Validation message, saved scenario row   |
| `animate-wipe`                       | `clip-path` left to right, 700 ms | One-time chart reveal                    |
| `animate-flash`                      | background to transparent, 800 ms | Changed result                           |

Use them as `motion-safe:duration-hover`, `motion-safe:ease-out-soft`, `motion-safe:animate-rise`.

## Patterns

- **Pressed:** buttons move 1 px down (`active:translate-y-px`) and darken. Segmented controls dim.
- **Clickable cards** (homepage tools only): lift 2 px, stronger shadow, border and icon color change. The same applies on `focus-visible`, so keyboard users get the hover effect. Static cards do not lift.
- **Scroll reveal:** `Reveal` and `useReveal`. Content is visible by default. Script hides it only when it starts below the fold, motion is allowed and `IntersectionObserver` exists, then shows it once. It never hides again.
- **Hero entrance:** `animate-rise` with 60 to 300 ms delays, staggered.
- **Changed result:** `useValueFlash(value, enabled)` returns a change count used as a React `key`. The monthly total and cash to close highlight once after the (debounced) result settles. The first value does not count, and `enabled` is `false` for the stale "last valid entry" state.
- **Chart:** one-time left-to-right wipe on mount, not on data change. "Explore the balance by year" is a native range input (keyboard, touch and screen reader) plus pointer scrubbing. It reads exact ledger balances, and the amortization table remains the full data.
- **Print:** all animation and transitions are off, and nothing stays hidden.

## Adding motion

1. Say what it communicates. If nothing, skip it.
2. Use a token and `motion-safe:`.
3. Do not make a non-clickable element look clickable.
4. Check reduced motion and print.
