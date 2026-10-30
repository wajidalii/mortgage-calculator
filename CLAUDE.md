# Mortgage Calculator

Web calculator for U.S. home buyers and owners (see `PRD.md`, `user-stories.md`, `app-roles.md`, `jobs-to-be-done.md` for product scope). This repo currently holds the **boilerplate only**: routing, layout, tooling and Docker. No mortgage logic exists yet.

## Stack

- React 19, React Router 8 (`createBrowserRouter`), TypeScript 7 (strict), Vite 8
- Tailwind CSS 4 via `@tailwindcss/vite`. CSS-first config in `src/styles/index.css`; there is no `tailwind.config.js`
- Biome 2.6 for lint and format; Prettier only for `*.md`, `*.yml`, `*.yaml`
- Yarn 4 (Berry) through Corepack, `nodeLinker: node-modules`. Node >= 22 (`.nvmrc`)
- Husky + lint-staged
- Vitest 5 for tests (co-located `*.test.ts` files in `src/`)
- No state library (no Zustand/Redux). `useState` / `useReducer` in feature hooks; Context only for stable global data
- Versions are pinned exactly in `package.json`

## Commands

Use `yarn`, not `npm`. If `yarn` is not found, add `~/.local/bin` to PATH (the Corepack shim lives there; the Husky hook needs it too).

| Command                         | What it does                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `yarn dev`                      | Local dev server (`vite --host`, port 5173). Needs a `.env` (copy `.env.example`)     |
| `yarn start`                    | Production: `yarn build && serve -s dist -l ${PORT:-3000}`                            |
| `yarn build`                    | `tsc -b && vite build`                                                                |
| `yarn typecheck`                | `tsc -b --noEmit`                                                                     |
| `yarn test` / `yarn test:watch` | Vitest: single run / watch mode. Tests are `src/**/*.test.{ts,tsx}`, node environment |
| `yarn lint` / `yarn lint:fix`   | `biome lint .` / `biome lint --write .`                                               |
| `yarn check` / `yarn check:fix` | Biome lint + format + import sorting, check / write                                   |
| `yarn format`                   | Biome format, then Prettier on md/yml/yaml                                            |

Yarn Berry does not run `pre*`/`post*` hooks on custom scripts (so `start` calls `yarn build` explicitly) and does not run `prepare` (so Husky installs via `postinstall`).

## Layout rule

**Code goes in `src/`. Every config file goes in the repo root.**

```
src/
  main.tsx
  vite-env.d.ts          typed ImportMetaEnv
  app/                   App.tsx, router.tsx, providers.tsx
  layouts/               MainLayout.tsx (Outlet + commented slot for a future Navbar)
  pages/                 HomePage, CalculatorPage, NotFoundPage (one lazy chunk each)
  features/              feature folders: components/ hooks/ types.ts
  components/ui/         Tailwind primitives (Button, Card)
  components/feedback/   PageLoader, ErrorBoundary
  hooks/                 shared hooks (useDebouncedValue)
  services/api/client.ts typed fetch wrapper; only code that touches the network
  config/env.ts          validates VITE_* once at import, throws if missing
  lib/                   pure helpers (cn)
  types/  assets/  styles/index.css
```

Root configs: `biome.json`, `biome-plugins/`, `vite.config.ts`, `tsconfig*.json`, `.prettierrc`, `.lintstagedrc.json`, `.husky/`, `.yarnrc.yml`, `.env.example`, `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.claude/agents/`.

## Code conventions (enforced by Biome)

1. **Components are arrow functions** with a **default export**:

   ```tsx
   const Foo = () => { ... };
   export default Foo;
   ```

   No `function Foo()` components, no named component exports, no `export { ... }` in `.tsx` files. Enforced by GritQL plugins in `biome-plugins/`, scoped to `src/**/*.tsx`.

2. **Known gap:** Biome cannot assert that a file _has_ a default export. The rules ban every other way to export a component, but cannot catch a `.tsx` file with no default export, or one that default-exports something other than the component. Check this in review.
3. Every page and the layout are loaded with `lazy()` and must default-export. Do not lazy-load tiny leaf components; that causes request waterfalls and hurts LCP.
4. No `any` (`noExplicitAny` is an error). Use explicit interfaces and `import type` for type-only imports.
5. `ErrorBoundary.tsx` wraps a non-exported class (error boundaries require a class) inside a default-exported arrow component.
6. Non-component `.ts` files (hooks, lib, services, config) may use named exports.
7. Biome style: tabs, double quotes. Run `yarn check:fix` before committing.
8. Performance: keep state as low in the tree as possible, memoize measured hot paths only, defer or debounce heavy recalculation on text input to protect INP.

## Environment variables

- Copy `.env.example` to `.env` for local work. `.env` is gitignored.
- Only `VITE_*` variables are readable by the client, and **every one is inlined into the public bundle**. Never put secrets, tokens or private keys in them.
- Read env only through `src/config/env.ts`, never `import.meta.env` directly elsewhere.
- Current keys: `VITE_API_BASE_URL`, `VITE_APP_NAME`.

## Git workflow

Branches:

| Branch                     | Purpose                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `main`                     | Production releases only. The initial commit goes here                                     |
| `dev`                      | Integration branch. Created from `main` after the initial commit                           |
| `feat/<short-kebab-name>`  | New functionality. Example: `feat/implemented-auth-module`                                 |
| `fix/<short-kebab-name>`   | Bug fixes. Example: `fix/rounding-in-amortization`                                         |
| `chore/<short-kebab-name>` | Tooling, deps, config, docs, refactors with no behavior change. Example: `chore/bump-vite` |

Rules:

- Branch names are `type/kebab-case-description`, with type one of `feat`, `fix`, `chore`.
- All work branches are created **from `dev`** and merged **back into `dev`**. Never branch from or merge feature work directly into `main`.
- `dev` goes to `main` through a **release cycle** (release merge, then tag the release on `main`). No direct commits to `main` or `dev` after the initial commit.
- The pre-commit hook runs lint-staged (Biome on staged files, Prettier on md/yml/yaml) and then `yarn typecheck`. A commit that fails lint or types is rejected. Do not bypass with `--no-verify`.
- The local repo currently has no commits and its default branch is named `master`. Rename it with `git branch -m main` before the initial commit.

## Commit messages

Commit messages are **computed from the actual diff** (`git diff --staged`), never guessed. When asked to commit, read the staged diff first, then write a multi-line message:

```
Feature: Implemented auth module

- Added login and logout routes with lazy-loaded pages
- Added useAuth hook holding session state in a reducer
- Added typed auth calls to the API client
- Updated the router to redirect unauthenticated users
```

Rules:

- **Title:** `<Type>: <Past-tense summary>`, sentence case, no trailing period, about 72 characters or fewer.
- **Type** matches the branch type: `feat/*` -> `Feature`, `fix/*` -> `Fix`, `chore/*` -> `Chore`.
- **Body:** a blank line after the title, then one `- ` bullet per distinct change, each starting with a past-tense verb (Added, Updated, Removed, Fixed, Renamed, Moved). Every bullet must correspond to something in the diff; do not describe changes that are not there.
- Keep bullets specific (name the module, hook, route or config touched) and group trivial edits (formatting, import order) into one bullet.
- One logical change per commit. If the diff mixes unrelated changes, split it into separate commits.
- The initial commit on `main` follows the same format, for example `Chore: Initialized project boilerplate`.

## Docker

No nginx: production serves the built `dist/` with `serve` (SPA fallback on).

- Stages: `deps` -> `dev` | `build` -> `prod-deps` -> `prod`.
- `docker compose --profile dev up --build`: dev server on 5173 with bind mounts (polling enabled for file watching).
- `docker compose --profile prod up --build`: static server on 3000 (`PORT` env), non-root `node` user, health check on.
- `VITE_*` values are inlined at build time, so the prod image takes them as build args (`VITE_API_BASE_URL`, `VITE_APP_NAME`).
- Image builds set `HUSKY=0` because there is no `.git` inside the image. `prod-deps` removes the `postinstall` script from its own copy of `package.json` (the repo's file is untouched).
- If a `public/` directory is added, add a bind mount for it to the compose dev service.
- Yarn is fetched through Corepack at build time, so builds need network access.

## Security

- A CVE baseline was taken on 2026-10-30 by querying OSV.dev, GitHub advisories and NVD for every direct dependency at its pinned version. No known vulnerabilities affected any of them. This is a weak signal: the versions are brand new, so advisories may not exist yet, and NVD was searched by keyword only. Re-run a dependency check before releases and when bumping versions.
- Do not use `npm audit`/`yarn audit` as the only check.

## Open items

- Mortgage logic and features from `PRD.md` are not started.
- Navbar is a placeholder slot in `MainLayout`.
- `Providers` (`src/app/providers.tsx`) is a pass-through.
- Closing the default-export lint gap (see Code conventions, item 2) would need a small check script.
