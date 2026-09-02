# AGENTS.md

This file defines the “house rules” for agents and humans working in this repo: how we structure code, fetch data, type things, style UI, and keep changes maintainable.

---

## Core Principles

- **Prefer clarity over cleverness.**
- **Keep files and components reasonably sized.** If a file grows past ~200–300 lines or a component becomes hard to scan, split it.
- **Type safety is non-negotiable.**
  - **Never use `any`** (including `as any`) to bypass TypeScript.
  - **Never use `void` as an escape hatch** (e.g., `void somePromise()` just to silence types/lints). Only use `void` when the function truly returns `void`.
- **Separate concerns.** Complex logic belongs in hooks/utilities, not bloated components.
- **Performance optimizations must be justified.** Don’t cargo-cult `useMemo`/`useCallback`.

---

## React Component Guidelines

### Component size & responsibility
- Prefer **small, composable components** with one clear job.
- A component should primarily:
  1) render UI,
  2) wire props/events,
  3) delegate complex logic to hooks/helpers.

### Props & state
- Prefer **explicit props** over “magic” context unless the data is truly cross-cutting.
- Keep state **minimal** and **UI-driven**:
  - If a value doesn’t affect rendering, **prefer `useRef` over `useState`**.
  - Derive values from props/state when possible instead of duplicating state.

### Hooks
- Hooks can be created to separate complex logic from a component.
- A **single hook should not have many responsibilities**:
  - If a hook starts doing “fetching + transformation + UI state + analytics,” split it.
- Prefer hooks shaped like:
  - `useThingQuery(...)` (data access)
  - `useThingState(...)` (UI state)
  - `useThingActions(...)` (commands / mutations)
- Avoid hooks that return huge bags of unrelated values. Group results into cohesive objects when helpful.

### Memoization rules
- **Do not use `useMemo` unless it avoids a genuinely expensive computation** (big lists, heavy transforms, costly derived data).
- Prefer improving data shape, reducing renders, or moving work server-side before adding memoization.

---

## Next.js Data Fetching & Suspense Rules (Important)

We are using Next.js (App Router) and cache-first Server Components.

### Fetching strategy
- When data is needed from the database, **query at the top-level Server Component** and pass down as props,
  **unless truly necessary** to fetch in a `useEffect` (e.g., client-only APIs, ephemeral UI polling, real-time-only data).
- Keep database queries **out of Client Components** whenever possible.

### Suspense rules (strict)
- Since we’re using Next.js cache components:
  - **Anything that is generated later must be wrapped in `<Suspense />`.**
- **Only the data-blocking component** should be wrapped in Suspense and have a fallback.
  - Don’t wrap entire pages/layouts if only one widget is loading.
- **Fallbacks must match the exact UI skeleton/shape** of the final UI whenever available:
  - Same spacing, same container sizes, same typography rhythm.
  - Avoid generic spinners when a skeleton exists.
- Prefer patterns like:
  - `Page (fetches top-level data) -> ChildThatFetchesMore (wrapped in Suspense with exact fallback)`

### Server vs Client components
- Default to **Server Components**.
- Use **Client Components** only when necessary (stateful interactions, browser APIs, refs for DOM measurement, etc.).
- When a Client Component needs server-fetched data, it should receive it via props from a Server Component.

---

## TypeScript Standards

### Strict typing (no escape hatches)
- Never use `any`. Prefer:
  - `unknown` + runtime validation/narrowing
  - generics
  - discriminated unions
  - `satisfies` for shape validation without widening
- Avoid unsafe casts (`as Something`) unless there is a real invariant and it’s documented.
- Prefer exhaustive checks:
  - `switch (x.kind) { ... default: assertNever(x) }`
- Functions should have meaningful return types; avoid “type laundering.”

### Example: prefer narrowing over casting
- ✅ `const value: unknown = ...; if (isFoo(value)) { ... }`
- ❌ `const value = something as any as Foo`

---

## Tailwind CSS Guidelines

- Keep Tailwind usage **consistent and readable**:
  - Group classes roughly: layout → spacing → typography → color → effects → states.
- Prefer extracted components over class soup:
  - If a class list gets long or repeated, create a component or a `className` helper.
- Use design tokens / shared styles where applicable (e.g., common button variants).
- Avoid one-off arbitrary values unless they’re truly needed.

---

## Accessibility & UI Quality

- All interactive elements must be keyboard accessible.
- Use semantic HTML first (`button`, `a`, `label`, `fieldset`, etc.).
- Ensure focus states exist and are visible.
- Forms:
  - Always label inputs (visible label or `aria-label` with care).
- Images:
  - Use meaningful `alt` text or empty alt (`alt=""`) for decorative images.

---

## Error Handling & Empty States

- Always define:
  - loading state (Suspense fallback)
  - empty state (no results)
  - error state (recoverable messaging where possible)
- Error messages should be actionable (what happened + what the user can do).

---

## Repository Guidelines

## Project Structure & Module Organization
- `README.md` documents the product requirements and system overview.

## Build, Test, and Development Commands
Frontend (run from `/`):
- `pnpm install` installs dependencies.
- `pnpm dev` starts the local dev server.
- `pnpm build` creates a production build.
- `pnpm start` serves the production build.
- `pnpm lint` runs Biome checks.
- `pnpm lint:fix` runs Biome checks and applies safe fixes.
- `pnpm format` formats code with Biome.

Supabase utilities:
- Types: `npx supabase gen types typescript --project-id <id>` writes `lib/supabase/database.types.ts`.

## Coding Style & Naming Conventions
- TypeScript/React uses strict TS settings and 2-space indentation.
- Biome is configured in `/biome.json`.
- Python uses 4-space indentation; keep module names lowercase with underscores (e.g., `ingestor.py`).
- Use the `@/*` alias for imports under `/*`.

## Testing Guidelines
- Automated tests are not wired up yet.
- Placeholder: when tests are added, run `pnpm test` from `/`.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat:`, `fix:`, `chore:`).
- PRs should include a concise summary, linked issue (if any), and screenshots for UI changes.
- Call out any required environment variables or migration steps.

## Security & Configuration Tips
- Do not commit secrets. Use local `.env` files.
- Frontend env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SECRET_KEY`.
- CV env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `CAMERA_SOURCE`, `ROOM_ZONE_MAP`, `YOLO_MODEL`.

---

## Quick “Do / Don’t” Summary

- ✅ Fetch DB data in top-level Server Components; pass down as props.
- ✅ Wrap only the data-blocking component in Suspense; use an exact UI fallback.
- ✅ Use `useRef` for non-UI-updating values.
- ✅ Split big components and single-responsibility hooks.
- ❌ Don’t use `any` or `void` to bypass types.
- ❌ Don’t sprinkle `useMemo` everywhere.
- ❌ Don’t wrap whole pages in Suspense if only one child blocks.
