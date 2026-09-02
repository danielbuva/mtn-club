# UNLV Mountain Club Operations Runbook

This document contains no secrets. Credentials, recovery codes, banking details, and identity-verification information belong in the club's private Bitwarden organization.

## Table of contents

1. [System overview](#1-system-overview)
2. [Ownership and access](#2-ownership-and-access)
3. [Deployments and environments](#3-deployments-and-environments)
4. [Public fair release](#4-public-fair-release)
5. [Supabase changes](#5-supabase-changes)
6. [Gallery operations](#6-gallery-operations)
7. [Membership release gate](#7-membership-release-gate)
8. [Membership operations](#8-membership-operations)
9. [Incident response](#9-incident-response)
10. [Leadership transfer](#10-leadership-transfer)

## 1. System overview

| Service | Purpose | Required ownership |
| --- | --- | --- |
| GitHub | Source and CI | Club organization |
| Vercel | Hosting and environment configuration | Club team |
| Supabase | Auth, database, and gallery storage | Club organization |
| Stripe | Disabled future one-time checkout skeleton | Club organization |
| Namecheap | Domain and DNS | Club-controlled account |
| Bitwarden | Secrets and recovery material | Club organization |

The public involvement-fair flow is `/welcome` → `/join`. Open community invites and weekly meets are free; member-only Discord invites are separate. `/membership-sign-up` creates the person's account and records the membership form. Current $25 dues are sent through Zelle to `(702) 217-9376`; `/membership` is a private account-status page. Club leadership verifies Zelle activity and confirms membership in `/admin/membership`.

The canonical production origin is `https://unlvmountainclub.com`. `https://unlvmountain.club` is a secondary domain and should permanently redirect to the canonical origin.

## 2. Ownership and access

- At least two current officers must have appropriate access to production infrastructure and the private vault.
- Stripe and its payout bank must never be controlled only by a personal account.
- Use password-manager-generated credentials and authenticator-app TOTP.
- Store recovery codes in the private vault. Do not use SMS as the only second factor.
- Review access at every officer transition and remove former officers.

## 3. Deployments and environments

Production deploys from `main`; pull requests receive preview deployments. CI runs dependency installation with the lockfile, TypeScript, Biome, tests, and a production build.

Required public configuration:

- `NEXT_PUBLIC_SITE_URL=https://unlvmountainclub.com`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_DISCORD_INVITE_URL`
- `NEXT_PUBLIC_INSTAGRAM_URL`

Required server-only configuration for Supabase administration:

- `SUPABASE_SECRET_KEY`

Future Stripe configuration, required only if online checkout work resumes:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MEMBERSHIP_PRICE_ID`
- `STRIPE_LIVE_MODE`
- `MEMBERSHIP_CHECKOUT_ENABLED`

Never place a Stripe secret in a browser-public environment variable. If that ever happened, rotate it and inspect historical deployment logs and browser bundles. Preview deployments must use a separate Supabase test project and Stripe test mode; they must never create test payments or memberships in production.

`MEMBERSHIP_CHECKOUT_ENABLED=false` is the current production setting and blocks new Checkout Sessions inside the server action. It does not disable the webhook, so an already-created valid Session can still finish safely.

## 4. Public fair release

Before printing or publishing the fair sign:

1. Confirm the production Discord invite, Instagram link, Involvement Center link, contact email, schedule, and membership price.
2. Review the generated Thursday, November 26 meetup. It is withheld by default pending an officer decision about the Thanksgiving closure.
3. Deploy with `MEMBERSHIP_CHECKOUT_ENABLED=false`.
4. Generate print candidates with `pnpm generate:fair-qr https://unlvmountainclub.com`.
5. Test both M and Q candidates at final physical size, then keep the one that scans most reliably.
6. Test the actual sign under glare, shadows, angles, slow cellular service, Discord installed and not installed, and older/newer iOS and Android phones.
7. Print readable `/welcome` and Discord-invite fallbacks below the QR.

The encoded campaign destination is `/welcome?source=fall-2026-involvement-fair`. Analytics are anonymous, may fail without blocking navigation, and must never contain identity or payment data.

## 5. Supabase changes

The September 2026 feature migrations are applied in production. They add the public Fall 2026 schedule and host credits, gallery storage and metadata, membership applications, provisional read access, Zelle confirmation, future payment entitlements, webhook processing, officer review actions, and public-policy fixes. The generated TypeScript types come from the resulting live schema.

The Fall 2026 schedule migration keeps public host credits separate from authenticated `trip_leaders`; public credit never grants application access. New service functions are revoked from anonymous and ordinary authenticated clients unless a migration explicitly exposes a safe, self-only RPC.

Before future schema work, apply migrations in timestamp order to a separate Supabase test project, run application CI and SQL contract tests, then apply to production and re-run the Supabase security and performance advisors. A production backup is not required for this project by current club policy.

Supabase leaked-password protection requires the Pro plan and is intentionally deferred. Enable and test it if the project upgrades.

## 6. Gallery operations

The public `/gallery` reads only published metadata. Officers use `/admin/gallery` to upload, add required alt text, link an optional trip, order, publish, unpublish, or remove photos. The `club_gallery` bucket permits JPEG, PNG, WebP, and AVIF images up to 10 MB.

Before publishing a photo, confirm that the club may publish it, that the alt text describes the image, and that its title/caption do not expose private trip logistics or personal information. Existing cover art is not automatically club history.

## 7. Future Stripe release gate

Checkout must remain disabled until every item below is complete:

- President and treasurer approve $25, the 12-month term, refund rules, benefits, and nonstudent eligibility.
- The rules are checked against the current constitution and current UNLV student-organization requirements.
- Age/minor policy, privacy notice, dues notice, and refund notice are published.
- Each advertised benefit exists and its limits are accurate.
- Stripe onboarding, organization-controlled banking, charges, and payouts are enabled with at least two current officers holding appropriate access.
- Separate $25 USD one-time Prices exist in test and live mode.
- The production webhook points to `/api/stripe/webhook` and is healthy.
- The separate Supabase test project passes successful payment, cancellation, delayed/failed payment, invalid signature, duplicate/reordered delivery, simultaneous Sessions, renewal, expiry, leap day, refund, dispute, restriction, RLS, and review-queue tests.
- One controlled live purchase and full refund has succeeded.

Only after sign-off should production receive `MEMBERSHIP_CHECKOUT_ENABLED=true`. The webhook remains enabled at all times.

## 8. Membership operations

The membership model separates account restriction, club role, payment-backed entitlement, and explicit access override. Suspension or banning always wins. The client receives only safe payment-history fields and never sees Stripe or webhook identifiers.

Current Zelle applications appear at `/admin/membership`:

- Cross-reference the applicant's paid declaration with the club's Zelle activity for `(702) 217-9376`.
- Applicants who mark dues paid receive provisional read-only member access. They cannot create trips, RSVP, join carpools, comment, or use other member mutations until leadership confirms them.
- A minor cannot receive provisional or full access until leadership records parent or guardian consent.
- Confirm membership only after the account email, dues payment, and age/consent checks all pass. Confirmation creates a 12-calendar-month access grant.
- If Zelle cannot be verified, do not confirm the application. Ask the applicant for their payment record and resolve the discrepancy outside the public dashboard.

Future Stripe review cases also appear at `/admin/membership` while the skeleton remains in the repository:

- A second distinct successful payment within 24 hours is recorded without an automatic extra year. Approve it only after confirming intent, or refund it.
- Partial refunds and refunds involving stacked renewals require review.
- A dispute suspends automatically only when its grant currently provides access; other disputes require review.
- Record a clear resolution. Never mark a Stripe refund resolved before its verified webhook updates the database.

For reconciliation, compare Stripe Events and Payments with `stripe_webhook_events`, `membership_checkout_attempts`, and service-only `membership_payments`. Never expose those base tables to clients. Failed webhook events remain retryable.

## 9. Incident response

### Site unavailable

1. Check the latest Vercel deployment and logs.
2. Check Supabase and Vercel service status.
3. Roll back the deployment if the incident started with a release.

### Payments unhealthy

1. Set `MEMBERSHIP_CHECKOUT_ENABLED=false` to stop new Sessions.
2. Leave `/api/stripe/webhook` active.
3. Inspect Stripe delivery attempts and failed `stripe_webhook_events`.
4. Reconcile any paid Session that did not receive an entitlement before re-enabling checkout.

### Suspected secret exposure

1. Disable checkout if Stripe may be affected.
2. Rotate the affected key or webhook secret in its provider.
3. Update Vercel and the private vault.
4. Inspect access/deployment logs and reconcile unexpected payments or writes.
5. Document impact and follow-up actions without placing secrets in GitHub.

## 10. Leadership transfer

At officer turnover, promote replacements in GitHub, Vercel, Supabase, Stripe, the registrar, banking, and Bitwarden. Remove former officers, rotate shared credentials and API keys, verify payout ownership, test recovery, and update this runbook. The club must not depend on one person's account or device.
