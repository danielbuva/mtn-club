export const CLUB_DISCLAIMER =
  'The UNLV Mountain Club is a student-run club at the University of Nevada, Las Vegas (UNLV). We operate independently from UNLV. Our activities, events, and programs are organized by our members and are not affiliated with or endorsed by UNLV. Our statements are our own. They do not represent those of UNLV.'

export type PublicHost = {
  name: string
  title: string
}

export type FallTrip = {
  startDate: string
  endDate?: string
  title: string
  hosts: PublicHost[]
  activity: 'bouldering' | 'camping' | 'hiking' | 'sport_climbing'
}

export const WEEKLY_MEETUP_NOTE =
  'Meetups: Tuesdays @ NCC · Thursdays @ UNLV Rock Wall.'

export const FALL_2026_TRIPS: FallTrip[] = [
  {
    startDate: '2026-09-06',
    title: 'Red Rock Sport Climbing',
    activity: 'sport_climbing',
    hosts: [{ name: 'Alyssa Moreno Callaway', title: 'Gear Manager' }],
  },
  {
    startDate: '2026-09-13',
    title: 'Black Mountain Hike',
    activity: 'hiking',
    hosts: [{ name: 'Alex Wright', title: 'Trip Leader' }],
  },
  {
    startDate: '2026-09-19',
    title: 'Red Rock South Oak Creek Hike',
    activity: 'hiking',
    hosts: [{ name: 'Dax Whitaker', title: 'Club President' }],
  },
  {
    startDate: '2026-09-20',
    title: 'Cathedral Rock Sunrise Hike',
    activity: 'hiking',
    hosts: [{ name: 'Alex Wright', title: 'Trip Leader' }],
  },
  {
    startDate: '2026-09-26',
    title: 'Kraft Mountain Night Bouldering',
    activity: 'bouldering',
    hosts: [
      { name: 'Alyssa Moreno Callaway', title: 'Gear Manager' },
      { name: 'Lilly Czerwinski', title: 'Trip Leader' },
    ],
  },
  {
    startDate: '2026-10-03',
    endDate: '2026-10-04',
    title: 'Camping in Lovell Canyon',
    activity: 'camping',
    hosts: [
      { name: 'Wyatt Diaz Gomez', title: 'Treasurer' },
      { name: 'Sophia Pascual', title: 'Community Director' },
    ],
  },
  {
    startDate: '2026-10-10',
    title: 'Echo Overlook Hike',
    activity: 'hiking',
    hosts: [{ name: 'Sophia Pascual', title: 'Community Director' }],
  },
  {
    startDate: '2026-10-16',
    endDate: '2026-10-18',
    title: 'Camp and Climb in Joshua Tree National Park',
    activity: 'sport_climbing',
    hosts: [{ name: 'Dax Whitaker', title: 'Club President' }],
  },
  {
    startDate: '2026-11-06',
    endDate: '2026-11-08',
    title: 'Camp, Climb, and Hike in Zion National Park',
    activity: 'hiking',
    hosts: [{ name: 'Dax Whitaker', title: 'Club President' }],
  },
  {
    startDate: '2026-11-27',
    endDate: '2026-11-29',
    title: 'Camp and Climb in Bishop',
    activity: 'sport_climbing',
    hosts: [{ name: 'Lilly Czerwinski', title: 'Trip Leader' }],
  },
]

const slugifyScheduleValue = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const getFallTripScheduleKey = (trip: FallTrip) =>
  `fall-2026-${slugifyScheduleValue(trip.title)}`

export const formatTripDate = (trip: FallTrip) => {
  const start = new Date(`${trip.startDate}T12:00:00-07:00`)
  const startLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(start)

  if (!trip.endDate) return startLabel

  const end = new Date(`${trip.endDate}T12:00:00-07:00`)
  const endLabel = new Intl.DateTimeFormat('en-US', {
    month: start.getMonth() === end.getMonth() ? undefined : 'short',
    day: 'numeric',
  }).format(end)

  return `${startLabel}–${endLabel}`
}
