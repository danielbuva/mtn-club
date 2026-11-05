import assert from 'node:assert/strict'
import test from 'node:test'
import { upsertProfile } from '../lib/profile/queries.ts'

const userId = 'profile-owner'
const updatedAt = '2026-11-05T12:00:00.000Z'

function fixture({
  exists = true,
  lookupError = null,
  updateError = null,
} = {}) {
  let profile = exists
    ? { user_id: userId, display_name: 'Trail Member', bio: 'Keep my bio' }
    : null
  let privateProfile = null
  const writes = []
  const client = {
    from(table) {
      let operation = 'select'
      let payload
      const filters = []
      const execute = async () => {
        if (operation === 'select') {
          return {
            data: table === 'profiles' ? profile : privateProfile,
            error: table === 'profiles' ? lookupError : null,
          }
        }
        writes.push({ table, operation, payload, filters })
        if (table === 'profiles' && updateError) {
          return { error: updateError }
        }
        if (table === 'profiles') {
          profile = { ...profile, ...payload }
        } else {
          privateProfile = { ...privateProfile, ...payload }
        }
        return { error: null }
      }
      const builder = {
        select() {
          return builder
        },
        eq(...filter) {
          filters.push(filter)
          return builder
        },
        maybeSingle: execute,
        single: execute,
        update(value) {
          operation = 'update'
          payload = value
          return builder
        },
        insert(value) {
          operation = 'insert'
          payload = value
          return builder
        },
        upsert(value) {
          operation = 'upsert'
          payload = value
          return builder
        },
        // biome-ignore lint/suspicious/noThenProperty: Supabase query builders are awaitable; execute after chained filters are collected.
        then(resolve, reject) {
          return execute().then(resolve, reject)
        },
      }
      return builder
    },
  }
  return { client, writes }
}

for (const field of [
  'emergency_contact',
  'travel_profile',
  'gear_profile',
  'skills_certs',
  'interests_preferences',
  'privacy_settings',
  'notification_settings',
  'carpool_profile',
  'phone',
  'birthday',
]) {
  test(`saving ${field} with updated_at preserves an existing display name`, async () => {
    const { client, writes } = fixture()
    const saved = await upsertProfile(client, userId, {
      [field]: null,
      updated_at: updatedAt,
    })

    assert.equal(saved.display_name, 'Trail Member')
    assert.equal(saved.bio, 'Keep my bio')
    assert.equal(saved[field], null)
    assert.deepEqual(writes, [
      {
        table: 'profiles',
        operation: 'update',
        payload: { updated_at: updatedAt },
        filters: [['user_id', userId]],
      },
      {
        table: 'profile_private',
        operation: 'upsert',
        payload: { user_id: userId, [field]: null, updated_at: updatedAt },
        filters: [],
      },
    ])
  })
}

test('private settings without a timestamp do not write the existing public profile', async () => {
  const { client, writes } = fixture()
  const contact = { name: 'Emergency Contact', phone: '555-0100' }
  const saved = await upsertProfile(client, userId, {
    emergency_contact: contact,
  })
  assert.equal(saved.display_name, 'Trail Member')
  assert.deepEqual(saved.emergency_contact, contact)
  assert.deepEqual(
    writes.map(write => write.table),
    ['profile_private'],
  )
})

test('explicit public changes preserve unspecified fields and allow null clearing', async () => {
  const { client, writes } = fixture()
  const saved = await upsertProfile(client, userId, {
    display_name: 'New Name',
    bio: null,
    username: undefined,
  })
  assert.equal(saved.display_name, 'New Name')
  assert.equal(saved.bio, null)
  assert.deepEqual(writes[0].payload, { display_name: 'New Name', bio: null })
})

for (const displayName of [undefined, 'First Name']) {
  test(`missing profiles are inserted with ${displayName ?? 'the default name'}`, async () => {
    const { client, writes } = fixture({ exists: false })
    const saved = await upsertProfile(client, userId, {
      display_name: displayName,
      emergency_contact: null,
      updated_at: updatedAt,
    })
    assert.equal(saved.display_name, displayName ?? 'Member')
    assert.deepEqual(writes[0], {
      table: 'profiles',
      operation: 'insert',
      payload: {
        user_id: userId,
        display_name: displayName ?? 'Member',
        updated_at: updatedAt,
      },
      filters: [],
    })
  })
}

test('a failed profile lookup stops writes instead of inserting a default profile', async () => {
  const lookupError = new Error('Profile lookup failed')
  const { client, writes } = fixture({ lookupError })
  await assert.rejects(
    upsertProfile(client, userId, { updated_at: updatedAt }),
    lookupError,
  )
  assert.deepEqual(writes, [])
})

test('a failed public update stops the private write and surfaces the error', async () => {
  const updateError = new Error('Profile update failed')
  const { client, writes } = fixture({ updateError })
  await assert.rejects(
    upsertProfile(client, userId, {
      emergency_contact: null,
      updated_at: updatedAt,
    }),
    updateError,
  )
  assert.deepEqual(
    writes.map(write => write.table),
    ['profiles'],
  )
})
