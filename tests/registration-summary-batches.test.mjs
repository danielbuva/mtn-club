import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchRegistrationSummaryBatches } from '../lib/registration/summary-batches.ts'

test('451 trip IDs run concurrently in batches of at most 200 and retain order', async () => {
  const ids = Array.from({ length: 451 }, (_, index) => `trip-${index}`)
  const batches = []
  const releases = []
  const result = fetchRegistrationSummaryBatches(ids, batch => {
    batches.push(batch)
    return new Promise(resolve => releases.push(() => resolve(batch)))
  })
  assert.deepEqual(
    batches.map(batch => batch.length),
    [200, 200, 51],
  )
  assert.deepEqual(batches.flat(), ids)
  for (const release of releases.reverse()) release()
  assert.deepEqual(await result, ids)
})

test('empty input makes no calls and a failed batch rejects the entire read', async () => {
  assert.deepEqual(
    await fetchRegistrationSummaryBatches([], () => {
      assert.fail('empty input must not call the RPC')
    }),
    [],
  )
  await assert.rejects(
    fetchRegistrationSummaryBatches(
      Array.from({ length: 201 }, String),
      async ids => {
        if (ids.length === 1) throw new Error('RPC unavailable')
        return ids
      },
    ),
    /RPC unavailable/,
  )
})
