import Image from 'next/image'
import { useId } from 'react'
import type { SpecialEdition } from '@/lib/editorial/editions'
import { cn } from '@/lib/utils'

/** One photo treatment shared by posters, schedule cells, and thumbnails. */
export function EditionPhoto({
  edition,
  canceled = false,
  className,
}: {
  edition: SpecialEdition
  canceled?: boolean
  className?: string
}) {
  const filterId = `edition-photo-${useId().replace(/:/g, '')}`
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden',
        canceled
          ? 'bg-[#F8F1DF]'
          : edition.tone === 'highlight'
            ? 'bg-[#FFECA2]'
            : 'bg-[#211D18]',
        className,
      )}
    >
      <svg aria-hidden="true" className="absolute size-0">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"
            />
            <feComponentTransfer>
              <feFuncR
                type="gamma"
                amplitude="0.8"
                exponent="0.7"
                offset="0.12"
              />
              <feFuncG
                type="gamma"
                amplitude="0.8"
                exponent="0.7"
                offset="0.12"
              />
              <feFuncB
                type="gamma"
                amplitude="0.8"
                exponent="0.7"
                offset="0.12"
              />
            </feComponentTransfer>
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.1294 1" />
              <feFuncG type="table" tableValues="0.1137 0.9255" />
              <feFuncB type="table" tableValues="0.0941 0.6353" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <Image
        src={edition.photo.src}
        alt={edition.photo.alt}
        fill
        sizes="(min-width: 1280px) 1152px, 100vw"
        className="object-cover"
        style={{
          objectPosition: edition.photo.position,
          filter: canceled ? 'grayscale(1)' : `url(#${filterId})`,
        }}
      />
    </div>
  )
}
