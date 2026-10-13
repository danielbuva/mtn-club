export const CLUB_DISCLAIMER =
  'The UNLV Mountain Club is a student-run club at the University of Nevada, Las Vegas (UNLV). We operate independently from UNLV. Our activities, events, and programs are organized by our members and are not affiliated with or endorsed by UNLV. Our statements are our own. They do not represent those of UNLV.'

export type PublicHost = {
  name: string
  title: string
}

export const WEEKLY_MEETUP_NOTE =
  'Meetups: Tuesdays at 5 p.m. @ NCC · Thursdays at 5 p.m. @ UNLV Rock Wall.'

export const WEEKLY_MEETUPS = [
  {
    day: 'Tuesdays',
    time: '5 p.m.',
    location: 'NCC',
    href: 'https://nevadaclimbingcenters.com/',
  },
  {
    day: 'Thursdays',
    time: '5 p.m.',
    location: 'UNLV Rock Wall',
    href: null,
  },
] as const
