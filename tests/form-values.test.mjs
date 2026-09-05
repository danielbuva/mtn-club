import assert from 'node:assert/strict'
import test from 'node:test'
import {
  initialRegistrationValues,
  normalizeRegistrationValues,
  registrationSteps,
} from '../lib/registration/form-values.ts'
import { transportationSchema } from '../lib/registration/transportation.ts'
import { validateRegistrationValues } from '../lib/registration/validate-form.ts'

const snapshot = {
  formVersion: 2,
  questions: [
    { id: 'experience', type: 'text', label: 'Experience', required: true },
  ],
  answers: { experience: 'Some hiking', removed_question: 'Old answer' },
  collectTransportation: true,
  transportation: { mode: 'driver', seatsOffered: 4 },
  ageAdult: true,
  emergencyRequired: false,
  emergencyContact: { name: '', phone: '', relationship: '', notes: '' },
  waiverRequired: true,
  waiverSigned: false,
  waiver: { id: 'waiver', sourceUrl: 'https://example.test/waiver' },
}
test('every save path removes hidden seats without destroying transient answers', () => {
  const values = {
    ...initialRegistrationValues(snapshot),
    transportationMode: 'needs_ride',
  }
  for (const intent of ['draft', 'submit']) {
    const result = normalizeRegistrationValues(values, snapshot, intent)
    assert.deepEqual(result.transportation, { mode: 'needs_ride' })
    assert.deepEqual(result.answers, { experience: 'Some hiking' })
  }
  assert.equal(values.seatsOffered, 4)
  assert.equal('seatsOffered' in values, true)
})
test('disabled collection is omitted, while skipping explicitly clears preferences', () => {
  const values = initialRegistrationValues(snapshot)
  assert.equal(
    'transportation' in
      normalizeRegistrationValues(
        values,
        { ...snapshot, collectTransportation: false },
        'submit',
      ),
    false,
  )
  values.transportationMode = null
  assert.equal(
    normalizeRegistrationValues(values, snapshot, 'draft').transportation,
    null,
  )
})
test('drafts never persist consent; only the active adult waiver can be signed', () => {
  const values = {
    ...initialRegistrationValues(snapshot),
    waiverAgreed: true,
    signatureName: ' Test Person ',
  }
  assert.equal(
    'waiverAgreed' in normalizeRegistrationValues(values, snapshot, 'draft'),
    false,
  )
  assert.equal(
    normalizeRegistrationValues(values, snapshot, 'submit').signatureName,
    'Test Person',
  )
  for (const next of [
    { ...snapshot, ageAdult: false },
    { ...snapshot, waiverSigned: true },
    { ...snapshot, waiverRequired: false },
  ]) {
    assert.equal(
      'signatureName' in normalizeRegistrationValues(values, next, 'submit'),
      false,
    )
  }
})
test('step counts follow age and transportation branches', () => {
  const values = initialRegistrationValues(snapshot)
  const driver = registrationSteps(snapshot, values)
  const rider = registrationSteps(snapshot, {
    ...values,
    transportationMode: 'needs_ride',
  })
  assert.equal(driver.length, rider.length + 1)
  assert.equal(rider.includes('seats'), false)
  assert.equal(
    registrationSteps({ ...snapshot, ageAdult: null }, values)[0],
    'age',
  )
  assert.equal(
    registrationSteps(
      { ...snapshot, collectTransportation: false },
      values,
    ).includes('transportation'),
    false,
  )
})
test('seat validation is strict on active branches and ignored on hidden branches', () => {
  const values = { ...initialRegistrationValues(snapshot), seatsOffered: 9 }
  assert.ok(validateRegistrationValues(values, snapshot, 'seats').seatsOffered)
  assert.deepEqual(
    validateRegistrationValues(
      { ...values, transportationMode: 'self_arranged' },
      snapshot,
      'seats',
    ),
    {},
  )
  for (const number of [0, 9, 1.5, Number.NaN])
    assert.equal(
      transportationSchema.safeParse({ mode: 'driver', seatsOffered: number })
        .success,
      false,
    )
  assert.equal(
    transportationSchema.safeParse({ mode: 'driver', seatsOffered: 8 }).success,
    true,
  )
  assert.equal(
    transportationSchema.safeParse({ mode: 'needs_ride', seatsOffered: 4 })
      .success,
    false,
  )
})

const { eventDateTimeToIso, eventLocalDateTime } = await import(
  '../lib/events/date-time.ts'
)
test('trip dates use the selected timezone, including daylight saving and draft round trips', () => {
  assert.equal(
    eventDateTimeToIso('2026-11-14T06:00', 'America/Los_Angeles'),
    '2026-11-14T14:00:00.000Z',
  )
  assert.equal(
    eventDateTimeToIso('2026-07-14T06:00', 'America/Los_Angeles'),
    '2026-07-14T13:00:00.000Z',
  )
  assert.equal(
    eventLocalDateTime('2026-11-14T14:00:00Z', 'America/Los_Angeles'),
    '2026-11-14T06:00',
  )
  assert.equal(
    eventDateTimeToIso('2026-03-08T02:30', 'America/Los_Angeles'),
    null,
  )
  assert.equal(
    eventDateTimeToIso('2026-11-01T01:30', 'America/Los_Angeles'),
    '2026-11-01T08:30:00.000Z',
  )
})

test('joining preferences prefill from the trip and account, and only confirmation persists opt-ins', () => {
  const current = {
    ...snapshot,
    showInAttendeeList: false,
    defaultShowInAttendeeList: true,
    emailUpdates: true,
  }
  const values = initialRegistrationValues(current)
  assert.equal(values.showInAttendeeList, false)
  assert.equal(values.emailUpdates, true)
  assert.equal(
    normalizeRegistrationValues(values, current, 'draft').joiningPreferences,
    undefined,
  )
  assert.deepEqual(
    normalizeRegistrationValues(values, current, 'submit').joiningPreferences,
    {
      showInAttendeeList: false,
      emailUpdates: true,
      expectedEmailUpdates: true,
      expectedAttendeeDefault: true,
    },
  )
})

test('waiver reading unlocks signing without becoming consent or persisted evidence', () => {
  const current = { ...snapshot, waiver: { id: 'current-waiver' } }
  const values = {
    ...initialRegistrationValues(current),
    signatureName: 'Test Person',
    waiverAgreed: true,
  }
  assert.ok(validateRegistrationValues(values, current, 'waiver').waiverRead)
  values.waiverReadId = 'current-waiver'
  assert.deepEqual(validateRegistrationValues(values, current, 'waiver'), {})
  values.waiverAgreed = false
  assert.ok(validateRegistrationValues(values, current, 'waiver').waiverAgreed)
  assert.equal(
    'waiverReadId' in normalizeRegistrationValues(values, current, 'submit'),
    false,
  )
  assert.ok(
    validateRegistrationValues(
      values,
      { ...current, waiver: { id: 'new-version' } },
      'waiver',
    ).waiverRead,
  )
})

test('trip detail uses the selected timezone across UTC midnight', async () => {
  const { formatTripDate, formatTripTime } = await import(
    '../lib/trips/format.ts'
  )
  const start = new Date('2026-11-15T01:00:00Z')
  const end = new Date('2026-11-15T03:00:00Z')
  assert.equal(formatTripDate(start, end, 'America/Los_Angeles'), 'Sat, Nov 14')
  assert.equal(
    formatTripTime(start, end, 'America/Los_Angeles'),
    '5:00 PM - 7:00 PM',
  )
})
