import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const serviceKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_KEY
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

assert.ok(url, 'NEXT_PUBLIC_SUPABASE_URL is required')
assert.ok(serviceKey, 'SUPABASE_SECRET_KEY is required')
assert.ok(anonKey, 'A Supabase publishable key is required')

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const anonymous = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const requiredTables = [
  'admin_roles',
  'admin_capabilities',
  'admin_role_grants',
  'admin_user_roles',
  'admin_activity_events',
  'account_deletion_jobs',
  'club_terms',
  'club_admin_settings',
  'mailing_list_subscriptions',
  'membership_zelle_payments',
]

for (const table of requiredTables) {
  const { error } = await admin
    .from(table)
    .select('*', { head: true, count: 'exact' })
  assert.equal(error, null, `${table} is unavailable: ${error?.message ?? ''}`)
}

const { data: users, error: usersError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
})
assert.equal(usersError, null, usersError?.message)

for (const email of ['valded5@unlv.nevada.edu', 'welcometochilis666@aol.com']) {
  const user = users.users.find(item => item.email?.toLowerCase() === email)
  assert.ok(user, `Bootstrap account is missing: ${email}`)
  const { data, error } = await admin.rpc('is_super_admin', { p_uid: user.id })
  assert.equal(error, null, error?.message)
  assert.equal(data, true, `${email} is not a super admin`)
}

const primaryAdmin = users.users.find(
  item => item.email?.toLowerCase() === 'valded5@unlv.nevada.edu',
)
assert.ok(primaryAdmin)
const { error: accountsRpcError } = await admin.rpc('admin_list_accounts', {
  p_actor_user_id: primaryAdmin.id,
  p_page: 1,
  p_page_size: 1,
})
assert.equal(
  accountsRpcError,
  null,
  `Admin hardening migration is missing: ${accountsRpcError?.message ?? ''}`,
)

const { data: term, error: termError } = await admin
  .from('club_terms')
  .select('name, starts_on, ends_on')
  .eq('is_active', true)
  .single()
assert.equal(termError, null, termError?.message)
assert.equal(term.name, 'Fall 2026')
assert.equal(term.starts_on, '2026-09-01')
assert.equal(term.ends_on, '2026-12-10')

const { count: galleryCount, error: galleryError } = await admin
  .from('gallery_photos')
  .select('*', { head: true, count: 'exact' })
assert.equal(galleryError, null, galleryError?.message)
assert.equal(galleryCount, 40, 'The live gallery should contain 40 records')

for (const table of [
  'admin_user_roles',
  'admin_activity_events',
  'account_deletion_jobs',
  'membership_zelle_payments',
]) {
  const { data, error } = await anonymous.from(table).select('*').limit(1)
  if (error) {
    assert.equal(
      error.code,
      '42501',
      `Unexpected anonymous response for ${table}: ${error.message}`,
    )
  } else {
    assert.deepEqual(data, [], `Anonymous users can read ${table}`)
  }
}

const { count: failedDeletionCount, error: deletionError } = await admin
  .from('account_deletion_jobs')
  .select('*', { head: true, count: 'exact' })
  .in('status', ['pending', 'auth_deleted', 'failed'])
assert.equal(deletionError, null, deletionError?.message)

console.log(
  JSON.stringify(
    {
      status: 'read_only_checks_passed',
      bootstrapSuperAdmins: 2,
      galleryPhotos: galleryCount,
      unresolvedDeletionJobs: failedDeletionCount ?? 0,
    },
    null,
    2,
  ),
)
