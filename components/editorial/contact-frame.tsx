import type { ReactNode } from 'react'

/** Photo figure; pass title, optional date/location/credit metadata, and caption. */
export function ContactFrame({
  number,
  title,
  caption,
  meta,
  children,
}: {
  number: number | string
  title?: string
  caption?: ReactNode
  meta?: ReactNode
  children: ReactNode
}) {
  const frameNumber = String(number).padStart(2, '0')
  return (
    <figure className="border border-foreground/80">
      <div className="relative">{children}</div>
      {(title || meta || caption) && (
        <figcaption className="space-y-1 border-t border-foreground/80 bg-background px-3 py-3 text-[13px] leading-5 text-muted-foreground sm:text-sm">
          <p>
            <span className="mr-2 text-xs tabular-nums">{frameNumber}</span>
            {title}
            {title && meta ? ' — ' : null}
            {meta}
          </p>
          {caption && <div>{caption}</div>}
        </figcaption>
      )}
    </figure>
  )
}
