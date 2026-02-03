import Link from 'next/link'
import type { Section } from '@/app/(reader)/start-here/sections'
import { HeroMedia } from '@/components/start-here/HeroMedia'
import { InsetPanel } from '@/components/start-here/InsetPanel'
import { PullQuote } from '@/components/start-here/PullQuote'

const scrollMarginClass = 'scroll-mt-12 md:scroll-mt-16'

type StickyChapterProps = {
  section: Section
  nextId?: string
}

const subsectionScrollClass = 'scroll-mt-24 md:scroll-mt-28'

export function StickyChapter({ section, nextId }: StickyChapterProps) {
  return (
    <section
      id={section.id}
      className={`${scrollMarginClass} py-14 border-t border-border/30 min-h-[120vh] md:min-h-0`}
    >
      <div className="flex flex-col gap-8 md:grid md:grid-cols-[0.45fr_0.55fr] md:gap-10">
        <div className="md:hidden">
          <div className="relative -mx-4 px-4">
            <div className="h-[58vh] max-h-130 min-h-80">
              <div className="sticky top-12 z-10 pt-4 pb-4 bg-background/95 supports-backdrop-filter:bg-background/80 supports-backdrop-filter:backdrop-blur">
                <div className="h-full overflow-hidden rounded-2xl">
                  <HeroMedia
                    caption={section.hero.caption}
                    variant={section.hero.type}
                    mediaClassName="h-full w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden md:block md:sticky md:top-12 md:pt-6">
          <HeroMedia
            caption={section.hero.caption}
            variant={section.hero.type}
            mediaClassName="h-full w-full"
          />
        </div>
        <div className="space-y-6">
          <div>
            {section.eyebrow ? (
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {section.eyebrow}
              </p>
            ) : null}
            <h2 className="mt-2 text-3xl md:text-5xl font-semibold">
              {section.title}
            </h2>
            {section.lede ? (
              <p className="mt-4 text-lg md:text-xl leading-relaxed text-muted-foreground max-w-prose">
                {section.lede}
              </p>
            ) : null}
          </div>
          {section.subsections.length ? (
            <div className="space-y-6">
              {section.subsections.map(subsection => (
                <div
                  key={subsection.id}
                  id={subsection.id}
                  className={`${subsectionScrollClass} space-y-2`}
                >
                  <h3 className="text-sm md:text-base font-semibold uppercase tracking-[0.12em] text-foreground/80">
                    {subsection.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground/80">
                    Add details here.
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          {section.blocks.map((block, index) => {
            if (block.kind === 'p') {
              return (
                <p
                  key={`${section.id}-p-${index}`}
                  className="text-sm md:text-base leading-relaxed text-muted-foreground max-w-prose"
                >
                  {block.text}
                </p>
              )
            }
            if (block.kind === 'list') {
              return (
                <ul
                  key={`${section.id}-list-${index}`}
                  className="space-y-2 text-sm md:text-base text-muted-foreground max-w-prose"
                >
                  {block.items.map(item => (
                    <li key={item} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )
            }
            if (block.kind === 'inset') {
              return (
                <InsetPanel
                  key={`${section.id}-inset-${index}`}
                  title={block.title}
                  rows={block.rows}
                />
              )
            }
            if (block.kind === 'callout') {
              return (
                <PullQuote
                  key={`${section.id}-callout-${index}`}
                  text={block.text}
                />
              )
            }
            if (block.kind === 'comingSoon') {
              return (
                <div
                  key={`${section.id}-soon-${index}`}
                  className="rounded-2xl border border-border/50 bg-secondary/20 p-6"
                >
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Note
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {block.text}
                  </p>
                  <Link
                    href="/"
                    className="mt-4 inline-block text-sm text-foreground/80"
                  >
                    Ask on Discord →
                  </Link>
                </div>
              )
            }
            return null
          })}
          {nextId ? (
            <Link href={`#${nextId}`} className="text-sm text-foreground/70">
              Next chapter →
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
