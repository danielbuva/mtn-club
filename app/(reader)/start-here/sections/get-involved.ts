import type { Section } from './types'

export const getInvolvedSection: Section = {
  id: 'get-involved',
  eyebrow: '',
  title: 'How to Get Involved',
  lede: '',
  tocLabel: 'How to Get Involved',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    { id: 'get-involved--join-discord', title: 'Step 1: Join the Discord' },
    {
      id: 'get-involved--show-up',
      title: 'Step 2: Show up (weekly meetups / wall sessions)',
    },
    { id: 'get-involved--rsvp-trips', title: 'Step 3: RSVP to trips' },
    {
      id: 'get-involved--join-officially',
      title: 'Step 4: Join officially (membership dues)',
    },
  ],
  blocks: [],
}
