import type { Section } from './types'

export const whereNextSection: Section = {
  id: 'where-next',
  eyebrow: '',
  title: 'Where to Go Next',
  lede: '',
  tocLabel: 'Where to Go Next',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    { id: 'where-next--trips-photos', title: 'Explore Trips & Photos ->' },
    { id: 'where-next--view-activities', title: 'View Activities ->' },
    { id: 'where-next--join', title: 'Join ->' },
    { id: 'where-next--join-discord', title: 'Join Discord ->' },
  ],
  blocks: [],
}
