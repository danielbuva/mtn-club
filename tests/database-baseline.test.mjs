import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { baselinePlan } from '../scripts/database-baseline.mjs'

test('baseline pins historical files and replays every later migration', () => {
  const plan = baselinePlan()
  assert.equal(plan.covered[0], '20260304072736_add_trip_overview_sections.sql')
  assert.equal(
    plan.covered.at(-1),
    '202609030001_admin_production_hardening.sql',
  )
  assert.equal(
    plan.pending[0].name,
    '202609040001_account_membership_review.sql',
  )
  assert.ok(plan.pending.some(m => m.name.startsWith('202609040007_')))
  assert.ok(plan.pending.some(m => m.name.startsWith('20261105110001_')))
})

test('Supabase email templates resolve from the project root and seed from supabase/', () => {
  const config = readFileSync(
    new URL('../supabase/config.toml', import.meta.url),
    'utf8',
  )
  const paths = [...config.matchAll(/^content_path = "([^"]+)"/gm)].map(
    match => match[1],
  )
  assert.equal(paths.length, 10)
  for (const path of paths) {
    assert.ok(path.startsWith('./supabase/templates/'))
    assert.ok(existsSync(new URL(`../${path}`, import.meta.url)))
  }
  assert.match(config, /sql_paths = \["\.\/seed\.sql"\]/)
  assert.ok(existsSync(new URL('../supabase/seed.sql', import.meta.url)))
})
