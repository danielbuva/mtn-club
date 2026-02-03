'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { covers } from '@/components/home/covers'
import useIsMd from '@/hooks/use-is-md'
import { cn } from '@/lib/utils'

type HomeCoverClientProps = { transitionDurationMs: number }

export function HomeCoverClient({
  transitionDurationMs,
}: HomeCoverClientProps) {
  const [coverIndex, setCoverIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const loadedIndexesRef = useRef<Set<number>>(new Set())
  const isMd = useIsMd()
  const cover = covers[coverIndex] ?? covers[0]

  useEffect(() => {
    if (typeof window === 'undefined') return
    covers.forEach(entry => {
      const url = entry?.src?.src
      if (!url) return
      const img = new window.Image()
      img.src = url
      void img.decode?.().catch(() => {})
    })
  }, [])

  const advanceCover = () => {
    if (covers.length === 0) return
    const nextIndex = (coverIndex + 1) % covers.length

    // If we've already loaded this cover before, don't fade to black.
    const alreadyLoaded = loadedIndexesRef.current.has(nextIndex)
    setImageLoaded(alreadyLoaded)

    setCoverIndex(nextIndex)
  }

  return (
    <>
      <Image
        key={cover.src.src}
        src={cover.src}
        alt="UNLV Mountain Club cover"
        fill
        priority
        sizes="100vw"
        placeholder="empty"
        onLoad={() => {
          loadedIndexesRef.current.add(coverIndex)
          setImageLoaded(true)
        }}
        className={cn(
          'pointer-events-none object-cover z-0 transition-opacity',
          imageLoaded ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          transitionDuration: `${transitionDurationMs}ms`,
          objectPosition: isMd ? cover.posDesktop : cover.posMobile,
          transform: `scale(${isMd ? cover.scaleDesktop : cover.scaleMobile})`,
          transformOrigin: isMd ? cover.originDesktop : cover.originMobile,
        }}
      />

      <div
        className="absolute inset-0 z-20"
        onPointerUpCapture={event => {
          const target = event.target as HTMLElement | null
          if (target?.closest?.('[data-homecover-nav]')) return
          advanceCover()
        }}
      />
    </>
  )
}
