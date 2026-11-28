# Local Supabase acceptance

The integration stack runs Docker, PostgreSQL, Supabase Auth and Storage, and local Mailpit. From a fresh clone, install the dependencies with `pnpm install --frozen-lockfile`, start Docker, and run:

```sh
pnpm setup:integration
pnpm db:types --check
pnpm exec playwright install chromium webkit
pnpm test:auth:services
pnpm test:auth:integration
pnpm test:registration:browser
pnpm test:forms:browser
```

Setup installs the checksummed application baseline and every subsequent migration in the dedicated `mtn-handoff-integration` stack. Its API, database, and Mailpit use ports 55621, 55622, and 55624. The launcher requires the current schema fingerprint and the local CAPTCHA and SMTP settings before it creates a synthetic account. Turnstile uses the public test keypair and all Auth mail stays in local capture. Real delivery and live provider settings have their own [release checks](../../AUTH_RUNBOOK.md).

`pnpm test:db:replay`, `pnpm test:registration:db`, and `pnpm test:registration:contacts` create and remove independent replay databases inside the same container. The browser suites use the API-facing sandbox and should run sequentially.

After changing migrations, rebuild the sandbox and regenerate the types. The following command drops only the dedicated integration stack and its synthetic fixtures. Leave other local or hosted projects alone.

```sh
pnpm exec supabase stop --workdir tests/integration --no-backup
pnpm setup:integration
pnpm db:types
```

The integration checks are part of the PR workflow. Browser traces, if enabled locally, can contain synthetic tokens and should stay out of Git.
