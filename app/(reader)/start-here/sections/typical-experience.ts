import type { Section } from './types'

export const typicalExperienceSection: Section = {
  id: 'typical-experience',
  eyebrow: '',
  title: 'What a Typical Experience Looks Like',
  lede: '',
  tocLabel: 'What a Typical Experience Looks Like',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    {
      id: 'typical-experience--regular-week',
      title: 'What happens on a regular week',
    },
    { id: 'typical-experience--trip-day', title: 'What happens on a trip day' },
    {
      id: 'typical-experience--weekend-trip',
      title: 'What happens on a weekend trip',
    },
    {
      id: 'typical-experience--social-aspects',
      title: 'Social aspects (carpooling, meals, downtime)',
    },
  ],
  blocks: [],
}
