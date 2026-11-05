import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'

const root = new URL('../supabase/', import.meta.url)
const hash = contents => createHash('sha256').update(contents).digest('hex')

// An explicit, immutable checkpoint replaces implicit date cutoffs in test harnesses.
export function baselinePlan() {
  const manifest = JSON.parse(
    readFileSync(new URL('baseline.json', root), 'utf8'),
  )
  const schema = readFileSync(new URL(manifest.schema, root), 'utf8')
  if (hash(schema) !== manifest.sha256)
    throw new Error('Baseline schema checksum changed')
  const reference = readFileSync(
    new URL('baseline-reference.sql', root),
    'utf8',
  )
  if (hash(reference) !== manifest.referenceSha256)
    throw new Error('Baseline reference checksum changed')
  const migrations = new URL('migrations/', root)
  const names = readdirSync(migrations)
    .filter(name => name.endsWith('.sql'))
    .sort()
  const covered = Object.keys(manifest.coveredMigrations).sort()
  for (const name of covered) {
    const contents = readFileSync(new URL(name, migrations), 'utf8')
    if (hash(contents) !== manifest.coveredMigrations[name]) {
      throw new Error(`Applied baseline migration changed: ${name}`)
    }
  }
  const pending = names.filter(name => !covered.includes(name))
  if (pending.some(name => name <= covered.at(-1))) {
    throw new Error('New migrations must follow the baseline checkpoint')
  }
  return {
    schema,
    reference,
    covered,
    pending: pending.map(name => ({
      name,
      sql: readFileSync(new URL(name, migrations), 'utf8'),
    })),
  }
}

export function applyBaseline(sql) {
  const plan = baselinePlan()
  sql(plan.schema)
  sql(plan.reference)
  // Replay every migration after the checkpoint, including bootstrap reconciliation.
  for (const migration of plan.pending) sql(migration.sql)
  return plan
}
