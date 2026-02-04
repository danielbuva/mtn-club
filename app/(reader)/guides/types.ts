export type GuideCtaLink = {
  label: string
  href: string
}

export type GuideSubsection = {
  id: string
  title: string
  body: string
}

export type GuideBlock =
  | { kind: 'p'; text: string }
  | { kind: 'pRich'; parts: GuideInlinePart[] }
  | { kind: 'list'; items: string[] }
  | { kind: 'listRich'; items: GuideInlinePart[][] }
  | { kind: 'numbered'; items: string[] }
  | { kind: 'numberedRich'; items: GuideInlinePart[][] }
  | { kind: 'note'; text: string }
  | { kind: 'qa'; items: Array<{ question: string; answer: string }> }
  | { kind: 'inset'; title: string; rows: { label: string; value: string }[] }
  | { kind: 'callout'; text: string }
  | { kind: 'comingSoon'; text: string }

export type GuideInlinePart =
  | { text: string }
  | { link: { label: string; href: string } }

export type GuideSection = {
  id: string
  title: string
  eyebrow?: string
  lede?: string
  tocLabel?: string
  tocDescription?: string
  hideInToc?: boolean
  variant?: 'default' | 'card'
  subsections?: GuideSubsection[]
  blocks: GuideBlock[]
  ctaLinks?: GuideCtaLink[]
}
