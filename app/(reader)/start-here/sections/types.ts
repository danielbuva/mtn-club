export type SectionId =
  | 'welcome'
  | 'what-club-is'
  | 'what-we-do'
  | 'typical-experience'
  | 'get-involved'
  | 'membership-basics'
  | 'gear-equipment'
  | 'skill-level'
  | 'safety-expectations'
  | 'communication-platforms'
  | 'time-commitment'
  | 'cost-transparency'
  | 'community-culture'
  | 'leadership-volunteering'
  | 'faq'
  | 'where-next'
  | 'contact'

type Subsection = {
  id: string
  title: string
}

export type Section = {
  id: SectionId
  eyebrow: ''
  title: string
  lede: string
  tocLabel: string
  tocDescription: string
  hero: {
    type: 'image' | 'gradient'
    src?: string
    alt?: string
    caption?: string
  }
  subsections: Subsection[]
  blocks: Array<
    | { kind: 'p'; text: string }
    | { kind: 'list'; items: string[] }
    | { kind: 'inset'; title: string; rows: { label: string; value: string }[] }
    | { kind: 'callout'; text: string }
    | { kind: 'comingSoon'; text: string }
  >
}
