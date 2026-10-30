# Mortgage Calculator: Boilerplate Plan (v2)

Status: **awaiting approval. No code has been written.**
Changes from v1: nginx removed, Yarn replaces npm, Biome enforces arrow-function and default-export components, CVE scouts query real CVE databases, Opus orchestrator with named, colored Sonnet workers.

## 1. Decisions (defaults, change any before approval)

| #   | Topic                   | Decision                                                                                                                     | Why                                                                                                             |
| --- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| D1  | Formatter               | **Biome** formats and lints JS/TS/JSON/CSS. **Prettier** only for `*.md`, `*.yml`, `*.yaml`                                  | Two tools on the same files fight each other                                                                    |
| D2  | Package manager         | **Yarn 4 (Berry)** via Corepack, `packageManager` pinned in `package.json`, `.yarnrc.yml` with `nodeLinker: node-modules`    | Node-modules linker keeps Vite, Biome and Husky working without PnP quirks. Say so if you want Yarn 1 (classic) |
| D3  | Prod serving (no nginx) | `yarn start` runs `yarn build && serve -s dist -l ${PORT:-3000}`. Docker prod runs the same static server as a non-root user | `serve` is a small static server with SPA fallback. `vite preview` is documented as not for production          |
| D4  | Scripts                 | `yarn dev` (local) and `yarn start` (prod)                                                                                   | Yarn lets you drop `run`                                                                                        |
| D5  | Tailwind                | v4 via `@tailwindcss/vite`, CSS-first config in `src/styles/index.css`, no `tailwind.config.js`                              | Fewer root configs                                                                                              |
| D6  | State                   | `useState` and `useReducer` in feature hooks. Context only for stable global data. No Zustand                                | Matches your brief                                                                                              |
| D7  | Lazy loading            | Layout, every route and heavy features. Not tiny leaf components                                                             | Lazy leaf components cause request waterfalls and hurt LCP. Say so if you want literally everything lazy        |
| D8  | Git                     | `git init` (folder isn't a repo), needed by Husky                                                                            | Husky prerequisite                                                                                              |
| D9  | Versions                | Latest stable at execution time, pinned exactly, recorded in the report                                                      | My knowledge has a cutoff                                                                                       |
| D10 | Sample content          | Home, Calculator placeholder and 404 pages only                                                                              | Boilerplate, not mortgage logic                                                                                 |

Rule: **code goes in `src/`, every config file goes in the repo root.**

### Yarn Berry gotchas the plan accounts for

- Yarn 2+ **does not run `pre*`/`post*` hooks on user scripts**, so there is no `prestart`. `start` chains `yarn build &&` explicitly.
- Yarn 2+ **does not run `prepare`**, so Husky installs via `"postinstall": "husky"`. Docker builds set `HUSKY=0` so the hook install doesn't fail without `.git`.

## 2. Target layout

```
Mortgage_Calculator/
├── src/
│   ├── main.tsx
│   ├── vite-env.d.ts              # typed ImportMetaEnv
│   ├── app/
│   │   ├── App.tsx                # <Suspense><RouterProvider/></Suspense>
│   │   ├── router.tsx             # createBrowserRouter, every element lazy()
│   │   └── providers.tsx
│   ├── layouts/
│   │   └── MainLayout.tsx         # <Outlet/> in Suspense; slot for future <Navbar/>
│   ├── pages/                     # HomePage, CalculatorPage, NotFoundPage
│   ├── features/                  # feature folders: components/ hooks/ types.ts
│   ├── components/
│   │   ├── ui/                    # Tailwind primitives (Button, Card)
│   │   └── feedback/              # PageLoader, ErrorBoundary
│   ├── hooks/                     # shared hooks (useDebouncedValue)
│   ├── services/api/client.ts     # typed fetch wrapper, base URL from env
│   ├── config/env.ts              # validates import.meta.env once, exports typed const
│   ├── lib/                       # pure helpers (cn, formatters)
│   ├── types/
│   ├── assets/
│   └── styles/index.css           # @import "tailwindcss"; @theme tokens
├── .claude/agents/                # subagent definitions (see §5)
├── biome-plugins/                 # GritQL lint rules (see §4)
├── index.html  package.json  yarn.lock  .yarnrc.yml
├── vite.config.ts  tsconfig.json  tsconfig.app.json  tsconfig.node.json
├── biome.json  .prettierrc  .prettierignore  .lintstagedrc.json
├── .husky/pre-commit
├── .gitignore  .env.example  .nvmrc  .dockerignore
├── Dockerfile  docker-compose.yml
└── PLAN.md
```

## 3. Scripts (package.json)

| Script        | Command                                                           |
| ------------- | ----------------------------------------------------------------- |
| `dev`         | `vite --host`                                                     |
| `build`       | `tsc -b && vite build`                                            |
| `start`       | `yarn build && serve -s dist -l ${PORT:-3000}`                    |
| `typecheck`   | `tsc -b --noEmit`                                                 |
| `lint`        | `biome lint .`                                                    |
| `lint:fix`    | `biome lint --write .`                                            |
| `format`      | `biome format --write . && prettier --write "**/*.{md,yml,yaml}"` |
| `check`       | `biome check .`                                                   |
| `check:fix`   | `biome check --write .`                                           |
| `postinstall` | `husky`                                                           |

**Husky + lint-staged (paired).** `.husky/pre-commit` runs `yarn lint-staged`, then `yarn typecheck`.

- `*.{ts,tsx,js,jsx,json,css}` → `biome check --write --no-errors-on-unmatched`
- `*.{md,yml,yaml}` → `prettier --write`

## 4. Code-style rules enforced by Biome

1. **Components are arrow functions.** `export default function Foo()` and `function Foo()` declarations that return JSX are lint errors in `src/**/*.tsx`.
2. **Every component file has exactly one default export, and it is the component.** Written as `const Foo = () => {...}; export default Foo;`.
3. Biome's `noDefaultExport` stays **off**. `useArrowFunction` on, `noExplicitAny` error, `useImportType` on, `useComponentExportOnlyModules` on, all `recommended` rules on.

**Risk, stated honestly:** Biome has no built-in "components must be arrow functions" or "must have a default export" rule. Rules 1 and 2 need **GritQL plugins** (`biome-plugins/*.grit`, registered under `plugins` in `biome.json`). Plugin support and syntax depend on the Biome version, and "file must contain a default export" is an absence check that Grit may not be able to express. Agent Ember must prove each rule fires on a deliberately bad fixture. If a rule can't be expressed, Ember reports it and proposes the closest enforceable rule (for example, banning `export default function` and `export const Foo =` in component files). Ember does not silently skip it.

## 5. Agents and models

**Orchestrator: Opus 5.5.** I can't switch my own model mid-session. Run `/model` and pick Opus before saying "go". The orchestrator plans, spawns, gates waves, resolves cross-package issues and writes the final report. It writes no application code.

**Workers: all Sonnet.** Each is defined in `.claude/agents/<name>.md` with `model: sonnet`, a distinct `color`, and a codename, so they show up distinguishable in the terminal. The Agent tool can't set a color per call, so the definition files carry it. New agent definitions may need a session restart to load.

| Codename                                       | Color  | Role                           | Wave |
| ---------------------------------------------- | ------ | ------------------------------ | ---- |
| **ember**                                      | red    | Tooling and configs (Agent A)  | 1    |
| **atlas**                                      | blue   | App source in `src/` (Agent B) | 2    |
| **harbor**                                     | cyan   | Docker (Agent C)               | 2    |
| **sentinel-<pkg>** (one per direct dependency) | orange | CVE scout, read-only           | 3    |
| **gauge**                                      | green  | Verifier, read-only            | 3    |

Scouts share one definition (`sentinel`) and one color. Each run is labelled with its package, for example `sentinel-vite`, so they are still told apart.

### Ownership (exclusive write; no agent touches another's files)

| Agent           | Owns                                                                                                                                                                                                                                                              | Needs              | Done when                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ember**       | `package.json`, `yarn.lock`, `.yarnrc.yml`, `vite.config.ts`, `tsconfig*`, `biome.json`, `biome-plugins/`, `.prettierrc`, `.prettierignore`, `.lintstagedrc.json`, `.husky/`, `.gitignore`, `.env.example`, `.nvmrc`, `index.html`, `.claude/agents/`, `git init` | none               | `yarn install` works; `lint`/`typecheck` run on a stub; both custom Biome rules fire on bad fixtures; Husky blocks a bad commit                           |
| **atlas**       | everything under `src/`                                                                                                                                                                                                                                           | ember done         | Layout renders routes; each route and the layout is its own chunk; `lint`, `typecheck`, `build` pass; every component follows §4                          |
| **harbor**      | `Dockerfile`, `docker-compose.yml`, `.dockerignore`                                                                                                                                                                                                               | ember done         | Stages `deps` → `dev` (runs `yarn dev`) → `build` → `prod` (production deps only, `serve`, non-root, `HUSKY=0`). `docker build` passes for both targets   |
| **sentinel-\*** | none                                                                                                                                                                                                                                                              | ember done         | Report in the format below                                                                                                                                |
| **gauge**       | none                                                                                                                                                                                                                                                              | atlas, harbor done | Reports pass/fail for `yarn install --immutable`, `lint`, `typecheck`, `build`, chunk list, `docker build` (skipped if Docker absent), bad-commit blocked |

### CVE scouts (no `yarn audit` / `npm audit`)

Each scout queries a real vulnerability database for its package at the exact pinned version:

- **OSV.dev API**: `POST https://api.osv.dev/v1/query` with `{"package":{"name":"<pkg>","ecosystem":"npm"},"version":"<ver>"}` (aggregates GitHub Advisories and more).
- **NVD** and **GitHub Security Advisories** as cross-checks, via web search or fetch.
- Report: `{ package, version, source(s) queried, vulns: [{id, aliases/CVE, severity, fixedIn, affectsUs}], confidence, notes }`.
- If a database can't be reached, the scout says "not checked", never "no vulnerabilities".
- Scope: direct dependencies only (the exact list comes from ember's report). Transitive deps are out of scope unless you want them.

## 6. Orchestrator protocol

1. Spawn each worker with its goal, owned files, the relevant plan sections and the rule "don't touch files you don't own".
2. Every worker's final message uses this schema:

   ```
   STATUS: done | blocked | partial
   FILES: <created/modified paths>
   COMMANDS RUN: <command → result>
   DEVIATIONS: <anything differing from the plan>
   NEEDS FROM ORCHESTRATOR: <questions or cross-package requests>
   ```

3. Workers never talk to each other. Cross-package needs route through the orchestrator.
4. Wave gating: the orchestrator reads the reports and spot-checks files before launching the next wave.
5. Final report: layout, resolved versions, CVE table, verification results, deviations, open issues.

## 7. Tradeoff notes (for the final write-up)

- **State.** Calculator inputs in one `useReducer` inside a feature hook; derived results via `useMemo`; text input goes through `useDeferredValue` or a debounce so typing (INP) isn't blocked by recalculation. State sits as low in the tree as possible. Context is only for stable data, because it re-renders every consumer on change. Reconsider a store only if many unrelated consumers need high-frequency state.
- **LCP/FCP.** Tiny entry chunk (router plus loader); layout and pages load on demand; Vite emits `modulepreload`; Tailwind ships only used CSS; system font stack.
- **TTI/INP.** No heavy startup work; memoize measured hot paths only.
- **Maintainability.** Thin pages compose feature components; logic lives in hooks and pure `lib/` functions; only the API client touches the network; the style rules in §4 are machine-enforced rather than review-enforced.
- **Security.** Vite inlines every `VITE_*` var into the public bundle, so `.env` never holds real secrets, and `.env.example` says so.

## 8. Approval needed

1. Switch the session to Opus 5.5 with `/model`.
2. Reply "go", or tell me which of D1–D10 to change.
