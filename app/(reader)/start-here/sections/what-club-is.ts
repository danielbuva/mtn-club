import type { Section } from './types'

export const whatClubIsSection: Section = {
  id: 'what-club-is',
  eyebrow: '',
  title: 'What the Club Is',
  lede: '',
  tocLabel: 'What the Club Is',
  tocDescription: '',
  hero: {
    type: 'gradient',
  },
  subsections: [
    {
      id: 'what-club-is--student-run',
      title: 'Student-run outdoor club at UNLV',
    },
    {
      id: 'what-club-is--what-makes-us-different',
      title: 'What makes us different from other clubs',
    },
    {
      id: 'what-club-is--informal-vs-organized',
      title: 'Informal vs organized trips',
    },
    {
      id: 'what-club-is--skill-levels-inclusivity',
      title: 'Skill levels and inclusivity',
    },
    {
      id: 'what-club-is--safety-ethos',
      title: 'Safety and responsibility ethos',
    },
  ],
  blocks: [],
}
