import type { Section } from './types'

export const gearEquipmentSection: Section = {
  id: 'gear-equipment',
  eyebrow: '',
  title: 'Gear & Equipment',
  lede: '',
  tocLabel: 'Gear & Equipment',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    { id: 'gear-equipment--gear-provided', title: 'What gear is provided' },
    {
      id: 'gear-equipment--bring-yourself',
      title: 'What you need to bring yourself',
    },
    { id: 'gear-equipment--gear-rentals', title: 'Gear rentals / gear closet' },
    {
      id: 'gear-equipment--no-gear-required',
      title: 'No-gear-required reassurance',
    },
  ],
  blocks: [],
}
