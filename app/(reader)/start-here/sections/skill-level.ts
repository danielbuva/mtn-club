import type { Section } from './types'

export const skillLevelSection: Section = {
  id: 'skill-level',
  eyebrow: '',
  title: 'Skill Level & Experience',
  lede: '',
  tocLabel: 'Skill Level & Experience',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    { id: 'skill-level--beginners-welcome', title: 'Beginners welcome?' },
    { id: 'skill-level--need-experience', title: 'Do I need experience?' },
    { id: 'skill-level--need-to-be-fit', title: 'Do I need to be fit?' },
    { id: 'skill-level--learning-on-trips', title: 'Learning on trips' },
    { id: 'skill-level--leading-vs-following', title: 'Leading vs following' },
  ],
  blocks: [],
}
