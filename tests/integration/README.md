# Real Supabase auth acceptance

These tests use a dedicated Docker stack, Cloudflare's documented public test
keypair, and local Mailpit. They cannot take a hosted target URL or credentials.
They assert CAPTCHA, confirmation, password policy, and local-only SMTP settings
before making requests. No production users or real mailboxes are used.

From the repository root, with Docker running:

```sh
SUPABASE_AUTH_CAPTCHA_SECRET=1x0000000000000000000000000000000AA pnpm exec supabase start --workdir tests/integration
pnpm test:auth:services
```

The environment override is essential: the CLI can load the root `.env.local`
and override a literal config secret. The test checks the effective container
setting, not just the TOML file. Never use this keypair in production.

The API tests need no application tables. They cover real confirmation, resend
throttling, password policy, cross-browser token-hash recovery, legacy PKCE,
password-change notifications, admin CAPTCHA exemption, and transient OTP proof.
Only users created by this test run are deleted during cleanup.

## Full browser/membership smoke test

This additional test requires the **application schema without member data** in
the dedicated sandbox. The repository's incremental migrations do not include
the original base schema and cannot currently bootstrap a fresh database.
On September 3, 2026, the owner's existing `supabase/schema-only.sql`
was inspected and loaded into `supabase_db_mtn-auth-integration` only. That file
is now retained in the release branch as a schema-only test baseline. Do not load it into
an existing database or run production migrations just to prepare this test.

Once the local schema is available:

```sh
pnpm test:auth:integration
```

The browser uses port 3130 and Supabase uses 55321–55324. The launcher overrides
the app's Supabase settings with this local stack's credentials. The browser test
uses the real managed test widget and real local SMTP/Auth; the reset test only
stubs the unrelated final destination. GET/HEAD scanner visits must not consume
reset links. Membership must remain attached to the confirmed account.

Do not run simultaneously with the mocked browser suite: both intentionally use
the separate `.next-auth-browser` build folder. Captured messages and browser
traces contain **local test** tokens; do not commit these artifacts.

Stop this stack (retaining its local database backup) after testing:

```sh
pnpm exec supabase stop --workdir tests/integration
```

This is not approval of production SMTP delivery, real Google/Discord providers,
production Turnstile keys, or physical-device behavior. Those are separate
release checks in `AUTH_RUNBOOK.md`.
