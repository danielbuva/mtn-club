import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  matchesRosterSearch,
  rosterState,
  sortRoster,
} from '../lib/registration/roster-status.ts'
import {
  signupLine,
  spotsLine,
  tripTimeLine,
} from '../lib/trips/detail-format.ts'

const row = (overrides = {}) => ({
  userId: '00000000-0000-4000-8000-000000000001',
  name: 'Maya Chen',
  state: 'confirmed',
  queuedAt: null,
  discord: null,
  email: null,
  ...overrides,
})

test('members can see opted-in attendees and organizers get Discord names', () => {
  const sql = readFileSync(
    new URL(
      '../supabase/migrations/20261106020001_member_attendee_lists_and_roster_discord.sql',
      import.meta.url,
    ),
    'utf8',
  )
  assert.match(sql, /public\.is_active_member\(uid\)/)
  assert.match(sql, /attendeesVisible/)
  // The opt-in filter must survive: the migration only widens who may look.
  assert.doesNotMatch(sql, /show_in_attendee_list\)/)
  assert.match(sql, /provider=''discord''/)
  assert.match(sql, /raise exception 'Roster row marker missing'/)
})

test('every registration state has a glanceable label and group', () => {
  for (const state of [
    'none',
    'incomplete',
    'maybe',
    'confirmed',
    'waitlisted',
    'offered',
    'cancelled',
    'removed_by_organizer',
    'legacy_review',
  ]) {
    const presentation = rosterState(state)
    assert.ok(presentation.label.length > 0, state)
    assert.ok(presentation.group, state)
  }
  assert.equal(rosterState('confirmed').label, 'Going')
  assert.equal(rosterState('offered').label, 'Seat offered')
})

test('roster sorts by status, then waitlist queue, then name', () => {
  const sorted = sortRoster([
    row({ name: 'Zed', state: 'maybe' }),
    row({
      name: 'Late',
      state: 'waitlisted',
      queuedAt: '2026-11-03T00:00:00Z',
    }),
    row({
      name: 'early',
      state: 'waitlisted',
      queuedAt: '2026-11-01T00:00:00Z',
    }),
    row({ name: 'bea', state: 'confirmed' }),
    row({ name: 'Al', state: 'confirmed' }),
    row({ name: 'Offered', state: 'offered' }),
  ])
  assert.deepEqual(
    sorted.map(item => item.name),
    ['Al', 'bea', 'Offered', 'early', 'Late', 'Zed'],
  )
})

test('organizers can search by Discord username or display name', () => {
  const person = row({
    discord: { username: 'mayaclimbs', globalName: 'Maya' },
  })
  assert.equal(matchesRosterSearch(person, 'CLIMBS'), true)
  assert.equal(matchesRosterSearch(person, 'chen'), true)
  assert.equal(matchesRosterSearch(person, 'nobody'), false)
  assert.equal(matchesRosterSearch(row(), '  '), true)
})

test('trip facts read as plain sentences', () => {
  assert.deepEqual(
    spotsLine({ capacity: 12, rsvpCount: 10, waitlistCount: 0 }),
    {
      head: '10 going of 12',
      detail: '2 spots left',
    },
  )
  assert.equal(
    spotsLine({ capacity: 12, rsvpCount: 12, waitlistCount: 3 }).detail,
    '3 on the waitlist',
  )
  assert.equal(spotsLine({ rsvpCount: 4 }).detail, 'No group limit')
  assert.equal(
    tripTimeLine({
      startAt: new Date('2026-11-07T00:00:00Z'),
      endAt: new Date('2026-11-09T00:00:00Z'),
      timeZone: 'America/Los_Angeles',
    }),
    '4:00 PM start · PST',
  )
  assert.equal(tripTimeLine({ startAt: new Date(), isAllDay: true }), null)
  assert.deepEqual(
    signupLine({ status: 'closed', registrationReadOnly: true }),
    { label: 'Closed', value: 'Signups are closed' },
  )
  assert.equal(signupLine({ status: 'cancelled' }), null)
})
