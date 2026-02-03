import type { Section } from './types'

export const communicationPlatformsSection: Section = {
  id: 'communication-platforms',
  eyebrow: '',
  title: 'Communication & Platforms',
  lede: '',
  tocLabel: 'Communication & Platforms',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    { id: 'communication-platforms--discord', title: 'Discord (primary)' },
    {
      id: 'communication-platforms--texts',
      title: 'Texts (day-of coordination)',
    },
    { id: 'communication-platforms--eventbrite', title: 'Eventbrite (RSVPs)' },
    { id: 'communication-platforms--instagram', title: 'Instagram' },
    {
      id: 'communication-platforms--email-newsletter',
      title: 'Email newsletter',
    },
    {
      id: 'communication-platforms--web-app',
      title: 'Web app (what exists now vs coming soon)',
    },
  ],
  blocks: [],
}
