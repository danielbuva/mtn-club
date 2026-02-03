import type { Section } from './types'

export const faqSection: Section = {
  id: 'faq',
  eyebrow: '',
  title: 'FAQ',
  lede: '',
  tocLabel: 'FAQ',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    { id: 'faq--come-alone', title: 'Can I come alone?' },
    { id: 'faq--bring-friends', title: 'Can I bring friends?' },
    { id: 'faq--need-car', title: 'Do I need a car?' },
    { id: 'faq--never-climbed', title: "What if I've never climbed?" },
    { id: 'faq--only-once', title: 'What if I can only come once?' },
  ],
  blocks: [],
}
