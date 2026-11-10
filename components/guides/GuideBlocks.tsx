import Link from 'next/link'
import type { ReactNode } from 'react'
import type { GuideBlock, GuideInlinePart } from '@/app/(reader)/guides/types'
import { FieldNote } from '@/components/editorial/field-note'
import { ZELLE_PHONE_DISPLAY } from '@/lib/constants'
import { CopyEmailButton } from './CopyEmailButton'

function GuideText({ text }: { text: string }) {
  return text.split(ZELLE_PHONE_DISPLAY).map((part, index) => (
    <span key={`${index}-${part}`}>
      {index > 0 && (
        <span className="whitespace-nowrap">{ZELLE_PHONE_DISPLAY}</span>
      )}
      {part}
    </span>
  ))
}

function InlineParts({ parts }: { parts: GuideInlinePart[] }) {
  return parts.map((part, index) =>
    'link' in part ? (
      <Link
        key={`${part.link.href}-${index}`}
        href={part.link.href}
        className="py-3 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {part.link.label}
      </Link>
    ) : (
      <GuideText key={`${part.text}-${index}`} text={part.text} />
    ),
  )
}

function ItemSheet({
  items,
  numbered = false,
  checklist = false,
  columns = false,
}: {
  items: ReactNode[]
  numbered?: boolean
  checklist?: boolean
  columns?: boolean
}) {
  const List = numbered ? 'ol' : 'ul'
  return (
    <List
      role="list"
      className={`grid ${columns ? 'md:grid-cols-2 md:gap-x-6' : ''}`}
    >
      {items.map((item, index) => (
        <li
          key={typeof item === 'string' ? item : index}
          className="flex gap-3 border-t border-border py-3 text-base leading-relaxed"
        >
          {checklist ? (
            <span
              aria-hidden="true"
              className="mt-1.5 size-3 shrink-0 border border-foreground/60"
            />
          ) : numbered ? (
            <span
              aria-hidden="true"
              className="w-6 shrink-0 pt-0.5 font-brand text-[13px] tabular-nums text-muted-foreground"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="mt-3 size-1 shrink-0 bg-current"
            />
          )}
          <div className="min-w-0">{item}</div>
        </li>
      ))}
    </List>
  )
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.kind) {
    case 'label':
      return (
        <p className="font-brand text-lg font-bold uppercase text-foreground">
          {block.text}
        </p>
      )
    case 'p':
      return (
        <p className="max-w-prose">
          <GuideText text={block.text} />
        </p>
      )
    case 'pRich':
      return (
        <p className="max-w-prose">
          <InlineParts parts={block.parts} />
        </p>
      )
    case 'list':
      return (
        <ItemSheet
          items={block.items}
          checklist={block.variant === 'checklist'}
          columns={block.columns}
        />
      )
    case 'numbered':
      return <ItemSheet items={block.items} numbered />
    case 'listRich':
    case 'numberedRich':
      return (
        <ItemSheet
          items={block.items.map(parts => (
            <InlineParts
              key={parts
                .map(part => ('text' in part ? part.text : part.link.href))
                .join('|')}
              parts={parts}
            />
          ))}
          numbered={block.kind === 'numberedRich'}
        />
      )
    case 'note':
    case 'callout':
      return <FieldNote>{block.text}</FieldNote>
    case 'notice':
      return (
        <FieldNote>
          <p>
            <GuideText text={block.text} />
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${block.email}`}
              className="inline-flex min-h-11 items-center break-all underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {block.email}
            </a>
            <CopyEmailButton value={block.email} />
          </div>
        </FieldNote>
      )
    case 'qa':
      return (
        <dl className="divide-y divide-border">
          {block.items.map(item => (
            <div key={item.question} className="space-y-2 py-4 first:pt-0">
              <dt className="font-brand text-xl font-bold uppercase leading-tight text-foreground">
                {item.question}
              </dt>
              <dd className="max-w-prose">{item.answer}</dd>
            </div>
          ))}
        </dl>
      )
    case 'inset':
      return (
        <FieldNote label={block.title}>
          <dl className="divide-y divide-border">
            {block.rows.map(row => (
              <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-2">
                <dt className="font-brand font-bold uppercase">{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </FieldNote>
      )
    case 'comingSoon':
      return <FieldNote>{block.text}</FieldNote>
  }
}

export function GuideBlocks({ blocks }: { blocks: GuideBlock[] }) {
  if (!blocks.length) return null
  return (
    <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
      {blocks.map((block, index) => (
        <Block key={`${block.kind}-${index}`} block={block} />
      ))}
    </div>
  )
}
