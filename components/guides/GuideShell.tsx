import Link from 'next/link'
import {
  type FieldGuideId,
  fieldGuides,
} from '@/app/(reader)/guides/field-guides'
import type { GuideSection } from '@/app/(reader)/guides/types'
import { FieldGuideCover } from '@/components/editorial/field-guide-cover'
import { SectionsDrawer } from '@/components/start-here/SectionsDrawer'
import { StickyChapter } from '@/components/start-here/StickyChapter'

type GuideShellProps = {
  sections: GuideSection[]
  guide: FieldGuideId
}

export function GuideShell({ sections, guide }: GuideShellProps) {
  const order: FieldGuideId[] = ['learn-more', 'gear', 'safety', 'cost', 'faq']
  const nextId = order[(order.indexOf(guide) + 1) % order.length]
  const next = fieldGuides[nextId]
  const footerLabel = guide === 'faq' ? 'Back to' : 'Next:'
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="public-page-top">
        <div className="px-4 pb-24">
          <div className="mx-auto w-full max-w-6xl md:flex md:justify-center md:gap-10">
            <div className="md:w-56 md:shrink-0">
              <SectionsDrawer sections={sections} />
            </div>
            <article className="min-w-0 w-full max-w-215" data-guide-scroll>
              <FieldGuideCover guide={guide} />
              {sections.map(section => (
                <StickyChapter
                  key={section.id}
                  section={
                    section.ctaStyle === 'guide-index'
                      ? {
                          ...section,
                          ctaLinks: section.ctaLinks?.filter(
                            link => link.href.split('#')[0] !== `/${nextId}`,
                          ),
                        }
                      : section
                  }
                  number={
                    section.title
                      ? sections
                          .filter(item => item.title)
                          .findIndex(item => item.id === section.id) + 1
                      : undefined
                  }
                />
              ))}
              <footer className="border-t border-border pt-3">
                <Link
                  href={`/${nextId}`}
                  className="inline-flex min-h-11 items-center py-2 font-brand text-base font-bold uppercase tracking-wide underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {footerLabel} Field Guide No. {next.number} · {next.topic} →
                </Link>
              </footer>
            </article>
          </div>
        </div>
      </main>
    </div>
  )
}
