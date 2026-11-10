import Link from 'next/link'
import { EditionLabel } from '@/components/editorial/edition-label'
import type { SpecialCover } from '@/lib/editorial/cover-editions'

/** Persistent event link, independent of the cover photo crossfade. */
export function CoverEditionCard({ cover }: { cover: SpecialCover }) {
  return (
    <Link
      href={cover.href}
      data-home-edition-card
      className="home-edition-card pointer-events-auto absolute top-4 left-4 block w-[280px] max-w-[calc(100%-32px)] bg-[#211D18] p-3 text-[#F8F1DF] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFECA2] lg:top-auto lg:bottom-20 lg:left-6 lg:w-[340px] lg:p-4"
    >
      <EditionLabel className="border-0 p-0 text-[#FFECA2]">
        {cover.edition.label}
      </EditionLabel>
      <p className="mt-1 font-brand text-[24px] font-bold uppercase leading-none lg:text-4xl">
        {cover.edition.headline}
      </p>
      <p className="mt-1 text-[13px] leading-5 lg:mt-2">{cover.subline}</p>
      <p className="mt-1 text-[13px] leading-5 text-[#FFECA2] underline underline-offset-4">
        Read the trip →
      </p>
    </Link>
  )
}
