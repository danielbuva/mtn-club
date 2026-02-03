import type { Section } from './types'

export const welcomeSection: Section = {
  id: 'welcome',
  eyebrow: '',
  title: 'Welcome / Orientation',
  lede: '',
  tocLabel: 'Welcome / Orientation',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    {
      id: 'welcome--welcome-to-unlv-mountain-club',
      title: 'Welcome to UNLV Mountain Club',
    },
    { id: 'welcome--who-this-is-for', title: 'Who this is for' },
    { id: 'welcome--who-this-is-not-for', title: 'Who this is not for' },
    {
      id: 'welcome--one-sentence-mission',
      title: 'One-sentence mission / vibe',
    },
  ],
  blocks: [],
}
