import type { Section } from './types'

export const communityCultureSection: Section = {
  id: 'community-culture',
  eyebrow: '',
  title: 'Community & Culture',
  lede: '',
  tocLabel: 'Community & Culture',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    { id: 'community-culture--club-values', title: 'Club values' },
    {
      id: 'community-culture--inclusivity-statement',
      title: 'Inclusivity statement',
    },
    {
      id: 'community-culture--learning-mentorship',
      title: 'Learning & mentorship culture',
    },
    { id: 'community-culture--social-dynamics', title: 'Social dynamics' },
    {
      id: 'community-culture--respect-conduct',
      title: 'Respect & conduct expectations',
    },
  ],
  blocks: [],
}
