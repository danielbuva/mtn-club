import type { Section } from './types'

export const timeCommitmentSection: Section = {
  id: 'time-commitment',
  eyebrow: '',
  title: 'Time Commitment',
  lede: '',
  tocLabel: 'Time Commitment',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    {
      id: 'time-commitment--how-often',
      title: 'How often you need to show up',
    },
    { id: 'time-commitment--drop-in', title: 'Drop-in vs regular involvement' },
    { id: 'time-commitment--busy-weeks', title: 'Busy weeks vs active weeks' },
    {
      id: 'time-commitment--no-pressure',
      title: 'No-pressure participation culture',
    },
  ],
  blocks: [],
}
