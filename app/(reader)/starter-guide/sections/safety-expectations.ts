import type { Section } from './types'

export const safetyExpectationsSection: Section = {
  id: 'safety-expectations',
  eyebrow: '',
  title: 'Safety & Expectations',
  lede: '',
  tocLabel: 'Safety & Expectations',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    {
      id: 'safety-expectations--safety-philosophy',
      title: 'General safety philosophy',
    },
    {
      id: 'safety-expectations--trip-leaders',
      title: 'Trip leaders & planning',
    },
    {
      id: 'safety-expectations--personal-responsibility',
      title: 'Personal responsibility',
    },
    { id: 'safety-expectations--waivers', title: 'Waivers / acknowledgements' },
    {
      id: 'safety-expectations--communication-norms',
      title: 'Communication norms',
    },
  ],
  blocks: [],
}
