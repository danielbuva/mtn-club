import type { Section } from './types'

export const whatWeDoSection: Section = {
  id: 'what-we-do',
  eyebrow: '',
  title: 'What We Do',
  lede: '',
  tocLabel: 'What We Do',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    {
      id: 'what-we-do--overview-of-activities',
      title: 'Overview of activities',
    },
    { id: 'what-we-do--climbing', title: 'Climbing' },
    { id: 'what-we-do--camping', title: 'Camping' },
    { id: 'what-we-do--hiking', title: 'Hiking' },
    { id: 'what-we-do--backpacking', title: 'Backpacking' },
    { id: 'what-we-do--typical-trip-cadence', title: 'Typical trip cadence' },
    { id: 'what-we-do--local-vs-regional', title: 'Local vs regional trips' },
    { id: 'what-we-do--indoor-vs-outdoor', title: 'Indoor vs outdoor balance' },
  ],
  blocks: [],
}
