# UNLV Mountain Club Web App

Public community hub, trip calendar, gallery, and membership system for the
UNLV Mountain Club.

## What is here

- Involvement-fair entry point at `/welcome`
- Community action chooser at `/join`
- Public Fall 2026 calendar and gallery
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
