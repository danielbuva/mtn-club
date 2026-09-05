import assert from 'node:assert/strict'
import test from 'node:test'
import { FALL_2026_TRIPS } from '../lib/club-content.ts'
import { mergeScheduleTrips } from '../lib/events/schedule.ts'

const original = {
  id: 'fall-trip',
  scheduleKey: 'fall-2026-09-06-sport-climbing',
  title: 'Sport climbing',
  dateStart: '2026-09-06',
  lifecycleStatus: 'published',
}

test('a canceled database trip replaces its fallback and retains the reason', () => {
  const canceled = {
    ...original,
    id: 'database-id',
    lifecycleStatus: 'canceled',
    cancellationReason: 'Rain',
  }
  assert.deepEqual(mergeScheduleTrips([original], [canceled]), [canceled])
})
test('deleted trips cannot reappear from the static schedule', () => {
  assert.deepEqual(
    mergeScheduleTrips(
      [original],
      [{ ...original, lifecycleStatus: 'archived' }],
    ),
    [],
  )
})
test('rescheduling or renaming a trip does not duplicate its fallback', () => {
  const changed = {
    ...original,
    id: 'database-id',
    title: 'New name',
    dateStart: '2026-09-20',
  }
  assert.deepEqual(mergeScheduleTrips([original], [changed]), [changed])
})
test('restoring a trip overrides the canceled fallback', () => {
  assert.deepEqual(
    mergeScheduleTrips(
      [{ ...original, lifecycleStatus: 'canceled' }],
      [original],
    ),
    [original],
  )
})
test('the September 6 Red Rock trip stays in the schedule with its rain cancellation', () => {
  const trip = FALL_2026_TRIPS.find(
    trip => trip.title === 'Red Rock Sport Climbing',
  )
  assert.ok(trip)
  assert.equal(trip.startDate, '2026-09-06')
  assert.equal(trip.lifecycleStatus, 'canceled')
  assert.equal(trip.cancellationReason, 'Canceled due to rain.')
})
