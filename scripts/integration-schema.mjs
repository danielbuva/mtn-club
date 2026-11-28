import { createHash } from 'node:crypto'
import { baselinePlan } from './database-baseline.mjs'
import { sql } from './local-database.mjs'

export function integrationSchemaVersion() {
  const plan = baselinePlan()
  return createHash('sha256')
    .update(plan.schema)
    .update(plan.reference)
    .update(JSON.stringify(plan.pending))
    .digest('hex')
}

export function installedIntegrationSchemaVersion() {
  const exists = sql(
    "select to_regclass('mtn_integration.schema_version') is not null",
    'postgres',
  )
  return exists === 't'
    ? sql('select fingerprint from mtn_integration.schema_version', 'postgres')
    : null
}
