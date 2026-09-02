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
    { id: 'communication-platforms--calendar', title: 'Public calendar' },
    { id: 'communication-platforms--instagram', title: 'Instagram' },
    {
      id: 'communication-platforms--web-app',
      title: 'Web app (what exists now vs coming soon)',
    },
  ],
  blocks: [],
}
