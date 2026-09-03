'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { CLUB_DISCLAIMER } from '@/lib/club-content'

export function WelcomeDisclaimer() {
  const [open, setOpen] = useState(false)
  const copyRef = useRef<HTMLDivElement>(null)
  const closedScrollPositionRef = useRef(0)
  const closeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return

    const frame = window.requestAnimationFrame(() => {
      copyRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'end',
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    },
    [],
  )

  function toggleDisclaimer() {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (!open) {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
      closedScrollPositionRef.current = window.scrollY
      setOpen(true)
      return
    }

    window.scrollTo({
      top: closedScrollPositionRef.current,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })

    if (reduceMotion) {
      setOpen(false)
      return
    }

    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false)
      closeTimerRef.current = null
    }, 400)
  }

  return (
    <div
      id="disclaimer"
      className="group relative left-1/2 z-0 mt-6 w-dvw -translate-x-1/2 translate-y-2.5 border-t border-[#211D18]/20 py-2 text-[#211D18]/60 [@media(max-height:720px)]:mt-4 [@media(max-height:720px)]:py-1"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="welcome-disclaimer-copy"
        onClick={toggleDisclaimer}
        className="flex min-h-9 w-full items-center text-[10px] font-semibold uppercase tracking-[0.12em] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#211D18] [@media(max-height:720px)]:min-h-8"
      >
        <span className="mx-auto flex w-full max-w-6xl items-center gap-1.5 px-5 sm:px-8">
          <ChevronRight
            className={`size-3.5 text-[#6A5146] transition-transform ${open ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
          <span>Student-run and independent</span>
        </span>
      </button>
      <div className="mx-auto max-w-6xl px-5 pb-2 sm:px-8">
        <Link
          href="/privacy"
          className="text-xs underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-current"
        >
          Privacy policy
        </Link>
      </div>
      {open ? (
        <div
          id="welcome-disclaimer-copy"
          ref={copyRef}
          className="absolute inset-x-0 top-full z-10 bg-[#F8F1DF] pb-[calc(10.5rem+env(safe-area-inset-bottom))]"
        >
          <p className="mx-auto w-full max-w-6xl px-5 pt-2 text-xs leading-5 sm:px-8">
            {CLUB_DISCLAIMER}
          </p>
        </div>
      ) : null}
    </div>
  )
}
