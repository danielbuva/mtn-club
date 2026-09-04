# Part One release verification

## September 3, 2026 — admin loading polish

The admin loading work preserves the authenticated shell, shares static copy
and filter/form controls, matches roster/settings field heights, and removes
decorative text-input shadows. It does not change database permissions or require
a migration.

Verified locally:

- 52 Node tests pass, including admin loading/layout regression contracts.
- 21 isolated authentication browser tests pass using mocked services.
- Typecheck and the standard production build pass.
- Full Biome check passes with the six existing unrelated image warnings.
- Read-only hosted Supabase checks pass: required admin tables and account RPC,
  both bootstrap super admins, Fall 2026 term, 40 gallery records, anonymous
  denial on the tested private tables, and zero unresolved deletion jobs.
- Supabase CLI link matches the application's configured project.

These results are not a production readiness certification. The read-only check
does not exercise signed-in under-permissioned users, payment mutations,
concurrency, account deletion, real email delivery, or external OAuth providers.

Before deployment:

- Complete disposable-database tests for payment/guardian permutations, role
  restrictions, concurrent trip publishing, and deletion retry/scrubbing.
- Complete manual admin mobile/desktop, keyboard, error-state, and loading-state
  acceptance. Source-level layout tests do not replace visual checks.
- Finish the SMTP and coordinated auth rollout in `AUTH_RUNBOOK.md`. Do not set
  `AUTH_EMAIL_DELIVERY_VERIFIED=true` without actual delivery verification.
- Verify the current deployment revision and production configuration. The
  Vercel connector returned 403 for this project's team during this check;
  production deployment status was not independently verified.
- Establish a schema-only baseline for disposable database creation. The first
  tracked migration, `20260304072736_add_trip_overview_sections.sql`, alters
  `public.trips`, but no tracked migration creates the original table. Matching
  remote migration history does not establish fresh-database reproducibility.
  Export the current schema without member data, review it, and restore it to an
  isolated instance with matching migration history before creating test users.
  Do not push a new baseline over production or mark unapplied SQL as applied.
  This session has neither `SUPABASE_DB_PASSWORD` nor `SUPABASE_ACCESS_TOKEN`
  available in its environment; do not paste either into chat.
  A local Supabase startup confirmed this failure with SQLSTATE `42P01` at the
  first migration. The CLI stopped its containers afterward; no production data
  was changed.
- Commit/release only the intended admin changes, preserving unrelated public
  home/auth fallback work in the working tree.

Do not run synthetic membership/payment/deletion tests against the hosted
production project, even if a test script wraps SQL in a rollback.
