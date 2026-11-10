import { Suspense } from 'react'
import type { GuideSection } from '@/app/(reader)/guides/types'
import { FieldNote } from '@/components/editorial/field-note'
import { GuideBlocks } from '@/components/guides/GuideBlocks'
import {
  GuideCtas,
  GuideCtasSkeleton,
  MembershipAwareGuideCtas,
} from '@/components/guides/GuideCtas'
import { GuideSection as GuideSectionWrapper } from '@/components/guides/GuideSection'

export function StickyChapter({
  section,
  number,
}: {
  section: GuideSection
  number?: number
}) {
  const hasMembershipCta = section.ctaLinks?.some(
    link => link.href === '/membership-sign-up',
  )
  const ctaClassName =
    !section.title && !section.blocks.length && !section.subsections?.length
      ? 'mt-0 border-t-0 pt-0'
      : undefined
  const content = <GuideBlocks blocks={section.blocks} />
  return (
    <GuideSectionWrapper id={section.id}>
      <div className="space-y-5">
        {section.title && (
          <header className="space-y-2">
            {number && (
              <p className="font-brand text-[13px] uppercase tracking-[0.14em] text-muted-foreground">
                § {String(number).padStart(2, '0')}
                {section.eyebrow ? ` · ${section.eyebrow}` : ''}
              </p>
            )}
            <h2
              data-guide-highlight={section.id}
              className="font-brand text-2xl font-bold uppercase leading-none md:text-3xl"
            >
              {section.title}
            </h2>
          </header>
        )}
        {section.lede && (
          <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
            {section.lede}
          </p>
        )}
        {section.subsections?.length ? (
          <div className="grid border-l border-t border-border md:grid-cols-2">
            {section.subsections.map(subsection => (
              <div
                key={subsection.id}
                id={subsection.id}
                className="scroll-mt-20 space-y-2 border-r border-b border-border p-4 md:p-5"
              >
                <h3
                  data-guide-highlight={subsection.id}
                  className="font-brand text-lg font-bold uppercase leading-tight"
                >
                  {subsection.title}
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {subsection.body}
                </p>
              </div>
            ))}
          </div>
        ) : null}
        {section.variant === 'card' ? (
          <FieldNote>{content}</FieldNote>
        ) : (
          content
        )}
        {section.ctaLinks?.length ? (
          hasMembershipCta ? (
            <Suspense fallback={<GuideCtasSkeleton className={ctaClassName} />}>
              <MembershipAwareGuideCtas
                links={section.ctaLinks}
                style={section.ctaStyle}
                className={ctaClassName}
              />
            </Suspense>
          ) : (
            <GuideCtas
              links={section.ctaLinks}
              style={section.ctaStyle}
              className={ctaClassName}
            />
          )
        ) : null}
      </div>
    </GuideSectionWrapper>
  )
}
