import {
  type FieldGuideId,
  fieldGuides,
} from '@/app/(reader)/guides/field-guides'
import { publicationDateline } from '@/lib/editorial/dateline'

const revision = publicationDateline(new Date('2026-09-01T00:00:00Z'))

export function FieldGuideCover({ guide }: { guide: FieldGuideId }) {
  const { number, topic, title, dek } = fieldGuides[guide]
  return (
    <header className="pb-8 md:pb-10">
      <p className="font-brand text-[13px] uppercase tracking-[0.14em] text-muted-foreground">
        Field Guide No. {number} · {topic}
      </p>
      <h1 className="mt-4 max-w-3xl font-brand text-5xl font-bold uppercase leading-none md:text-7xl">
        {title}
      </h1>
      <p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground">
        {dek}
      </p>
      <div
        className="mt-6 border-y border-foreground/60 py-0.5"
        aria-hidden="true"
      />
      <p className="mt-3 font-brand text-[13px] uppercase tracking-[0.1em] text-muted-foreground">
        UNLV Mountain Club · Revised {revision}
      </p>
    </header>
  )
}
