# UNLV Mountain Club Web App

Web app for the UNLV Mountain Club

## What is here

- Public pages: home, about, team
- Member pages: membership, calendar, profile
- Auth and data via Supabase
- Maps and geo utilities for trips
- Payments and dues via Stripe

## Tech stack

- Next.js (App Router)
- React
- Supabase (auth + database)
- Tailwind CSS + shadcn/ui
- MapLibre + react-map-gl
- Stripe (payments)
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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_SECRET_KEY=
```

## Scripts

- `pnpm dev`: start Next.js in development mode
- `pnpm build`: create production build
- `pnpm start`: run production server
- `pnpm lint`: run eslint

## Repository layout

- `app/` Next.js app routes, layouts, and pages
- `components/` shared UI components
- `lib/` helpers and shared utilities
- `hooks/` custom hooks
- `public/` static assets
- `supabase/` database and auth helpers

## Deployment

Production deploys are handled by Vercel. Pushing to `main` triggers a production build. Preview deployments are created per PR.

## Operations

See `RUNBOOK.md` for infra ownership, access, and incident response.

## Contributing

- Use `feature/*` branches for new work
- Keep changes scoped and PR-ready
- Update `RUNBOOK.md` when infra changes
