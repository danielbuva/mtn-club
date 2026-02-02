export type Section = {
  id: 'welcome' | 'climbing' | 'online' | 'camping' | 'backpacking'
  eyebrow: string
  title: string
  lede: string
  tocLabel: string
  tocDescription: string
  hero: {
    type: 'image' | 'gradient'
    src?: string
    alt?: string
    caption?: string
  }
  blocks: Array<
    | { kind: 'p'; text: string }
    | { kind: 'list'; items: string[] }
    | { kind: 'inset'; title: string; rows: { label: string; value: string }[] }
    | { kind: 'callout'; text: string }
    | { kind: 'comingSoon'; text: string }
  >
}

export const LINKS = {
  discord: 'TODO',
  instagram: 'TODO',
  involvementCenter: 'TODO',
  eventbrite: 'TODO',
  photoCircle: 'TODO',
  newsletter: 'TODO',
}

export const sections: Section[] = [
  {
    id: 'welcome',
    eyebrow: 'Welcome',
    title: 'Welcome / What is Mountain Club?',
    lede: 'UNLV Mountain Club is a student-run community for climbing, hiking, camping, and backpacking. Members show up for weekly meetups, weekend trips, and a supportive learning environment.',
    tocLabel: 'Welcome',
    tocDescription: 'A friendly intro to the club.',
    hero: {
      type: 'gradient',
      caption: 'Climb • Camp • Explore — together.',
    },
    blocks: [
      {
        kind: 'p',
        text: 'Community matters here — you will find friendships, shared learning, and a low-stress way to get outside.',
      },
      {
        kind: 'p',
        text: 'Show up once and you will know the rhythm. After that, it is just choosing which trips to join next.',
      },
      {
        kind: 'callout',
        text: 'Show up once — you’ll know where you belong.',
      },
    ],
  },
  {
    id: 'climbing',
    eyebrow: 'Climbing',
    title: 'Climbing',
    lede: 'Climbing is the weekly anchor. It is the easiest way to meet people and build skills quickly.',
    tocLabel: 'Climbing',
    tocDescription: 'Schedule, prices, and next steps.',
    hero: {
      type: 'gradient',
      caption: 'Chalk, ropes, and a steady weeknight rhythm.',
    },
    blocks: [
      {
        kind: 'p',
        text: 'Meetups are consistent, social, and beginner-friendly. Come once, and you will have partners for the rest of the semester.',
      },
      {
        kind: 'inset',
        title: 'Schedule & Costs',
        rows: [
          {
            label: 'Free days',
            value:
              'every first friday and every first week of semester unlv climbing is free',
          },
          { label: 'Monday', value: 'monday 5-7 meet at unlv rock wall' },
          { label: 'Tuesday', value: 'tuesday and friday meet at ncc' },
          { label: 'Friday', value: 'tuesday and friday meet at ncc' },
          { label: 'UNLV wall', value: 'unlv wall is 10$/ month for students' },
          {
            label: 'NCC day pass',
            value:
              'ncc is $12 student pass any day for mtn club members (just mention mtn club and maybe show student id)',
          },
        ],
      },
      {
        kind: 'p',
        text: 'What to do next: show up on a Monday and introduce yourself.',
      },
    ],
  },
  {
    id: 'online',
    eyebrow: 'Online & Communication',
    title: 'Online & Communication',
    lede: 'This is where planning, RSVPs, and quick updates live.',
    tocLabel: 'Online',
    tocDescription: 'Comms, RSVP, and updates.',
    hero: {
      type: 'gradient',
      caption: 'Your field notes live here.',
    },
    blocks: [
      {
        kind: 'list',
        items: [
          'use discord for communication (link placeholder)',
          'discord for announcements',
          'trip brainstorming on discord',
          'text for carpooling / day-of',
          'eventbrite for rsvp/emergency contact/waiver - coming soon to web app',
          'photocircle for trip photos - coming soon',
          'email newsletter for trip announcements - coming soon (sign up on web app)',
          'instagram',
          'involvement center',
        ],
      },
    ],
  },
  {
    id: 'camping',
    eyebrow: 'Camping',
    title: 'Camping',
    lede: 'Shared dinners, shared gear, and a slow night outside.',
    tocLabel: 'Camping',
    tocDescription: 'Dinner, gear, and trip flow.',
    hero: {
      type: 'gradient',
      caption: 'Warm dinners, shared gear, and a calm night out.',
    },
    blocks: [
      {
        kind: 'list',
        items: [
          'dinner is free',
          'all necessary equipment is rented/shared (except clothing and shoes)',
          'we climb, hike, and explore during trips',
        ],
      },
    ],
  },
  {
    id: 'backpacking',
    eyebrow: 'Backpacking',
    title: 'Backpacking',
    lede: 'We are building this out now. Ask in Discord for the latest plan.',
    tocLabel: 'Backpacking',
    tocDescription: 'Coming soon + ask on Discord.',
    hero: {
      type: 'gradient',
      caption: 'Longer miles are on the way.',
    },
    blocks: [
      {
        kind: 'comingSoon',
        text: 'coming soon / ask on discord',
      },
    ],
  },
]
