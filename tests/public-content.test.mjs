import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CLUB_DISCLAIMER,
  WEEKLY_MEETUP_NOTE,
  WEEKLY_MEETUPS,
} from '../lib/club-content.ts'

test('publishes weekly meetups as one compact note', () => {
  assert.equal(
    WEEKLY_MEETUP_NOTE,
    'Meetups: Tuesdays at 5 p.m. @ NCC · Thursdays at 5 p.m. @ UNLV Rock Wall.',
  )
})

test('links the Tuesday meetup to Nevada Climbing Center', () => {
  assert.deepEqual(WEEKLY_MEETUPS[0], {
    day: 'Tuesdays',
    time: '5 p.m.',
    location: 'NCC',
    href: 'https://nevadaclimbingcenters.com/',
  })
})

test('keeps the required disclaimer verbatim', () => {
  assert.equal(
    CLUB_DISCLAIMER,
    'The UNLV Mountain Club is a student-run club at the University of Nevada, Las Vegas (UNLV). We operate independently from UNLV. Our activities, events, and programs are organized by our members and are not affiliated with or endorsed by UNLV. Our statements are our own. They do not represent those of UNLV.',
  )
})
