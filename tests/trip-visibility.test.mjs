import assert from 'node:assert/strict'
import test from 'node:test'
import {
  fetchOfficialTrips,
  fetchPastTripsInRangePublic,
  fetchPastTripsPublic,
  fetchPublicTripsInRange,
  fetchTripsInRange,
  fetchVisibleTrips,
} from '../lib/events/queries.ts'
import {
  mapVisibilityFromTrip,
  mapVisibilityToTrip,
} from '../lib/events/visibility.ts'

const range = { start: new Date('2026-01-01'), end: new Date('2027-01-01') }
const rows = ['public', 'members', 'minimal', 'leaders'].map(visibility => ({
  id: visibility,
  visibility,
  is_official: true,
  lifecycle_status: 'published',
}))

// Deliberately bypass RLS to check explicit public query filters too.
function client() {
  return {
    from(table) {
      assert.equal(table, 'trips')
      let result = rows
      const query = Object.assign(
        Promise.resolve().then(() => ({ data: result, error: null })),
        {
          select: () => query,
          not: () => query,
          order: () => query,
          lt: () => query,
          lte: () => query,
          or: () => query,
          limit: () => query,
          in(column, values) {
            result = result.filter(row => values.includes(row[column]))
            return query
          },
          eq(column, value) {
            result = result.filter(row => row[column] === value)
            return query
          },
        },
      )
      return query
    },
  }
}

test('leaders-only visibility has one reversible domain mapping', () => {
  assert.equal(mapVisibilityToTrip('leaders_only'), 'leaders')
  assert.equal(mapVisibilityFromTrip('leaders'), 'leaders_only')
  assert.equal(mapVisibilityFromTrip('minimal'), 'leaders_only')
  for (const value of ['public', 'members']) {
    assert.equal(mapVisibilityToTrip(value), value)
    assert.equal(mapVisibilityFromTrip(value), value)
  }
})

test('public schedule and past feeds explicitly select only public trips', async () => {
  for (const read of [
    () => fetchOfficialTrips(client()),
    () => fetchPublicTripsInRange(client(), range),
    () => fetchPastTripsPublic(client()),
    () => fetchPastTripsInRangePublic(client(), range),
  ]) {
    assert.deepEqual(
      (await read()).map(row => row.visibility),
      ['public'],
    )
  }
})

test('member lists and calendar/home queries retain leaders trips for RLS to authorize', async () => {
  for (const read of [
    () => fetchVisibleTrips(client()),
    () => fetchTripsInRange(client(), range),
  ]) {
    assert.deepEqual(
      (await read()).map(row => row.visibility),
      ['public', 'members', 'leaders'],
    )
  }
})
