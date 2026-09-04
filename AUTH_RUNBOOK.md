# Authentication release runbook

## Contract

Email/password, Google, and Discord are supported. New passwords require 12 Unicode characters with no composition rules; spaces and paste are allowed. Existing shorter passwords still work at login. The Account settings verification badge never grants or removes permissions. No database migration is needed.

**Security-driven revision awaiting owner approval:** retain email signup confirmation **on**, rather than the original instant-email-account decision. Supabase's native automatic linking and `mailer_autoconfirm=true` are not a safe combination for the requested same-email experience: automatic confirmation is not mailbox proof, and the upstream linking implementation treats otherwise unverified provider email as verified when autoconfirm is enabled. A frontend verification badge cannot fix that backend trust decision. Local configuration now uses confirmation-on; hosted configuration already does and was not changed. Do not turn it off to bypass delivery setup. If instant email accounts remain mandatory, stop this rollout and design/review a supported alternative before enabling same-email linking.

Membership signup authenticates first through the same CAPTCHA-protected signup/login pages, preserving `/membership-sign-up` as its destination. This supports all three methods and confirmation-on without another password or duplicate account. Its application action derives ownership from the server-verified session, rejects attempts to overwrite an existing application, and never deletes an auth account as cleanup. Existing multi-table application persistence is not transactional; failures explicitly tell the member to check status/contact support. Include partial-failure recovery in the isolated membership smoke test.

All generated auth links use `returnTo`; legacy `redirect` and callback `next` are accepted. Only safe site-relative destinations are allowed. Auth destinations and encoded auth loops are rejected. Nothing stores a return destination in local storage or derives it from a referrer. Successful email auth replaces the current document so server-rendered account state sees fresh cookies.

## Provisioning status — September 3, 2026

Managed Turnstile widgets are provisioned in the club's Cloudflare account:

| Environment | Widget | Public site key | Allowed hostnames |
| --- | --- | --- | --- |
| Production | UNLV Mountain Club — production auth | `0x4AAAAAAEmRrHqdCklnePYc` | `unlvmountainclub.com`, `unlvmountain.club`, `mtn-club-micromediaflash4s-projects.vercel.app`, `mtn-club-git-main-micromediaflash4s-projects.vercel.app` |
| Local development | UNLV Mountain Club — local development | `0x4AAAAAAEmRrTNThbU7-WVP` | `localhost`, `127.0.0.1` |

Both use managed mode without pre-clearance. Following Cloudflare's hostname guidance, production does not allow local hostnames. These site keys are public identifiers; widget secrets must never be committed.

- Vercel project `mtn-club` has the corresponding `NEXT_PUBLIC_TURNSTILE_SITE_KEY` values for production and development, verified by reading back each value. Preview is intentionally not configured until an isolated Supabase environment and exact preview hostname are selected.
- The ignored local `.env.local` contains the local widget's public key and `SUPABASE_AUTH_CAPTCHA_SECRET` for an isolated local Supabase instance. The real managed widget renders on the local login page. The existing local app still points at the hosted production Supabase project; **do not run synthetic auth tests against it**. The development widget is not compatible with the production widget's secret once production enforcement is enabled. Switch local auth testing to isolated Supabase before then. The Supabase CLI needs the local secret exported in its process environment when starting the local stack; Next.js reading `.env.local` does not export it to other commands.
- Hosted Supabase project `maubinlyxzwqnjbrkeht` has the production secret saved and provider set to `turnstile`. **Global enforcement remains disabled.** The management API returns a hash for secret fields, not the plaintext secret; functional token validation is still a release acceptance check.
- At Turnstile provisioning time, production was commit `b63cdd33b2fad4fa0724fd3f2583cc0d3a7cc7b2`, whose login form does not pass CAPTCHA tokens. Recheck the deployed revision before activation; enforcing CAPTCHA against that UI breaks email sign-in. This authentication release has not been deployed.
- Rechecked live Auth: confirmation remains required, minimum length is six, Google/Discord are enabled, **manual identity linking is disabled**, and custom SMTP is absent. The 12-character policy, manual linking, branded templates, explicit redirect allowlists, and delivery sign-off remain pending the coordinated rollout below. `AUTH_EMAIL_DELIVERY_VERIFIED` was not set.
- The owner selected **Brevo Free** for SMTP. The club-owned Brevo account, sender/domain authentication, SMTP credentials, and actual delivery tests are still pending. No paid plan or external account was created.

Next: configure and verify SMTP plus an isolated test environment, deploy the compatible auth release with the production site key, then enable Supabase CAPTCHA and complete the acceptance checks. Do not enable CAPTCHA just because the local widget is visible.

## Required configuration and rollout order

Do not enable global CAPTCHA or replace recovery templates before compatible application handlers are deployed. Do not create synthetic users in production.

1. Configure an isolated preview Supabase project with the same settings below. Configure Google and Discord on that project and enable manual identity linking. Add its Supabase provider callback URL in each provider console. Keep preview credentials separate from production.
2. Create a Cloudflare **managed** Turnstile widget with explicit production and approved preview hostnames. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Vercel **before building**. The secret belongs only in Supabase Auth → Bot and Abuse Protection, never a `NEXT_PUBLIC_` variable. Public clients pass tokens for login, signup, recovery email, optional verification-code send, and membership signup. Token verification is enforced by Supabase, not by trusting the UI.
3. Configure production SMTP in Supabase: a verified sender/domain, correct credentials, SPF/DKIM/DMARC, and sufficient sending limits. Disable email-provider link tracking/rewriting. Check delivery to ordinary non-team mailboxes and spam folders. The default development sender is not a production delivery solution. Set sender name to “UNLV Mountain Club”. Keep SMTP credentials in the private vault/Supabase configuration.
4. Verify SMTP delivery and the branded templates in the isolated environment; obtain the production delivery sign-off. Set `AUTH_EMAIL_DELIVERY_VERIFIED=true` in production only after delivery is independently checked. This is an operator attestation, not an automated SMTP health check. Missing keys, known Turnstile test keys, invalid site origin, or missing sign-off block Vercel production builds. Other hosts must set `AUTH_RELEASE_ENV=production` to enforce the same build gate.
5. After approval of the confirmation-on revision, deploy compatible UI and handlers. Then configure production Auth: minimum password length **12**, requirements **none**, email confirmation **on**, six-digit OTP, OTP expiry **3600 seconds**, email resend minimum **60 seconds**, manual identity linking **on**. Do not enable paid leaked-password protection for this release. Keep membership/action permissions unchanged.
6. Enable managed Turnstile with the matching secret in Supabase. This is a **global** email-auth setting, not just signup. Smoke-test every email endpoint immediately. Officer-sent resets remain server-only, capability-checked requests using the secret/admin client; Supabase exempts admin-authorized requests from CAPTCHA. Verify this in the isolated environment with global CAPTCHA enabled.
7. Install the recovery and code templates below and enable the password-change notification. Run the complete acceptance checklist. **Do not consider the release ready while CAPTCHA enforcement or email delivery is unverified.** Missing configuration renders an actionable unavailable state, never a bypass. If activation fails, roll back the release/configuration as a coordinated pair; don’t leave incompatible handlers/templates deployed.

## Redirect allowlists

Production Site URL: `https://unlvmountainclub.com`. Use that canonical host in reset requests. Do not use a wildcard over arbitrary Vercel projects or external domains.

For each approved origin, add only these route-scoped patterns (the suffix permits the callback query string and its encoded destination):

```text
https://unlvmountainclub.com/auth/callback**
https://unlvmountainclub.com/auth/confirm**
https://unlvmountainclub.com/auth/update-password**
```

In the **preview project only**, repeat these three paths with each exact approved HTTPS preview hostname. Remove obsolete hostnames. In the **local project only**, use the six `localhost:3000` / `127.0.0.1:3000` entries already in `supabase/config.toml`. Retain `/auth/update-password` until outstanding PKCE recovery links expire. In Google/Discord consoles the callback is the corresponding **Supabase project's** `/auth/v1/callback`, not the application callback. Changing a provider requires testing both login and account linking/cancellation.

## Email templates

Copy the committed HTML files into the corresponding Supabase Auth template settings:

- Reset Password: `supabase/templates/recovery.html`.
- Confirm Signup: `supabase/templates/confirmation.html`.
- Magic Link: `supabase/templates/verification-code.html` (OTP only; no automatic sign-in link).
- Password Changed notification: `supabase/templates/password-changed.html`; enable this notification.

All recovery senders supply `/auth/confirm?flow=recovery&returnTo=...` as `redirectTo`. The recovery template appends `&token_hash={{ .TokenHash }}&type=recovery` to `{{ .RedirectTo }}`. Do **not** replace it with `.ConfirmationURL`: that would consume the token before the explicit confirmation page. Opening a token-hash link only renders a form; a server action verifies it when the person presses Continue. New links work in another browser because they don't need a stored PKCE verifier. Legacy `?code=` links are exchanged in the callback and still require the original browser; failures offer a fresh reset. Legacy `/auth/confirm?token_hash=...&type=recovery&next=...` links still work.

Signup and signup resends similarly supply `/auth/confirm?flow=signup&returnTo=...`; the confirmation template appends the token hash and `type=signup`. Both templates require this query-bearing redirect, not a bare origin. Signup's inbox state is deliberately identical for real and obfuscated existing-account responses. Successful explicit mailbox confirmation also attempts to record protected email proof; failure of this informational write does not strand an already-consumed link.

The password form requires a signed, 15-minute, HttpOnly receipt bound to the user and Supabase session ID. It is issued only after verified JWT claims show a recent `recovery` or `invite` authentication method, including legacy PKCE callbacks. A URL `flow=recovery` flag alone is insufficient. Password submission checks the receipt and current user again server-side, validates the same password policy, and clears the receipt after success. Supabase itself permits certain password updates for authenticated users; this receipt enforces the application's email-reset UX, not a new global Supabase permission rule.

## Sign-in methods and account-link safeguards

Account settings receives connected identities from a server-verified user. It never determines account ownership by comparing browser-submitted emails. Manual linking starts in a same-origin Server Action and binds a signed, short-lived cookie to the initiating user/provider. The callback requires that context and the same current user before exchanging a PKCE code; it verifies the returned account and actual provider identity before reporting success. An unexpected returned user is signed out locally. Expired, cancelled, already-connected, and identity-conflict cases offer recovery/support without merging users.

Post-auth prompts are dismissible and do not replace the requested destination. OAuth/linking notices are signed, one-use browser-flow notices checked against the authenticated user and actual identities; query flags cannot manufacture a connection success. Email sign-in notices likewise require a current server-verified session before showing suggestions. Normal OAuth sign-in can use Supabase's native same-verified-email linking; the application does not implement a custom email-based merge. Membership/profile data remain attached to the unchanged Supabase user ID.

The password row intentionally says “Set or reset password.” Supabase's user API does not reliably expose password presence; an `email` identity alone can also represent OTP access and must not be presented as proof that a password exists. Cross-user duplicates require club support to verify ownership before any admin merge. The existing admin merge tool is not an automatic-linking fallback.

## Brevo Free setup

1. The owner creates/verifies a club-owned Brevo account and requests transactional sending activation if Brevo requires review. No paid subscription is needed for the selected tier.
2. Authenticate the club's sending domain in Brevo. Add only the exact DNS records Brevo provides, preserving existing MX/SPF/other records; do not replace the domain's mail-routing configuration. Confirm DKIM/DMARC and the chosen sender are valid before configuring SMTP.
3. Use Brevo's SMTP server `smtp-relay.brevo.com`, port 587 with TLS, the account's SMTP login, and a dedicated SMTP key (not an API key). Enter credentials directly in Supabase's private SMTP settings or an approved local secret store—never chat, source control, or a public environment variable. Set sender name “UNLV Mountain Club” and a verified club-domain address chosen by the owner.
4. Disable tracking/link rewriting for auth emails. Verify confirmation, recovery, OTP, and password-change delivery to ordinary non-team mailboxes in an isolated environment, including spam-folder checks. Record the delivery sign-off before setting `AUTH_EMAIL_DELIVERY_VERIFIED=true`.
5. Free sends are capped at **300/day** (checked September 3, 2026). Brevo may queue excess traffic; queued reset links can expire. Use conservative Supabase rate limits, monitor quota and sender reputation, and pause bulk/marketing sends from this account. Do not promise uninterrupted delivery beyond free-tier limits. A larger signup event may require an owner-approved capacity decision.

References: [Brevo Free limits](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan), [Brevo SMTP setup](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP), [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking), [upstream linking implementation](https://github.com/supabase/auth/blob/master/internal/models/linking.go).

Any out-of-band recovery sender (including a Supabase dashboard workflow) must supply the same redirect URL and query shape before using this template. The email’s `.RedirectTo` must not be empty or a bare origin. A default dashboard email without the required redirect is not a supported reset sender; use the officer reset action. Do not log query strings, token hashes, codes, passwords, or auth payloads in monitoring. Redact them in hosting/access logs and disable auth-page session replay. Application analytics drop `/auth` URLs and URLs containing sensitive auth parameters, including fragments.

## Optional verification trust model

Code sending derives the email from the authenticated server session; no submitted address is accepted. `shouldCreateUser:false` prevents accidental accounts. Verification uses a non-persistent, cookie-free client, checks the returned user ID and current email, then re-reads the account and merges `app_metadata.email_verification = { email, verified_at }` using the secret client. Existing metadata is preserved and the browser session is not replaced. The code is single-use; a failed save requires a fresh code.

Only matching protected mailbox proof, or a Google/Discord identity with an explicitly true `email_verified` and matching email, counts as verified. `user_metadata` and automatic `email_confirmed_at` timestamps are not proof. Changing the account email makes old proof inapplicable. No RLS, membership, or action permissions depend on this display status.

## Local development and automated tests

Local Supabase now requires `SUPABASE_AUTH_CAPTCHA_SECRET` to start with CAPTCHA enabled. Use Cloudflare's documented test secret and matching test site key **only locally/in isolated previews**. Configure the frontend to the local Supabase URL/publishable key and local admin secret. Local emails are captured by Mailpit/Inbucket on port 54324; the committed templates are referenced by `supabase/config.toml`. Restart local Supabase after auth configuration changes. Never point test scripts at production.

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm exec playwright install chromium
pnpm test:auth:browser
```

Browser tests use a fake localhost Supabase URL and mocked browser auth/CAPTCHA responses. They cannot create production accounts or send production emails. Passing these does not replace real provider/email/device checks.

Automated auth release checks on September 3, 2026: 44 tests in the auth change's repository baseline and 21 isolated browser tests passed, including manual-link cancellation/success, forged callbacks, ordinary-session recovery denial, signup resends, and 320–1440px layouts in both themes. Type checking and the optimized Next.js build passed. Biome retained only the six existing unrelated image warnings. Browser build output lives in `.next-auth-browser`, separate from `.next`, so another build cannot delete it mid-test. The production configuration gate correctly refuses missing email-delivery sign-off. These are software checks, **not production service or physical-device approval**.

## Release acceptance — human / isolated environment

- [ ] Owner approves confirmation-on; signup displays its inbox/60-second resend state and confirmation returns to the intended page. Email login accepts existing shorter passwords, while all new-password entry points reject <12 characters. Spaces, Unicode, paste, and password-manager generation work.
- [ ] Both providers work from both pages; cancelling sign-in returns a useful screen; cancelling linking leaves existing identities unchanged. New OAuth profiles hydrate names/avatar without replacing edited profile fields.
- [ ] Same verified email across password/Google/Discord opens the same user ID/profile/membership. An unverified email must not take over an existing account. Explicit links require the initiating signed-in user; forged/expired callback flags cannot show success. Cross-account conflicts offer verified support, not an automatic merge.
- [ ] Explicit query/fragment destinations survive login, signup switches, reset, and OAuth. No destination returns Home; signed-in visits to login/signup skip the form. Browser Back doesn't resurrect stale auth state.
- [ ] Missing/expired/failed CAPTCHA blocks every email-auth request and supports retry. Global enforcement rejects requests without tokens even if the UI is bypassed. Membership signup and officer resets still work.
- [ ] Recovery works in another browser, doesn't consume links on GET/HEAD, rejects expired/reused tokens, and confirms successful changes. Outstanding PKCE links work in the original browser and fail usefully elsewhere. Password-change notifications arrive.
- [ ] Optional code send/resend respects 60 seconds; paste/autofill works; wrong/expired/reused codes are actionable. A mismatched user/email cannot gain proof or change the signed-in session. Email change invalidates prior proof; unrelated app metadata survives verification.
- [ ] Full signup/membership/verification/provider/reset smoke tests run only on isolated accounts, including officer-sent resets.
- [ ] Membership signup works after each of the three sign-in methods and after email confirmation in another browser. Duplicate/partial application submissions never delete the auth account or reset a confirmed application.
- [ ] At 320, 360, 390, 430px, tablet, and desktop: no horizontal overflow, readable 16px inputs, 48px controls, usable safe areas, keyboard-only focus, 200% zoom, and both themes. Test **real iOS/Android keyboards and password managers**, not just emulation. Check screen-reader errors/status announcements.
- [ ] Tests, typecheck, production build pass; no new lint or hydration warnings. Baseline has six unrelated existing image warnings.

References: [Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [protected metadata](https://supabase.com/docs/guides/database/postgres/row-level-security), [admin CAPTCHA exemption](https://github.com/supabase/auth/blob/master/internal/api/middleware.go), [Turnstile testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).
