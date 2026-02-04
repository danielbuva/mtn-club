import Link from 'next/link'
import type { GuideInlinePart, GuideSection } from '@/app/(reader)/guides/types'
import { GuideCtas } from '@/components/guides/GuideCtas'
import { GuideSection as GuideSectionWrapper } from '@/components/guides/GuideSection'
import { InsetPanel } from '@/components/start-here/InsetPanel'
import { PullQuote } from '@/components/start-here/PullQuote'

type StickyChapterProps = {
  section: GuideSection
}

const subsectionScrollClass = 'scroll-mt-20 md:scroll-mt-24'

export function StickyChapter({ section }: StickyChapterProps) {
  const blockKey = (block: GuideSection['blocks'][number]) => {
    switch (block.kind) {
      case 'p':
        return `p-${block.text}`
      case 'pRich':
        return `p-rich-${block.parts.map(part => ('link' in part ? part.link.label : part.text)).join('|')}`
      case 'list':
        return `list-${block.items.join('|')}`
      case 'numbered':
        return `numbered-${block.items.join('|')}`
      case 'note':
        return `note-${block.text}`
      case 'qa':
        return `qa-${block.items.map(item => item.question).join('|')}`
      case 'inset':
        return `inset-${block.title}`
      case 'callout':
        return `callout-${block.text}`
      case 'comingSoon':
        return `soon-${block.text}`
      default:
        return 'block'
    }
  }

  const isCard = section.variant === 'card'

  const renderInlineParts = (parts: GuideInlinePart[]) =>
    parts.map((part, partIndex) => {
      if ('link' in part) {
        if (!part.link.href)
          return (
            <span key={`${part.link.label}-${partIndex}`}>
              {part.link.label}
            </span>
          )
        return (
          <Link
            key={`${part.link.href}-${partIndex}`}
            href={part.link.href}
            className="underline decoration-foreground/30 underline-offset-4 transition hover:text-foreground"
          >
            {part.link.label}
          </Link>
        )
      }
      return <span key={`${part.text}-${partIndex}`}>{part.text}</span>
    })

  const isCtaOnly =
    Boolean(section.ctaLinks?.length) &&
    section.blocks.length === 0 &&
    !section.subsections?.length

  const blocksContent = (
    <div
      className={isCard ? 'space-y-3 md:space-y-4' : 'space-y-3 md:space-y-4'}
    >
      {section.subsections?.length ? (
        <div className="space-y-4 md:space-y-5">
          {section.subsections.map(subsection => (
            <div
              key={subsection.id}
              id={subsection.id}
              className={`${subsectionScrollClass} space-y-2`}
            >
              <h3 className="text-sm md:text-base font-semibold uppercase tracking-[0.12em] text-foreground/80">
                {subsection.title}
              </h3>
              <p className="text-sm md:text-base leading-7 text-muted-foreground/80 max-w-prose">
                {subsection.body}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {section.blocks.map(block => {
        if (block.kind === 'p') {
          return (
            <p
              key={blockKey(block)}
              className="text-sm md:text-base leading-7 text-muted-foreground max-w-prose"
            >
              {block.text}
            </p>
          )
        }
        if (block.kind === 'pRich') {
          return (
            <p
              key={blockKey(block)}
              className="text-sm md:text-base leading-7 text-muted-foreground max-w-prose"
            >
              <span className="flex flex-wrap gap-x-1 gap-y-0.5">
                {renderInlineParts(block.parts)}
              </span>
            </p>
          )
        }
        if (block.kind === 'list') {
          return (
            <ul
              key={blockKey(block)}
              className="space-y-2 md:space-y-3 pl-4 text-sm md:text-base leading-7 text-muted-foreground max-w-prose"
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
        if (block.kind === 'listRich') {
          return (
            <ul
              key={blockKey(block)}
              className="space-y-2 md:space-y-3 pl-4 text-sm md:text-base leading-7 text-muted-foreground max-w-prose"
            >
              {block.items.map((parts, itemIndex) => (
                <li
                  key={`${section.id}-list-rich-${itemIndex}`}
                  className="flex gap-2"
                >
                  <span className="text-primary">•</span>
                  <span className="flex flex-wrap gap-x-1 gap-y-0.5">
                    {renderInlineParts(parts)}
                  </span>
                </li>
              ))}
            </ul>
          )
        }
        if (block.kind === 'numbered') {
          return (
            <ol
              key={blockKey(block)}
              className="space-y-2 md:space-y-3 pl-4 text-sm md:text-base leading-7 text-muted-foreground max-w-prose"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${section.id}-${item}`} className="flex gap-2">
                  <span className="text-primary tabular-nums">
                    {itemIndex + 1}.
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          )
        }
        if (block.kind === 'numberedRich') {
          return (
            <ol
              key={blockKey(block)}
              className="space-y-2 md:space-y-3 pl-4 text-sm md:text-base leading-7 text-muted-foreground max-w-prose"
            >
              {block.items.map((parts, itemIndex) => (
                <li
                  key={`${section.id}-rich-${itemIndex}`}
                  className="flex gap-2"
                >
                  <span className="text-primary tabular-nums">
                    {itemIndex + 1}.
                  </span>
                  <span className="flex flex-wrap gap-x-1 gap-y-0.5">
                    {renderInlineParts(parts)}
                  </span>
                </li>
              ))}
            </ol>
          )
        }
        if (block.kind === 'note') {
          return (
            <p
              key={blockKey(block)}
              className="text-sm md:text-base leading-7 text-muted-foreground/80 italic max-w-prose"
            >
              {block.text}
            </p>
          )
        }
        if (block.kind === 'qa') {
          return (
            <div key={blockKey(block)} className="space-y-4 max-w-prose">
              {block.items.map(item => (
                <div key={item.question} className="space-y-1">
                  <p className="text-sm md:text-base font-semibold text-foreground/90">
                    {item.question}
                  </p>
                  <p className="text-sm md:text-base text-muted-foreground max-w-prose">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          )
        }
        if (block.kind === 'inset') {
          return (
            <InsetPanel
              key={blockKey(block)}
              title={block.title}
              rows={block.rows}
            />
          )
        }
        if (block.kind === 'callout') {
          return <PullQuote key={blockKey(block)} text={block.text} />
        }
        if (block.kind === 'comingSoon') {
          return (
            <div
              key={blockKey(block)}
              className="rounded-2xl border border-border/50 bg-secondary/20 p-6"
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Note
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{block.text}</p>
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
      {section.ctaLinks?.length ? <GuideCtas links={section.ctaLinks} /> : null}
    </div>
  )

  const renderTitle = () => {
    if (!section.title) return null
    const match = section.title.match(/^(.+?)\s*(\(.+\))$/)
    if (!match) return section.title
    const [, main, subtitle] = match
    return (
      <>
        <span>{main}</span>
        <span className="ml-2 text-lg md:text-2xl font-medium text-muted-foreground/80">
          {subtitle}
        </span>
      </>
    )
  }

  return (
    <GuideSectionWrapper
      id={section.id}
      className={isCard ? 'py-6 md:py-8 border-t-0' : undefined}
    >
      <div className="flex flex-col gap-6 md:gap-8">
        <div
          className={
            isCard
              ? 'max-w-prose rounded-2xl border border-border/40 bg-secondary/20 p-6 md:p-8'
              : 'max-w-prose'
          }
        >
          {section.eyebrow ? (
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {section.eyebrow}
            </p>
          ) : null}
          {section.title ? (
            <h2
              className={
                isCard
                  ? 'text-2xl md:text-3xl font-semibold'
                  : `mt-2 text-3xl md:text-5xl font-semibold ${
                      isCtaOnly ? 'text-right' : ''
                    }`
              }
            >
              {renderTitle()}
            </h2>
          ) : null}
          {section.lede ? (
            <p className="mt-3 md:mt-4 text-lg md:text-xl leading-relaxed text-muted-foreground max-w-prose">
              {section.lede}
            </p>
          ) : null}
          {isCard ? blocksContent : null}
        </div>
        {isCard ? null : blocksContent}
      </div>
    </GuideSectionWrapper>
  )
}
