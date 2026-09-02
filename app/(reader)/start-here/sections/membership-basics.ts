import type { Section } from './types'

export const membershipBasicsSection: Section = {
  id: 'membership-basics',
  eyebrow: '',
  title: 'Membership Basics',
  lede: '',
  tocLabel: 'Membership Basics',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    {
      id: 'membership-basics--need-to-be-member',
      title: 'Do I need to be a member to participate?',
    },
    {
      id: 'membership-basics--membership-access',
      title: 'Benefits will be published after officer approval',
    },
    { id: 'membership-basics--annual-dues', title: 'Annual dues (high-level)' },
    { id: 'membership-basics--dues-used', title: 'How dues are used' },
    { id: 'membership-basics--join-later', title: 'Joining later vs now' },
  ],
  blocks: [],
}
