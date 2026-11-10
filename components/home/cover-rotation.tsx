'use client'

import { type CSSProperties, useState } from 'react'
import { CoverBackground } from '@/components/home/cover-background'
import { coverFrameStyle } from '@/components/home/cover-frame'
import { CoverPager } from '@/components/home/cover-pager'
import { covers } from '@/components/home/covers'
import type { HomeCoverClientProps } from '@/components/home/HomeCoverClient'
import useIsMd from '@/hooks/use-is-md'
import { cn } from '@/lib/utils'

export function CoverRotation({
  transitionDurationMs,
  initialIndex = 0,
}: HomeCoverClientProps) {
  const transitionStyle: CSSProperties & { '--cover-duration': string } = {
    '--cover-duration': `${transitionDurationMs}ms`,
  }
  const [coverIndex, setCoverIndex] = useState(initialIndex)
  const index = ((coverIndex % covers.length) + covers.length) % covers.length
  const isMd = useIsMd()
  const changeCover = (direction: number) => {
    setCoverIndex(
      current => (current + direction + covers.length) % covers.length,
    )
  }

  return (
    <>
      {covers.map((edition, editionIndex) => (
        <div
          key={edition.src.src}
          aria-hidden={editionIndex !== index}
          className={cn(
            'pointer-events-none absolute inset-0 overflow-hidden motion-safe:transition-opacity motion-safe:duration-[var(--cover-duration)]',
            editionIndex === index ? 'opacity-100' : 'opacity-0',
          )}
          style={transitionStyle}
        >
          <CoverBackground
            cover={edition}
            priority={editionIndex === initialIndex}
            isMd={isMd}
          />
        </div>
      ))}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-20"
        onPointerUp={event => {
          if (!event.isPrimary || event.button !== 0) return
          const bounds = event.currentTarget.getBoundingClientRect()
          changeCover(event.clientX - bounds.left < bounds.width / 2 ? -1 : 1)
        }}
      />
      <div
        className="pointer-events-none absolute z-30"
        style={coverFrameStyle}
      >
        <CoverPager
          index={index}
          count={covers.length}
          previous={() => changeCover(-1)}
          next={() => changeCover(1)}
        />
      </div>
    </>
  )
}
