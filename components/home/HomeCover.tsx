'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { covers } from '@/components/home/covers'
import UNLVMountainClub from '@/components/unlv-mountain-club'
import useIsMd from '@/hooks/use-is-md'
import { cn } from '@/lib/utils'

/*
Tuning knobs:
- Frame color/opacity: adjust the border color alpha in the frame overlay below.
- Wordmark placement: update the left/top classes on the UNLVMountainClub wrapper.
- CTA scrim size/placement: update the right/bottom classes and the scrim gradient size.
- Per-cover focal points: edit covers[].pos/origin* and scale* for each image.
*/

const frameStyle = {
  top: 'calc(var(--frame-padding) + env(safe-area-inset-top))',
  right: 'calc(var(--frame-padding) + env(safe-area-inset-right))',
  bottom: 'calc(var(--frame-padding) + env(safe-area-inset-bottom))',
  left: 'calc(var(--frame-padding) + env(safe-area-inset-left))',
} as const

export function HomeCover() {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [coverIndex, setCoverIndex] = useState(0)
  const cover = covers[coverIndex] ?? covers[0]
  const isMd = useIsMd()
  const storageKey = 'unlv-mtnclub-cover-index'
  const navRef = useRef<HTMLElement | null>(null)

  // Cycling behavior: advance index on each mount and persist it in sessionStorage.
  // Reset by clearing sessionStorage key "unlv-mtnclub-cover-index".
  const advanceCover = useCallback(
    (currentIndex?: number) => {
      const baseIndex =
        typeof currentIndex === 'number'
          ? currentIndex
          : Number.isFinite(coverIndex)
            ? coverIndex
            : 0
      const nextIndex = (baseIndex + 1) % covers.length
      setCoverIndex(nextIndex)
      setImageLoaded(false)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(storageKey, String(nextIndex))
      }
    },
    [coverIndex],
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedValue = window.sessionStorage.getItem(storageKey)
      const parsedValue =
        storedValue !== null ? Number.parseInt(storedValue, 10) : Number.NaN
      const prevIndex =
        Number.isFinite(parsedValue) && parsedValue >= 0
          ? parsedValue % covers.length
          : -1
      const nextIndex = (prevIndex + 1) % covers.length
      setCoverIndex(nextIndex)
      window.sessionStorage.setItem(storageKey, String(nextIndex))
    }
    setIsMounted(true)
  }, [])

  return (
    <div className="relative min-h-svh bg-neutral-950 text-white overflow-hidden [--frame-padding:16px] md:[--frame-padding:24px]">
      <div className="absolute inset-0 bg-neutral-950" />
      {isMounted ? (
        <Image
          src={cover.src}
          alt="UNLV Mountain Club cover"
          fill
          priority
          sizes="100vw"
          onLoadingComplete={() => setImageLoaded(true)}
          className={cn(
            'pointer-events-none object-cover transition-opacity duration-500 z-0',
            imageLoaded ? 'opacity-100' : 'opacity-0',
          )}
          style={{
            objectPosition: isMd ? cover.posDesktop : cover.posMobile,
            transform: `scale(${isMd ? cover.scaleDesktop : cover.scaleMobile})`,
            transformOrigin: isMd ? cover.originDesktop : cover.originMobile,
          }}
        />
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/20 via-black/30 to-black/55" />

      <div className="pointer-events-none absolute z-20" style={frameStyle}>
        <div className="pointer-events-none absolute inset-0 border border-[#FEF1D0] opacity-60" />
        <div className="pointer-events-none absolute left-0 bottom-1 text-[10px] tracking-[0.2em] font-medium text-[#FEF1D0] opacity-40 [writing-mode:vertical-rl] rotate-180">
          Founded 2020
        </div>
      </div>

      <div
        className="absolute inset-0 z-20"
        onPointerUpCapture={event => {
          if (navRef.current?.contains(event.target as Node)) {
            return
          }
          advanceCover()
        }}
      />

      <div className="pointer-events-none absolute z-30" style={frameStyle}>
        <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-[56%] -translate-y-1/2 w-[min(86vw,320px)] sm:w-[min(86vw,360px)] md:w-[min(520px,40vw)] lg:top-6 lg:left-6 lg:translate-x-0 lg:translate-y-0 lg:w-[min(520px,40vw)]">
          <span className="sr-only">UNLV Mountain Club</span>
          <UNLVMountainClub />
        </div>

        <div className="pointer-events-auto absolute right-1 bottom-5 md:right-6 md:bottom-6 font-brand">
          <div className="relative text-right">
            <nav
              ref={navRef}
              aria-label="Primary"
              className="relative space-y-3 sm:space-y-3 py-1"
            >
              <Link
                href="/get-started"
                className="block text-lg sm:text-2xl md:text-3xl font-medium tracking-wide text-[#FFECA2] transition [text-shadow:0_1px_8px_rgba(0,0,0,0.35)] active:translate-x-0.5 active:opacity-75"
              >
                Starter Guide →
              </Link>
              <Link
                href="/photos"
                className="block text-lg sm:text-2xl md:text-3xl font-medium tracking-wide text-[#FFF4C9] transition [text-shadow:0_1px_8px_rgba(0,0,0,0.35)] active:translate-x-0.5 active:opacity-75"
              >
                Trips and Photos →
              </Link>
              <Link
                href="/activities"
                className="block text-lg sm:text-2xl md:text-3xl font-medium tracking-wide text-[#FFF4C9] transition [text-shadow:0_1px_8px_rgba(0,0,0,0.35)] active:translate-x-0.5 active:opacity-75"
              >
                Activities →
              </Link>
              <Link
                href="/join"
                className="block text-lg sm:text-2xl md:text-3xl font-medium tracking-wide text-[#FFF4C9] transition [text-shadow:0_1px_8px_rgba(0,0,0,0.35)] active:translate-x-0.5 active:opacity-75"
              >
                Join →
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
