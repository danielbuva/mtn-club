import assert from 'node:assert/strict'
import test from 'node:test'
import { formatDateOnly, formatTimeRange } from '../lib/events/formatters.ts'

test('keeps late-afternoon Las Vegas events on their local calendar day', () => {
  const startsAt = new Date('2026-09-02T00:00:00.000Z')

  assert.equal(formatDateOnly(startsAt, 'America/Los_Angeles'), '2026-09-01')
})

test('formats weekly meetup times in the event time zone', () => {
  assert.equal(
    formatTimeRange(
      '2026-09-02T00:00:00.000Z',
      '2026-09-02T02:00:00.000Z',
      'America/Los_Angeles',
    ),
    '5:00 PM–7:00 PM',
  )
})

test('keeps an all-day event end on its Las Vegas date', () => {
  const endsAt = new Date('2026-09-07T06:59:59.000Z')

  assert.equal(formatDateOnly(endsAt, 'America/Los_Angeles'), '2026-09-06')
})
