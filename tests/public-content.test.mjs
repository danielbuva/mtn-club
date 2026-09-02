import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CLUB_DISCLAIMER,
  FALL_2026_TRIPS,
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

test('publishes all ten supplied special trips as date-only inventory', () => {
  assert.equal(FALL_2026_TRIPS.length, 10)
  assert.deepEqual(
    FALL_2026_TRIPS.map(trip => [trip.startDate, trip.endDate, trip.title]),
    [
      ['2026-09-06', undefined, 'Red Rock Sport Climbing'],
      ['2026-09-13', undefined, 'Black Mountain Hike'],
      ['2026-09-19', undefined, 'Red Rock South Oak Creek Hike'],
      ['2026-09-20', undefined, 'Cathedral Rock Sunrise Hike'],
      ['2026-09-26', undefined, 'Kraft Mountain Night Bouldering'],
      ['2026-10-03', '2026-10-04', 'Camping in Lovell Canyon'],
      ['2026-10-10', undefined, 'Echo Overlook Hike'],
      [
        '2026-10-16',
        '2026-10-18',
        'Camp and Climb in Joshua Tree National Park',
      ],
      [
        '2026-11-06',
        '2026-11-08',
        'Camp, Climb, and Hike in Zion National Park',
      ],
      ['2026-11-27', '2026-11-29', 'Camp and Climb in Bishop'],
    ],
  )
})

test('keeps the required disclaimer verbatim', () => {
  assert.equal(
    CLUB_DISCLAIMER,
    'The UNLV Mountain Club is a student-run club at the University of Nevada, Las Vegas (UNLV). We operate independently from UNLV. Our activities, events, and programs are organized by our members and are not affiliated with or endorsed by UNLV. Our statements are our own. They do not represent those of UNLV.',
  )
})
