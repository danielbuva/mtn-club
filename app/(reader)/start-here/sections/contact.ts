import type { Section } from './types'

export const contactSection: Section = {
  id: 'contact',
  eyebrow: '',
  title: 'Contact / Ask a Question',
  lede: '',
  tocLabel: 'Contact / Ask a Question',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    { id: 'contact--how-to-ask', title: 'How to ask questions' },
    { id: 'contact--where-to-message', title: 'Where to message' },
    { id: 'contact--who-to-contact', title: 'Who to contact' },
  ],
  blocks: [],
}
