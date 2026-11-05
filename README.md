# UNLV Mountain Club Web App

Public community hub, trip calendar, gallery, and membership system for the
UNLV Mountain Club.

## What is here

- Involvement-fair entry point at `/welcome`
- Community action chooser at `/join`
- Public event calendar and gallery
- Account-linked membership sign up at `/membership-sign-up`
- Member profile, trip, and officer tools
- Auth and data via Supabase
- Maps and geo utilities for trips
- Current dues through Zelle with officer confirmation
- Disabled Stripe checkout skeleton for a possible future upgrade

## Tech stack

- Next.js (App Router)
- React
- Supabase (auth + database)
- Tailwind CSS + shadcn/ui
- MapLibre + react-map-gl
- Stripe (disabled future checkout skeleton)
- Vercel (hosting)

## Getting started

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Configure environment variables

   Create `.env.local` with the values listed below.

3. Run the dev server

   ```bash
   pnpm dev
   ```

Open `http://localhost:3000`.

## Environment variables

Set these in `.env.local` for local dev and in Vercel for deployments.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=https://unlvmountainclub.com
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
# Set only after the production email checks in AUTH_RUNBOOK.md pass:
AUTH_EMAIL_DELIVERY_VERIFIED=false
NEXT_PUBLIC_DISCORD_INVITE_URL=
NEXT_PUBLIC_INSTAGRAM_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_MEMBERSHIP_PRICE_ID=
STRIPE_LIVE_MODE=false
MEMBERSHIP_CHECKOUT_ENABLED=false
```

`SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the
Stripe Price ID are server-only. Never prefix a Stripe secret key with
`NEXT_PUBLIC_`. Hosted Checkout does not need a publishable Stripe key in the
browser.

Production and preview deployments must use different Supabase projects and
Stripe modes if online checkout work resumes. Current membership dues use Zelle
and the officer review flow. Stripe Checkout remains disabled unless every
future payment release gate in `RUNBOOK.md` has passed.

The canonical production site is `https://unlvmountainclub.com`.
`https://unlvmountain.club` redirects to the canonical domain.

Authentication setup, email templates, CAPTCHA rollout, redirect allowlists,
and release acceptance checks are in [AUTH_RUNBOOK.md](AUTH_RUNBOOK.md).
Production builds block missing auth keys, Turnstile test keys, or missing email-delivery sign-off.

## Scripts

- `pnpm dev`: start Next.js in development mode
- `pnpm build`: create production build
- `pnpm start`: run production server
- `pnpm check`: run Biome formatting and lint checks
- `pnpm typecheck`: run strict TypeScript checks
- `pnpm test`: run automated tests
- `pnpm test:admin:production`: run read-only checks against the configured
  Supabase project, including bootstrap admins, private-table access, gallery
  inventory, and required admin RPCs
- `pnpm supabase:check-link`: stop before a database command if the CLI is
  linked to a different project than `.env.local`
- `pnpm test:membership:sandbox`: run the synthetic membership-access test with
  sandbox Supabase admin credentials
- `pnpm generate:fair-qr <production-url>`: make M and Q print candidates

## Git hooks

This repo uses Lefthook for pre-commit and pre-push checks.

- `pnpm install` runs `pnpm prepare`, which installs Git hooks in a Git checkout and safely skips them in deployment uploads
- If you installed dependencies before hooks were added, run `pnpm prepare` once

## Repository layout

- `app/` Next.js app routes, layouts, and pages
- `components/` shared UI components
- `lib/` helpers and shared utilities
- `hooks/` custom hooks
- `public/` static assets
- `supabase/migrations/` database changes and security policies
- `tests/` automated and database-contract tests

## Deployment

Production deploys are handled by Vercel. Pushing to `main` triggers a production build. Preview deployments are created per PR.

## Operations

See `RUNBOOK.md` for infra ownership, access, and incident response.

Trip registration setup, notification delivery, pilot gates, local acceptance, and recovery are documented in [RSVP_RUNBOOK.md](RSVP_RUNBOOK.md). Annual waiver content review, migration, trip risk revisions, guardian signing, and record retention are documented in [ANNUAL_WAIVER_RUNBOOK.md](ANNUAL_WAIVER_RUNBOOK.md).

### Reproduce the database locally

The migration history starts after the original application tables were created.
Keep those applied migrations unchanged. A bare `supabase db reset` cannot
reconstruct this repository's application schema from migrations alone. The
supported clean replay uses the committed checkpoint in
[`supabase/baseline.json`](supabase/baseline.json):

```bash
pnpm test:db:replay
pnpm test:registration:db
```

Both commands require the already running local Docker container
`supabase_db_mtn-auth-integration` (configured in `tests/integration/supabase/`).
They create uniquely named `mtn_replay_*` databases from `template0`, copy only
the local stack's platform schema definitions, then restore
`supabase/schema-only.sql` and `supabase/baseline-reference.sql`. The reference
file restores the historical RBAC catalogs and default settings, with no users
or role assignments. The checkpoint covers the 30 migrations through
`202609030001_admin_production_hardening.sql`; checksums protect that snapshot
and its covered migration files. Every subsequent migration runs in filename
order, including bootstrap reconciliation. No later migration is skipped.

`scripts/database-baseline.mjs` is the shared replay plan; registration tests
use exactly the same path before adding their own fixtures. The standalone
check verifies that replay succeeds, application tables contain no users,
trips, or account role assignments, and the current waiver RPC exists. Both
commands drop their throwaway database on completion and leave the shared
stack running. They accept no remote URLs, credentials, or database targets.
No application data is copied from the local stack.

This checkpoint is a local reconstruction mechanism, not a production
migration or a migration-history repair. Do not apply it to an existing
database. Add future changes as new migrations after the checkpoint; do not
edit the pinned snapshot, reference catalogs, or historical migrations.
`supabase/seed.sql` is intentionally empty. Email `content_path` values resolve
from the project root, as shown in the [Supabase template documentation](https://supabase.com/docs/guides/local-development/customizing-email-templates);
seed paths resolve from `supabase/`.

Annual waiver date-only validity uses `America/Los_Angeles`, matching
`CLUB_TIME_ZONE` in `lib/events/formatters.ts`. Signing, guardian verification,
waiver selection, and trip coverage share this business calendar even if a
session or trip display uses another timezone. Existing signed evidence is
immutable and is not rewritten by the timezone migration.

### Supabase CLI ownership

The GitHub identity used for this repository does not need a seat in the
Supabase organization. Authenticate the CLI with a scoped personal access token
created by the Supabase account that owns the project, then link this checkout
to the project referenced by `NEXT_PUBLIC_SUPABASE_URL`.

```bash
export SUPABASE_ACCESS_TOKEN="..."
pnpm exec supabase unlink
pnpm exec supabase link --project-ref "..."
pnpm supabase:check-link
pnpm exec supabase migration list
```

Never commit the token. Before repairing or pushing migrations, confirm that
the linked project ref is the same ref at the beginning of the configured
Supabase hostname. Only one operator should push database migrations at a time.
If SQL was applied manually, use `migration repair --status applied` only after
verifying that exact migration's schema changes are already present.

## Contributing

- Use `feature/*` branches for new work
- Keep changes scoped and PR-ready
- Update `RUNBOOK.md` when infra changes

### Account membership review

`/admin/membership` includes all auth accounts (including accounts without a
profile or membership application). New accounts start with payment pending.
An authorized payment reviewer can confirm dues to grant the existing 12-month
membership term or grant documented complimentary access without creating a
payment record. Applications identifying a minor still require guardian consent.
Rejected reviews move to the Archive tab and return to the active queue after a
new payment claim or an administrator reopens them.

Apply the `202609040001` through `202609040007` membership migrations before
releasing this change. No new environment variables are required. The migrations
also allow confirmation when an applicant has not personally reported payment,
record optional age declarations, and make complimentary grants retry-safe.
Database regression checks are in `tests/account-membership-review.sql`; run them
against a disposable database with the migrations applied. The fixtures roll back.

See [FORM_SYSTEM.md](FORM_SYSTEM.md) for the shared form language, showroom, flow boundaries, and rollout checks.

## Announcements

`/admin/announcements` manages reusable homepage notices and their full public
pages. Staff with `announcements.read` can list/preview them;
`announcements.manage` permits create, edit, publish, archive, and delete.
The migration grants these to the corresponding existing gallery roles;
super admins retain full access and can adjust grants in Leadership & Access.

Schedules use **America/Los_Angeles**, independent of the editor's device zone.
Published notices become public at `starts_at`. The homepage selects at database
request time with inclusive start and exclusive end. Overlaps resolve by newest
start, creation time, then ID; the editor warns about them. Expired published
notices remain at `/announcements/[slug]`; drafts, future notices, and archived
records are hidden from public queries by RLS. No scheduler or cron is needed.

The body supports paragraphs, `## headings`, `- lists`, and
`[label](https://example.com)` links. HTML is escaped, and links are restricted to
HTTP(S) or local paths. Desktop/mobile card previews and a full-page preview use
the same components as the public routes. Card copy is limited to two lines per
section so long notices do not take over the homepage.

Migrations: `supabase/migrations/20260908193944_announcements.sql` and
`supabase/migrations/20260908200620_announcement_author.sql`.
New notices save the creating admin’s display name as their public byline.
Later edits preserve the original author; the first notice is credited to Dax Whitaker.
The optional, idempotent `supabase/seeds/first-announcement.sql` publishes Dax's
September 15, 2026 meeting notice through midnight that night in Pacific time.
The app works without seed data. This migration and first notice were applied to
both `mtnclub-auth-preview` and `mtnclub-webapp`; migration history is recorded in
both. Application deployments follow the main-branch Vercel workflow.

Validation: `pnpm test`, `pnpm test:auth:browser`, `pnpm typecheck`, `pnpm lint`,
and `pnpm build`. `tests/announcements.sql` checks real database scheduling,
public access, and admin CRUD in a transaction that always rolls back. It needs
an existing super-admin assignment. Run it with the Supabase SQL query tool
against the intended environment; it does not retain test notices.

Admins authorized for `overview.read` have full member content and participation
access without buying or receiving a membership. Their assigned admin capability
scopes still apply, and suspension/bans still block access. The shared
`is_active_member` authorization helper includes these admins; actual membership
reporting continues to use `has_membership_access` / `get_my_membership_access`.
UI access gates use `membershipAccessLevel === 'full'` rather than `isMember`.
Regression coverage lives in `tests/admin-member-access.sql` and
`tests/viewer-access.test.mjs`.

Event editing interprets date inputs in the stored event timezone, preserves
unchanged timestamps (including seconds), and reports registration deadline
conflicts before saving. Server-side assignment loaders require explicit
`service_role` grants on `trip_leaders`, `trip_private`, and `trip_tag_options`.
Coverage: `tests/trip-edit-dates.test.mjs` and `tests/trip-editing.sql`.

### Official schedule and event synchronization

`/schedule` reads published and canceled official events directly from `trips`,
with current dates, titles, host credits, and cancellation reasons. Only public
and minimal-visibility events appear. Archived, deleted, and unofficial events
are omitted. Existing Fall 2026 schedule URLs resolve to the live event and
return not found when it is removed. The calendar also uses only live event
records, and `/trips` is no longer limited to the original Fall 2026 date range.
Create, edit, official-status, and lifecycle actions refresh all three views.
Database failures show retryable errors instead of a stale static schedule.
No database migration or new environment variable is required.
