export const meta = {
  name: 'foundations-1-2-3',
  description: 'Implement Foundations issues #1, then #2 and #3 in parallel, one branch and PR each into dev (no merging)',
  phases: [
    { title: 'Issue 1', detail: 'Vitest setup and PR' },
    { title: 'Issues 2 and 3', detail: 'Money primitives and defaults registry in parallel worktrees' },
  ],
}

const RESULT = {
  type: 'object',
  properties: {
    issue: { type: 'number' },
    branch: { type: 'string' },
    commitSha: { type: 'string' },
    prUrl: { type: 'string' },
    checks: { type: 'string', description: 'yarn check/typecheck/test/build results, verbatim summary' },
    deviations: { type: 'string' },
  },
  required: ['issue', 'branch', 'commitSha', 'prUrl', 'checks', 'deviations'],
}

const COMMON = `
Repo: wajidalii/mortgage-calculator (use gh -R wajidalii/mortgage-calculator). You run in an isolated git worktree. Setup first: export PATH=$HOME/.local/bin:$PATH; run "git fetch origin"; run "yarn install" (Husky installs via postinstall); copy .env.example to .env if needed.
Rules from CLAUDE.md apply: pinned exact versions, no any, tabs and double quotes, named exports allowed in non-component .ts files, never use --no-verify. Read the GitHub issue first ("gh issue view N") and implement exactly its Scope and Acceptance criteria and Testing; no extra features.
Before committing run: yarn check:fix, yarn typecheck, yarn test (if it exists), yarn build. Note: yarn check may complain about CLAUDE.md formatting (Biome vs Prettier on markdown) - a known pre-existing issue, ignore that only.
Commit: read "git diff --staged" first, then write a multi-line message: title "<Type>: <Past-tense summary>" (Type Chore for chore/* branches, Feature for feat/*), blank line, one "- " bullet per distinct change starting with a past-tense verb, each matching the diff, then a blank line and the line: Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Push the branch and open a PR with base dev (gh pr create --base dev). PR title = commit title. PR body: short summary, "Closes #N", how it was verified, and end with the line: 🤖 Generated with [Claude Code](https://claude.com/claude-code)
Do NOT merge any PR. Do not touch PLAN.md or files outside your issue's scope. Return the structured result.`

phase('Issue 1')
const one = await agent(`Implement GitHub issue #1 (Set up Vitest test runner and yarn test script). Branch name: chore/setup-vitest, created from origin/dev (git switch -c chore/setup-vitest origin/dev).
Extra: pin exact versions; after "yarn add -D", run a dependency vulnerability check for the new packages (query OSV.dev / GitHub advisories, not yarn audit alone) and report the outcome in the PR body. Update the CLAUDE.md command table and remove "no tests / no test runner" from its Open items (keep it Prettier-clean: "yarn prettier --write CLAUDE.md"). Add a smoke test for src/lib/cn.ts.
${COMMON}`, { label: 'issue-1-vitest', phase: 'Issue 1', schema: RESULT, isolation: 'worktree' })

if (!one) { log('Issue #1 failed; not starting #2 and #3.'); return { one } }

phase('Issues 2 and 3')
const BASE = `Issue #1 is not merged yet (its PR is ${one.prUrl}), so create your branch from the issue-1 branch to get the Vitest setup: git switch -c <your-branch> origin/${one.branch}. Open your PR against dev anyway and state in the PR body that it is stacked on ${one.prUrl} and that the diff includes that PR's commit until it merges.`
const rest = await parallel([
  () => agent(`Implement GitHub issue #2 (Add integer money and rate primitives). Branch name: feat/money-rate-primitives. ${BASE}
Put pure helpers in src/lib/ (e.g. money.ts, rate.ts) and branded types Cents and Micros in src/types/. Follow PRD.md section 8.2 exactly (read it): no parseFloat*100, no toFixed, one rounding helper, integer half-up interest with den 12,000,000, safe-integer guard (decide and document reject vs BigInt). Cover the PRD 12.2 parser cases 1.005, 19.99, 0.1 and empty. Tests with Vitest. Do not edit CLAUDE.md. Another agent is concurrently doing issue #3 in a different worktree; do not touch src/config/ or any defaults/tax files.
${COMMON}`, { label: 'issue-2-money', phase: 'Issues 2 and 3', schema: RESULT, isolation: 'worktree' }),
  () => agent(`Implement GitHub issue #3 (Add defaults registry with as-of dates, sources and staleness check). Branch name: feat/defaults-registry. ${BASE}
Read PRD.md sections 9.1 to 9.3 and S-9. Put the registry in src/config/defaults.ts (or a small folder) and the state tax table in its own module so a later ZIP-level source replaces only that module. Record shape { value, source, asOf, confidence }; STALE_AFTER_DAYS = 365; isStale(asOf, today) with injectable today; include the guard test that fails if a value changes without its asOf (e.g. committed snapshot of value+asOf pairs). IMPORTANT: issue #2 (money/rate primitives) is being built in parallel and is NOT on your base. Do not import from it: declare money as plain integer cents and rates as integer millionths numbers (document units in comments, with local type aliases), and list in deviations that switching to the branded Cents/Micros types is a follow-up once #2 merges. Do not edit CLAUDE.md or src/lib/.
${COMMON}`, { label: 'issue-3-defaults', phase: 'Issues 2 and 3', schema: RESULT, isolation: 'worktree' }),
])

return { one, two: rest[0], three: rest[1] }