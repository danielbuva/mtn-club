import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clampCalendarDate,
  clampCalendarMonthDate,
} from '../lib/events/calendar-boundary.ts'

const formatMonth = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

test('clamps calendar months before September 2026', () => {
  const oldMonth = new Date(2024, 0, 1)
  assert.equal(formatMonth(clampCalendarMonthDate(oldMonth)), '2026-09')
})

test('keeps supported calendar months unchanged', () => {
  const supportedMonth = new Date(2027, 2, 1)
  assert.equal(formatMonth(clampCalendarMonthDate(supportedMonth)), '2027-03')
})

test('keeps the day when today is inside the supported range', () => {
  const supportedDay = new Date(2026, 9, 18, 14, 30)
  assert.equal(clampCalendarDate(supportedDay), supportedDay)
})
