import type { ReactNode } from 'react'
import type { AnnouncementSummary } from '@/lib/announcements/types'

// A deliberately small text format: headings, paragraphs, lists and safe links.
// React escapes all text; HTML is never interpreted.
function inline(text: string): ReactNode[] {
  return text.split(/(\[[^\]]+\]\([^\s)]+\))/g).map((part, index) => {
    const match = /^\[([^\]]+)\]\(([^\s)]+)\)$/.exec(part)
    if (!match) return part
    const [, label, href] = match
    const safe = /^https?:\/\//i.test(href) || /^\/(?!\/)/.test(href)
    return safe ? (
      <a
        key={`${index}-${href}`}
        href={href}
        className="underline underline-offset-4 focus-visible:outline-2"
      >
        {label}
      </a>
    ) : (
      label
    )
  })
}
export function AnnouncementContent({
  announcement,
  past = false,
}: {
  announcement: AnnouncementSummary & { content: string }
  past?: boolean
}) {
  return (
    <article className="max-w-3xl">
      <p className="font-brand text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {past
          ? 'From the archives · Past announcement'
          : 'Mountain Club · Field notices'}
      </p>
      <h1 className="mt-5 break-words font-brand text-5xl uppercase leading-none tracking-tight sm:text-7xl">
        {announcement.title}
      </h1>
      {announcement.author_name && (
        <p className="mt-4 font-brand text-sm uppercase tracking-wider text-muted-foreground">
          From {announcement.author_name}
        </p>
      )}
      {announcement.subtitle && (
        <p className="mt-6 whitespace-pre-line font-brand text-2xl">
          {announcement.subtitle}
        </p>
      )}
      {announcement.description && (
        <p className="mt-6 max-w-xl font-serif text-xl leading-relaxed">
          {announcement.description}
        </p>
      )}
      <div className="mt-8 space-y-5 border-t border-foreground/25 pt-8 text-base leading-8">
        {announcement.content
          .split(/\n\s*\n/)
          .filter(Boolean)
          .map((block, index) => {
            const key = `${index}-${block.slice(0, 30)}`
            if (/^#{1,3} /.test(block))
              return (
                <h2 key={key} className="pt-3 font-brand text-3xl uppercase">
                  {inline(block.replace(/^#{1,3} /, ''))}
                </h2>
              )
            if (block.split('\n').every(line => line.startsWith('- ')))
              return (
                <ul key={key} className="list-disc space-y-2 pl-5">
                  {block.split('\n').map((line, i) => (
                    <li key={`${i}-${line}`}>{inline(line.slice(2))}</li>
                  ))}
                </ul>
              )
            return (
              <p key={key} className="whitespace-pre-line break-words">
                {inline(block)}
              </p>
            )
          })}
      </div>
    </article>
  )
}
