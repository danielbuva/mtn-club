import assert from 'node:assert/strict'
import test from 'node:test'
import { getSingleTripForDay } from '../lib/events/calendar-day-selection.ts'

const makeTrip = ({ dateStart, dateEnd = dateStart, id, title }) => ({
  dateStart,
  dateEnd,
  id,
  title,
})

test('opens the event that starts on a day with an overlapping prior event', () => {
  const ongoing = makeTrip({
    id: 'ongoing',
    title: 'Prior event',
    dateStart: '2026-09-19',
    dateEnd: '2026-09-20',
  })
  const starting = makeTrip({
    id: 'starting',
    title: 'Cathedral Rock Sunrise Hike',
    dateStart: '2026-09-20',
  })

  assert.equal(getSingleTripForDay('2026-09-20', [ongoing, starting]), starting)
})

test('treats duplicate schedule records as one event', () => {
  const published = makeTrip({
    id: 'published',
    title: 'Camp and Climb in Joshua Tree National Park',
    dateStart: '2026-10-16',
    dateEnd: '2026-10-18',
  })
  const database = makeTrip({
    id: 'database',
    title: 'Camp and Climb in Joshua Tree National Park',
    dateStart: '2026-10-16',
    dateEnd: '2026-10-19',
  })

  assert.equal(
    getSingleTripForDay('2026-10-16', [published, database]),
    database,
  )
})

test('keeps list view for two distinct events starting on the same day', () => {
  const first = makeTrip({
    id: 'first',
    title: 'First event',
    dateStart: '2026-11-06',
  })
  const second = makeTrip({
    id: 'second',
    title: 'Second event',
    dateStart: '2026-11-06',
  })

  assert.equal(getSingleTripForDay('2026-11-06', [first, second]), null)
})
