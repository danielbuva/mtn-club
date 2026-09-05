# Trip registration operations

Registration ships closed globally and on every trip. This document describes the release gates and recovery procedure; it is not evidence that the hosted environment has passed them. Keep credentials and guardian evidence out of this document, source control, and application logs.

## Implementation verification — September 4, 2026

- Applied registration migrations `202609040008`–`202609040017` to preview `mtnclub-auth-preview` (`qarabfhyyekjqmzsuhzo`) and production (`maubinlyxzwqnjbrkeht`) through authenticated, transactional migrations. Existing RSVP history was retained; production had one legacy registration at release verification.
- Local acceptance passed: 85 application/unit tests, 11 database scenarios (including the SQL workflow, requirements, and authorization suites), and five browser journeys against a production build. Browser coverage includes mobile registration, all seven waiver provision initials, waitlist selection, expiry/reoffer, acceptance, cancellation, guardian review, keyboard submission, protected roster export, email-preference persistence, and the separate trip-lifecycle controls.
- Strict TypeScript and full Biome checks passed. Production-build browser tests also verify that a first anonymous registration request redirects before streaming, preserving the exact sign-in destination without the Next 16.1 Cache Components redirect crash.
- Hosted preview acceptance used only synthetic accounts and nonbinding fixture documents. It demonstrated confirmation, waitlisting, manual offers, acceptance, minor guardian review, expiry, a delivered test-recipient message, a bounced test-recipient message, and a suppressed opted-out offer. Resend test-recipient delivery proves provider/webhook processing, not delivery to a human inbox.
- Dedicated Resend sending credentials, verified sender `UNLV Mountain Club <trips@unlvmountainclub.com>`, separate signed delivery webhooks, and minute-by-minute Supabase Cron workers are configured in both hosted environments. Production received and verified real provider delivery/bounce events; worker health and responses were checked. Authentication email settings are unchanged.
- The configured production pilot is **Black Mountain Hike**, September 13, 2026 (`771c7bce-afc2-44de-acf5-5b5268ff1bbb`). It requires active membership, confirmed emergency contact, and the completed UNLV RSO waiver. Its explicit deadline is **September 12 at 6:00 p.m. America/Los_Angeles** (`2026-09-13T01:00:00Z`) because the trip time is TBA. Other trips remain closed; verify the global switch and pilot after each deployment.

## Interfaces and ownership

- Participants register, complete requirements, review offers, update emergency contacts, and cancel at `/trips/[tripId]/rsvp`. `/profile/trips` is the persistent in-app fallback when email is disabled or delayed.
- Trip managers use `/admin/trips/[tripId]/registrations`. Authorized community-trip creators use `/trips/[tripId]/registrations` without entering the admin shell. Public host attribution grants no management access.
- Settings administrators use `/admin/registration` for the global switch, worker health, pending-job age, and failed/bounced delivery records.
- Officers with `membership.confirm_guardian` use `/admin/membership/trip-guardian-reviews`, linked from Membership. This queue exposes only the participant identity, trip, and relevant waiver; it does not grant roster access or reveal answers/emergency contacts.
- The trip pages consume `lib/registration/schema.ts` and `lib/registration/server.ts`. `TripRegistrationSnapshot` separates registration state, trip availability, eligibility, missing requirements, counts, valid offer, revision, and allowed commands. Keep personalized snapshots outside shared caches.
- All registration mutations use `registration_command`, settings use `save_registration_settings`, and service account merges use `merge_trip_registrations`. Do not reintroduce direct RSVP, response, signature, offer, or attendance writes. Every retry retains its request ID and original expected revision.

## Deployment and migration order

1. Use Node 22 or newer and the checked-in pnpm lockfile. Verify the intended Supabase project with `pnpm supabase:check-link` before a hosted schema operation.
2. Apply existing authentication and membership migrations first, then `202609040008_registration_schema.sql` through `202609040014_registration_merge.sql` in timestamp order, along with any subsequent repository migrations. The committed `supabase/schema-only.sql` is a **test baseline**, not a production reset script.
3. Deploy the matching application with `REGISTRATION_EMAIL_ENABLED=false`. Both registration switches default to false. Existing confirmed RSVPs remain confirmed; no legacy record is treated as a new signature. `maybe` and `invited` become `legacy_review`, with no invented offer.
4. Check legacy over-capacity trips and missing requirements in the roster. Complete initial settings before requesting legacy participants to update their details. The first valid new submission or response completion freezes eligibility, questions, and waiver requirements/version. Legacy review stays review until an organizer selects an offer; it can also be voluntarily canceled.
5. Configure one nonpublic test environment, then the production sender, worker, and webhook as below. Verify signed-in and anonymous access, cancellation with expired membership, opt-outs, and delivery using controlled accounts. Never send synthetic fixtures to real members.
6. Supply the approved waiver and verify the guardian-review process. Enable only the configured pilot trip and then the global switch. Verify confirmation, waitlisting, manual seat selection, acceptance, expiry, cancellation, roster privacy, and delivery before enabling other trips.

The application-schema test runner reconstructs a disposable database from the committed baseline and subsequent migrations. It excludes the environment-specific `202609040007` administrator bootstrap seed.

## Environment and delivery setup

Keep authentication email settings unchanged. Registration uses its own Resend sending key and verified sender.

| Variable | Use |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical HTTPS origin for authenticated review links |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Existing application Supabase connection |
| `SUPABASE_SECRET_KEY` | Existing server-only Supabase service identity |
| `REGISTRATION_EMAIL_ENABLED` | Explicitly `true` only after delivery checks; otherwise emails stay queued |
| `REGISTRATION_RESEND_API_KEY` | Dedicated, narrowly scoped Resend sending key |
| `REGISTRATION_EMAIL_FROM` | Verified sender, for example the club's configured name and email address |
| `REGISTRATION_WORKER_SECRET` | Random server-only bearer secret, at least 32 characters |
| `REGISTRATION_RESEND_WEBHOOK_SECRET` | Resend/Svix signing secret for this environment's delivery webhook |

Configure Resend delivery, bounce, and failure events to POST to `/api/registration/webhook`. The handler verifies the signature over the original body, rejects stale/tampered requests, and deduplicates event IDs. Provider acceptance is `sent`; a signed delivery event changes it to `delivered`. Early delivery events are retained and reconciled after the worker saves the provider ID.

In Supabase Vault, create `registration_worker_url` with the full HTTPS `/api/internal/registration/process` URL and `registration_worker_secret` with the same worker secret as the application. Apply `scripts/configure-registration-cron.sql` to that verified environment. It configures one named job every minute using Cron and pg_net, with secrets looked up from Vault at execution time. For protected previews, store the existing Vercel automation secret as `registration_vercel_bypass` in Vault. The Cron request includes it as a header. The preview Resend endpoint uses the equivalent query parameter; keep its complete URL secret. Vercel login protection remains enabled.

The endpoint accepts POST only. GET links never mutate registration or accept offers. A missing/wrong worker token returns 401. Email stays disabled in local browser tests.

Reference: [Supabase Cron](https://supabase.com/docs/guides/cron), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).

## Trip configuration and participant requirements

- Eligibility defaults to active members. Provisional membership does not qualify. Signed-in-account eligibility is independent of listing visibility. Restrictions still block registration, offers, and check-in.
- Official trips default to an emergency contact and waiver; community trips default to neither. The organizer editor supplies the UNLV RSO August 2022 template and fills only its event, date, sponsor, and activity-specific risk fields. Review the completed text before opening. The original template is retained at `/legal/unlv-rso-waiver-template-2022.docx`; the immutable document records its source URL.
- Waiver documents and signature evidence are immutable. The evidence contains the exact document/version reference, typed name, original account identity, and server signing time. Standard-template signatures also retain seven provision initials, participant birth date and contact details. These fields are private and immutable. A correction requires an explicit new version before requirements freeze, or a separately reviewed trip/configuration; never rewrite signed evidence.
- A participant confirms the contact copied from their profile and may change the trip copy without losing a seat. Emergency details and answers are visible only to their owner and authorized managers; registration discloses this access. Ordinary email/phone sharing follows profile privacy choices.
- Adults keep their existing declaration. A minor requests guardian review without reserving a seat. An officer with `membership.confirm_guardian` verifies the parent or guardian’s identity and authority, the signature on the exact waiver/version, and completed participant/emergency details, then records the guardian name, date signed, retained-document reference, and verification evidence. Each review appends immutable evidence. A child cannot sign the adult waiver. Retain the actual signed document in restricted club storage; the app stores a reference, not a file upload. This is independent of dues confirmation. Required-waiver consent is tied to the trip and current waiver. General confirmed membership guardian consent is reusable only when no trip waiver is required. Do not use the evidence field for unnecessary sensitive documents.
- Questions support text, one choice, multiple choices, and yes/no. A required “no” is a valid answer. Unknown answers, altered choice values, stale forms, and incomplete requirements are rejected at the database boundary.
- The deadline defaults to trip start. All-day/TBA trips require an explicit deadline before opening. Settings show UTC; participant times show the trip's named time zone. Deadlines must be no later than trip start. Revoke affected offers before moving a deadline earlier.
- Capacity includes confirmed people and unexpired offers. A waitlist prevents new arrivals bypassing existing requests. Disabling the waitlist prevents new entries but preserves the queue. Organizers manually choose an eligible, complete participant; no automatic promotion occurs.
- Offers default to 24 hours, configurable from 1 to 168 hours and capped at registration close. Expiry returns the same queue timestamp. Declining cancels; voluntary cancellation followed by rejoining gets a new timestamp. Removal blocks self-rejoining until an organizer restores access.
- Present/absent/unmarked attendance is organizer-recorded. Present requires current eligibility and completed requirements. Corrections append actor/time events. Membership expiry flags confirmed participants for review and does not silently remove their seats.

## Email preferences and consent

`/profile/user/privacy` is the authoritative email-settings screen. The former Notifications screen links there. General profile saves do not overwrite notification preferences.

- Master club email, updates for registered trips, reminders, and schedule/safety changes default on. Club announcements, general club updates, and member stories default off for new accounts.
- Existing explicit choices, the legacy trip-email switch, and mailing-list unsubscribe choices are preserved. The former announcement preference also provided the reminder opt-out; it remains the fallback until the user explicitly saves the separate reminder choice.
- Master-off suppresses all club categories, including offers, without discarding individual category choices. Sign-in/security email and payment receipts remain separate. The registration screen and My trips provide status and pending offers without email.
- Saves are transactional, validate every choice, reject stale email edits, and append consent history. Account merging retains opt-outs from either identity.
- Mailing-list exports are separately filtered for announcements, general updates, and member stories, including the master switch and mailing-list consent. Use the matching export immediately before a campaign. These settings do not themselves schedule or send marketing campaigns.
- Registration email includes a direct link to this screen. Email choices are separate from profile/contact visibility.

## Notification behavior and recovery

Registration events and jobs commit together. Every send rechecks the master email choice, trip updates, and legacy trip-email preferences; reminders additionally honor the trip-reminder choice. Time/location changes and trip cancellation additionally honor the schedule/safety choice. Suppressed offer emails do not withdraw the offer. Participants must check My trips when email is disabled. The worker skips expired offers and obsolete confirmations/reminders.

The worker claims five jobs per request with two-minute leases, up to six attempts, exponential backoff capped at one hour, and a stable `registration/<job UUID>` Resend idempotency key. HTTP 429, provider 5xx, timeouts, and malformed provider responses are retried. Permanent failures remain inspectable. Interrupted leases can be reclaimed; an expired final lease becomes `delivery_unknown`.

Inspect `/admin/registration` after each release and during the pilot. Investigate a heartbeat older than three minutes, growing oldest-pending age, `worker_failed`, `email_not_configured`, failed jobs, or bounces. Check the Cron run history and application response status without logging secret headers or message contents. A healthy heartbeat alone does not prove delivery.

For provider outages, leave registrations and in-app status available. Fix sender/key/quota configuration and allow pending jobs to retry. For `delivery_unknown`, check the provider's message history before replaying anything: jobs with previous attempts older than 23 hours are not automatically resent because the provider's deduplication window may have elapsed. Do not blindly reset attempts or create a new job ID. For a verified unsent permanent failure, an authorized database operator may requeue the same job after resolving its cause, preserving its dedupe key and audit context. If delivery cannot be established safely, use the in-app status and document the resolution.

Never log answers, emergency contacts, signature names/text, guardian evidence, or email bodies. Application logs contain failure categories; event/job IDs and timestamps are available to authorized operators for investigation. CSV exports contain private roster data and should be handled as restricted records.

## Local acceptance

Start Docker and the isolated Supabase stack:

```sh
SUPABASE_AUTH_CAPTCHA_SECRET=1x0000000000000000000000000000000AA pnpm exec supabase start --workdir tests/integration
pnpm test
pnpm test:registration:db
pnpm typecheck
pnpm check
```

The database suite creates/drops only a temporary database inside `supabase_db_mtn-auth-integration`; it never accepts a hosted URL. Tests cover competing seats/offers, retries, acceptance/cancellation, capacity races, expiry without the scheduler, requirements, permissions, merges, leases, opt-outs, and webhook reconciliation.

For browser tests, the local stack's `postgres` application schema must first have the committed baseline and subsequent migrations applied (use the authentication integration setup for the baseline). This is a disposable local setup only. Then run:

```sh
pnpm test:registration:browser
REGISTRATION_PRODUCTION_TEST=true REGISTRATION_TEST_PORT=3172 pnpm test:registration:browser
```

The browser suite uses real local authentication and database sessions, creates synthetic users/trips, tests mobile registration through organizer offers and acceptance, verifies protected export and login return destinations, then removes its fixtures. It runs on port 3140 in `.next-registration-browser`, separately from the normal development server. The second command builds and tests production output against the same local services with sending disabled on an alternate port. Use an isolated worktree when another task is running or editing the application.

Hosted release acceptance still requires real supplied waiver content, officer guardian review, verified sender/webhook/Cron operation, a controlled delivered message and opt-out check, and a successful pilot. Local tests do not replace these checks.

## Closing and rollback

Use `/admin/registration` to close new registrations/offers globally, or close one trip in its settings. Existing valid offers remain acceptable, cancellation remains available until start, and status/history remain readable. Canceling a trip revokes its offers, closes registration, cancels active registrations, and queues notifications; republishing does not reopen registration or restore canceled seats automatically.

For a delivery incident, set `REGISTRATION_EMAIL_ENABLED=false`; scheduled offer cleanup continues. For a worker incident, fix or temporarily unschedule `registration-worker`, understanding that reads and mutations still enforce expiry using database time. Keep the signing and registration tables intact. Do not roll back to application code that directly writes the old RSVP tables; use a compatible application release with new activity closed. Preserve history and signature provenance during recovery and account merges.

## UNLV template provenance and records

Source: [UNLV RSO risk management](https://www.unlv.edu/sia/student-orgs/registration/understanding-risk-management) and the linked August 2022 standard waiver and September 2023 FAQ. The legal provisions are preserved; organizers supply the actual activity and risks. An electronic signature is tied to an authenticated account, explicit agreement, immutable content/version, and database time. Do not sign on another participant’s behalf or represent a test fixture as consent. Participants who cannot make a listed declaration must contact an organizer before signing.

The guardian workflow verifies an externally signed document and records the date supplied on that document, separately from the officer’s server review time. It does not fabricate a parent’s signature or signing timestamp. Keep signed records indefinitely until the club adopts a reviewed retention policy; this release has no automatic evidence deletion. Guardian and signature provenance survives account merging.
