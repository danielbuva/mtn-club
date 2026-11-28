import { execFileSync } from 'node:child_process'
import { applyBaseline } from './database-baseline.mjs'
import {
  installedIntegrationSchemaVersion,
  integrationSchemaVersion,
} from './integration-schema.mjs'
import { sql } from './local-database.mjs'

execFileSync(
  'pnpm',
  ['exec', 'supabase', 'start', '--workdir', 'tests/integration'],
  {
    env: {
      ...process.env,
      SUPABASE_AUTH_CAPTCHA_SECRET: '1x0000000000000000000000000000000AA',
    },
    stdio: ['ignore', 'ignore', 'inherit'],
  },
)
const expected = integrationSchemaVersion()
if (installedIntegrationSchemaVersion() === expected) {
  console.log('The local integration schema is current.')
  process.exit(0)
}

const hasApplication = sql(
  "select to_regclass('public.trips') is not null",
  'postgres',
)
if (hasApplication === 't') {
  throw new Error(
    'This local test stack has an older or partial schema. See tests/integration/README.md for clean rebuild instructions.',
  )
}

applyBaseline(query => sql(query, 'postgres'))
sql(
  `create schema mtn_integration;
   revoke all on schema mtn_integration from public, anon, authenticated, service_role;
   create table mtn_integration.schema_version (fingerprint text primary key);
   insert into mtn_integration.schema_version values ('${expected}');
   notify pgrst, 'reload schema';`,
  'postgres',
)
console.log('The local integration stack has the current application schema.')
