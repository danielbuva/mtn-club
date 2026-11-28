import assert from 'node:assert/strict'
import {
  installedIntegrationSchemaVersion,
  integrationSchemaVersion,
} from './integration-schema.mjs'

assert.equal(
  installedIntegrationSchemaVersion(),
  integrationSchemaVersion(),
  'Run pnpm setup:integration to install the current application schema',
)
