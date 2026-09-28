import assert from 'node:assert/strict'
import test from 'node:test'
import { registrationSetupIssues } from '../lib/registration/settings-readiness.ts'

const values = {
  enabled: true,
  waiverRequired: true,
  deadline: null,
}
const legacyTba = { annualWaiver: false, hasWaiver: false, isAllDay: true }

test('opening an unconfigured legacy TBA trip explains both missing requirements', () => {
  const issues = registrationSetupIssues(values, legacyTba)
  assert.equal(issues.length, 2)
  assert.match(issues[0], /club-approved waiver/)
  assert.match(issues[1], /closing date and time/)
})
test('closed registration can save incomplete setup', () => {
  assert.deepEqual(
    registrationSetupIssues({ ...values, enabled: false }, legacyTba),
    [],
  )
})
test('a supplied waiver and deadline resolve the legacy opening requirements', () => {
  assert.deepEqual(
    registrationSetupIssues(
      {
        ...values,
        waiverBody: 'Reviewed document',
        deadline: '2026-10-02T19:00:00Z',
      },
      legacyTba,
    ),
    [],
  )
  assert.equal(
    registrationSetupIssues({ ...values, waiverBody: '  ' }, legacyTba).length,
    2,
  )
})
test('existing and annual waivers do not require a replacement legacy document', () => {
  for (const context of [
    { annualWaiver: false, hasWaiver: true, isAllDay: false },
    { annualWaiver: true, hasWaiver: false, isAllDay: false },
  ])
    assert.deepEqual(registrationSetupIssues(values, context), [])
})
test('optional waiver does not block opening a timed trip', () => {
  assert.deepEqual(
    registrationSetupIssues(
      { ...values, waiverRequired: false },
      { ...legacyTba, isAllDay: false },
    ),
    [],
  )
})
