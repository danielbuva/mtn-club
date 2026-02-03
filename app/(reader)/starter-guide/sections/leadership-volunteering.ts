import type { Section } from './types'

export const leadershipVolunteeringSection: Section = {
  id: 'leadership-volunteering',
  eyebrow: '',
  title: 'Leadership & Volunteering',
  lede: '',
  tocLabel: 'Leadership & Volunteering',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    { id: 'leadership-volunteering--trip-leaders', title: 'Trip leaders' },
    {
      id: 'leadership-volunteering--helping-on-trips',
      title: 'Helping on trips',
    },
    {
      id: 'leadership-volunteering--gear-closet-help',
      title: 'Gear closet help',
    },
    {
      id: 'leadership-volunteering--board-roles',
      title: 'Board / leadership roles',
    },
  ],
  blocks: [],
}
