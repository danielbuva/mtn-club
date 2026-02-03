import type { Section } from './types'

export const costTransparencySection: Section = {
  id: 'cost-transparency',
  eyebrow: '',
  title: 'Cost Transparency',
  lede: '',
  tocLabel: 'Cost Transparency',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    { id: 'cost-transparency--membership-dues', title: 'Membership dues' },
    {
      id: 'cost-transparency--typical-trip-costs',
      title: 'Typical trip costs',
    },
    { id: 'cost-transparency--gas-food-norms', title: 'Gas & food norms' },
    { id: 'cost-transparency--usually-free', title: "What's usually free" },
    {
      id: 'cost-transparency--sometimes-split',
      title: "What's sometimes split",
    },
  ],
  blocks: [],
}
