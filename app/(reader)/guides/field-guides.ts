export const fieldGuides = {
  'learn-more': {
    number: '01',
    topic: 'Start here',
    title: 'Find your way outside',
    dek: 'A practical introduction to the club, the trips, and your first day.',
  },
  gear: {
    number: '02',
    topic: 'Gear',
    title: 'What do I bring?',
    dek: 'Shared equipment, personal essentials, and a little preparation.',
  },
  safety: {
    number: '03',
    topic: 'Safety',
    title: 'Look out for each other',
    dek: 'Plan carefully, speak up early, and take responsibility together.',
  },
  cost: {
    number: '04',
    topic: 'Cost',
    title: 'Know before you go',
    dek: 'Membership dues, shared costs, and what you can try for free.',
  },
  faq: {
    number: '05',
    topic: 'FAQ',
    title: 'A few good questions',
    dek: 'Quick answers for your first meetup, first trip, and everything between.',
  },
} as const

export type FieldGuideId = keyof typeof fieldGuides
