import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const requireValue = name => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required sandbox setting: ${name}`)
  return value
}

const supabaseUrl = requireValue('NEXT_PUBLIC_SUPABASE_URL')
const publishableKey = requireValue('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
const serviceKey = requireValue('SUPABASE_SECRET_KEY')
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const suffix = Date.now().toString(36)
const password = `Codex-${suffix}-Membership!`
const users = []
const tripIds = []

const createSyntheticUser = async (label, role = 'regular') => {
  const email = `codex-${label}-${suffix}@example.com`
  const result = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (result.error || !result.data.user) {
    throw result.error ?? new Error(`Unable to create ${label} user.`)
  }
  const user = result.data.user
  users.push(user.id)
  const [profile, membership] = await Promise.all([
    admin.from('profiles').insert({
      user_id: user.id,
      display_name: `Codex ${label}`,
    }),
    admin.from('memberships').insert({
      user_id: user.id,
      role,
      status: role === 'regular' ? 'pending' : 'active',
    }),
  ])
  if (profile.error || membership.error) {
    throw profile.error ?? membership.error
  }
  return { id: user.id, email }
}

const createApplicantClient = async email => {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const signIn = await client.auth.signInWithPassword({ email, password })
  if (signIn.error) throw signIn.error
  return client
}

const insertApplication = async (userId, ageStatus, guardianConsent) => {
  const result = await admin.from('membership_applications').insert({
    user_id: userId,
    full_name: `Codex ${ageStatus} applicant`,
    contact_email: `codex-${ageStatus}-${suffix}@example.com`,
    age_status: ageStatus,
    guardian_consent: guardianConsent,
    dues_payment_claimed: true,
    dues_claimed_at: new Date().toISOString(),
    primary_interest: 'Hiking Trips',
    status: 'submitted',
  })
  if (result.error) throw result.error
}

const readAccess = async client => {
  const result = await client.rpc('get_my_membership_access')
  if (result.error) throw result.error
  assert.equal(result.data.length, 1)
  return result.data[0]
}

try {
  const reviewer = await createSyntheticUser('reviewer', 'leadership')
  const adult = await createSyntheticUser('adult')
  const minor = await createSyntheticUser('minor')

  await insertApplication(adult.id, 'adult', 'not_required')
  await insertApplication(minor.id, 'minor', 'pending')

  const privateTrip = await admin
    .from('trips')
    .insert({
      title: `Codex provisional read test ${suffix}`,
      visibility: 'members',
      starts_at: '2026-12-20T17:00:00-08:00',
      ends_at: '2026-12-20T19:00:00-08:00',
      description_public: 'Synthetic membership access test.',
      activity_tags: ['test'],
      is_official: false,
    })
    .select('id')
    .single()
  if (privateTrip.error) throw privateTrip.error
  tripIds.push(privateTrip.data.id)

  const adultClient = await createApplicantClient(adult.email)
  const adultBefore = await readAccess(adultClient)
  assert.equal(adultBefore.access_active, false)
  assert.equal(adultBefore.provisional_access, true)

  const provisionalRead = await adultClient
    .from('trips')
    .select('id')
    .eq('id', privateTrip.data.id)
    .maybeSingle()
  assert.equal(provisionalRead.error, null)
  assert.equal(provisionalRead.data?.id, privateTrip.data.id)

  const blockedCreate = await adultClient.from('trips').insert({
    title: `Codex blocked provisional create ${suffix}`,
    visibility: 'public',
    starts_at: '2026-12-21T17:00:00-08:00',
    ends_at: '2026-12-21T19:00:00-08:00',
    created_by: adult.id,
    activity_tags: ['test'],
    is_official: false,
  })
  assert.ok(blockedCreate.error)

  const adultConfirmation = await admin.rpc(
    'confirm_zelle_membership_application',
    { p_user_id: adult.id, p_reviewer_id: reviewer.id },
  )
  if (adultConfirmation.error) throw adultConfirmation.error

  const adultAfter = await readAccess(adultClient)
  assert.equal(adultAfter.access_active, true)
  assert.equal(adultAfter.provisional_access, false)

  const fullCreate = await adultClient
    .from('trips')
    .insert({
      title: `Codex full member create ${suffix}`,
      visibility: 'public',
      starts_at: '2026-12-22T17:00:00-08:00',
      ends_at: '2026-12-22T19:00:00-08:00',
      created_by: adult.id,
      activity_tags: ['test'],
      is_official: false,
    })
    .select('id')
    .single()
  if (fullCreate.error) throw fullCreate.error
  tripIds.push(fullCreate.data.id)

  const minorClient = await createApplicantClient(minor.email)
  const minorBefore = await readAccess(minorClient)
  assert.equal(minorBefore.access_active, false)
  assert.equal(minorBefore.provisional_access, false)

  const prematureMinorConfirmation = await admin.rpc(
    'confirm_zelle_membership_application',
    { p_user_id: minor.id, p_reviewer_id: reviewer.id },
  )
  assert.ok(prematureMinorConfirmation.error)

  const guardianConfirmation = await admin.rpc(
    'confirm_membership_guardian_consent',
    { p_user_id: minor.id, p_reviewer_id: reviewer.id },
  )
  if (guardianConfirmation.error) throw guardianConfirmation.error

  const minorProvisional = await readAccess(minorClient)
  assert.equal(minorProvisional.provisional_access, true)

  const minorConfirmation = await admin.rpc(
    'confirm_zelle_membership_application',
    { p_user_id: minor.id, p_reviewer_id: reviewer.id },
  )
  if (minorConfirmation.error) throw minorConfirmation.error

  const minorAfter = await readAccess(minorClient)
  assert.equal(minorAfter.access_active, true)
  assert.equal(minorAfter.provisional_access, false)

  console.log(
    JSON.stringify({
      result: 'membership application access test passed',
      provisionalRead: true,
      provisionalCreateBlocked: true,
      adultConfirmation: true,
      guardianGate: true,
      minorConfirmation: true,
    }),
  )
} finally {
  if (tripIds.length > 0) {
    await admin.from('trips').delete().in('id', tripIds)
  }
  if (users.length > 0) {
    await admin.from('membership_applications').delete().in('user_id', users)
    await admin
      .from('membership_access_overrides')
      .delete()
      .in('user_id', users)
    await admin.from('memberships').delete().in('user_id', users)
    await admin.from('profiles').delete().in('user_id', users)
    for (const userId of [...users].reverse()) {
      await admin.auth.admin.deleteUser(userId)
    }
  }
}
