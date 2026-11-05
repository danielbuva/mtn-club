import assert from 'node:assert/strict'
import {
  createLocalDatabase,
  dropLocalDatabase,
  sql,
} from './local-database.mjs'

const { database, plan } = createLocalDatabase()
try {
  assert.equal(sql('select count(*) from auth.users', database), '0')
  assert.equal(sql('select count(*) from public.trips', database), '0')
  assert.equal(
    sql('select count(*) from public.admin_user_roles', database),
    '0',
  )
  assert.equal(
    sql(
      "select count(*) from public.admin_roles where key='super_admin' and is_super_admin",
      database,
    ),
    '1',
  )
  assert.equal(
    sql(
      "select count(*) from pg_proc where oid='public.sign_annual_waiver(uuid,uuid,jsonb)'::regprocedure",
      database,
    ),
    '1',
  )
  console.log(
    `Replayed baseline (${plan.covered.length} covered migrations) + ${plan.pending.length} migrations in a clean local database; 5 checks passed.`,
  )
} finally {
  dropLocalDatabase(database)
}
