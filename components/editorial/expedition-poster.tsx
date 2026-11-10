import type { SpecialEdition } from '@/lib/editorial/editions'
import { cn } from '@/lib/utils'
import { ArchiveStamp } from './archive-stamp'
import { EditionLabel } from './edition-label'
import { EditionPhoto } from './edition-photo'

/** A framed club photograph and solid type plate, set like a printed cover. */
export function ExpeditionPoster({
  edition,
  title,
  place,
  dateLabel,
  status,
  size,
  variant = 'cover',
}: {
  edition: SpecialEdition
  title: string
  place: string
  dateLabel: string
  status?: 'open' | 'closed' | 'canceled' | 'past'
  size: 'hero' | 'card'
  variant?: 'cover' | 'list'
}) {
  const canceled = status === 'canceled'
  const ink = edition.tone === 'ink' && !canceled
  return (
    <figure
      aria-label={title}
      className={cn(
        'border border-foreground/80 p-3 md:p-4',
        canceled
          ? 'bg-[#F8F1DF] text-[#211D18]'
          : ink
            ? 'bg-[#211D18] text-[#F8F1DF]'
            : 'bg-[#FFECA2] text-[#211D18]',
      )}
    >
      <div className="md:grid md:min-h-80 md:grid-cols-[3fr_2fr]">
        <div className="relative">
          <EditionPhoto
            edition={edition}
            canceled={canceled}
            className={
              size === 'hero'
                ? 'aspect-4/3 md:absolute md:inset-0 md:aspect-auto'
                : 'aspect-video md:absolute md:inset-0 md:aspect-auto'
            }
          />
          {(canceled || status === 'past') && (
            <div
              className={cn(
                'absolute top-3 max-w-[45%]',
                edition.photo.overlayCorner === 'top-left'
                  ? 'left-3'
                  : 'right-3',
              )}
            >
              <ArchiveStamp tone={ink ? 'paper' : 'ink'}>
                {canceled ? 'Canceled' : 'From the archive'}
              </ArchiveStamp>
            </div>
          )}
        </div>
        <div
          className={cn(
            'relative space-y-3 pt-5 md:flex md:flex-col md:justify-center md:py-6 md:pl-6',
            canceled ? 'bg-[#F8F1DF]' : ink ? 'bg-[#211D18]' : 'bg-[#FFECA2]',
          )}
        >
          <EditionLabel variant="outline">{edition.label}</EditionLabel>
          <p
            className={cn(
              'font-brand font-bold uppercase',
              size === 'hero'
                ? 'text-4xl md:text-5xl lg:text-6xl'
                : 'text-3xl sm:text-4xl',
              'leading-none',
            )}
          >
            {edition.headline}
          </p>
          <p className="text-[15px]">{edition.kicker}</p>
          {variant === 'cover' && (
            <p className="border-t border-current pt-2 font-brand text-[13px] uppercase tracking-wide">
              {place} · {dateLabel}
            </p>
          )}
          <p
            className={
              variant === 'list' ? 'sr-only' : 'text-[13px] opacity-75'
            }
          >
            {edition.photo.credit}
          </p>
        </div>
      </div>
      <figcaption className="sr-only">{edition.photo.alt}</figcaption>
    </figure>
  )
}
