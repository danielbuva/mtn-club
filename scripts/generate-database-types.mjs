import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import {
  installedIntegrationSchemaVersion,
  integrationSchemaVersion,
} from './integration-schema.mjs'

if (installedIntegrationSchemaVersion() !== integrationSchemaVersion())
  throw new Error('Run pnpm setup:integration first.')

const target = 'lib/supabase/database.generated.ts'
const generated = execFileSync(
  'pnpm',
  [
    'exec',
    'supabase',
    'gen',
    'types',
    '--local',
    '--workdir',
    'tests/integration',
    '--lang',
    'typescript',
    '--schema',
    'public',
  ],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
)
const formatted = execFileSync(
  'pnpm',
  ['exec', 'biome', 'format', `--stdin-file-path=${target}`],
  { input: generated, encoding: 'utf8' },
)

if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== formatted)
    throw new Error(
      'The database contract changed. Run pnpm db:types and commit the result.',
    )
} else {
  writeFileSync(target, formatted)
}
