import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeCalendarTrips } from '../lib/events/merge-calendar-trips.ts'

test('merges a New Year trip once while preserving its full date range', () => {
  const newYearTrip = {
    id: 'new-year',
    title: 'New Year camping',
    dateStart: '2026-12-30',
    dateEnd: '2027-01-02',
  }
  const decemberTrip = { ...newYearTrip, id: 'december' }
  const januaryTrip = { ...newYearTrip, id: 'january' }
  const trips2026 = Object.freeze([decemberTrip, newYearTrip])
  const trips2027 = Object.freeze([{ ...newYearTrip }, januaryTrip])

  const merged = mergeCalendarTrips([trips2026, trips2027])

  assert.deepEqual(merged, [decemberTrip, newYearTrip, januaryTrip])
  assert.equal(merged[1], newYearTrip)
  assert.equal(merged[1].dateStart, '2026-12-30')
  assert.equal(merged[1].dateEnd, '2027-01-02')
  assert.equal(trips2026.length, 2)
  assert.equal(trips2027.length, 2)
})

test('keeps distinct trip IDs even when titles and dates match', () => {
  const first = {
    id: 'first',
    title: 'Camping',
    dateStart: '2026-12-31',
    dateEnd: '2027-01-01',
  }
  const second = { ...first, id: 'second' }

  assert.deepEqual(mergeCalendarTrips([[first], [second]]), [first, second])
})

test('handles no loaded trips and duplicate IDs within a year', () => {
  assert.deepEqual(mergeCalendarTrips([]), [])
  assert.deepEqual(mergeCalendarTrips([[], []]), [])

  const trip = { id: 'trip' }
  assert.deepEqual(mergeCalendarTrips([[], [trip, { ...trip }], []]), [trip])
})
