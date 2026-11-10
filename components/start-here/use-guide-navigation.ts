'use client'

import type { RefObject } from 'react'
import { useEffect, useState } from 'react'
import type { GuideSection } from '@/app/(reader)/guides/types'

const HEADER_OFFSET = 72
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const useInitialHashScroll = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.location.hash) return

    const id = window.location.hash.replace('#', '')
    const target = document.getElementById(id)
    if (!target) return

    const behavior = prefersReducedMotion() ? 'auto' : 'smooth'
    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior, block: 'start' })
    }, 50)
    return () => window.clearTimeout(timer)
  }, [])
}

export const useScrollSpy = (ids: GuideSection['id'][]) => {
  const [activeId, setActiveId] = useState<GuideSection['id']>(ids[0] ?? '')

  useEffect(() => {
    if (!ids.length || typeof window === 'undefined') return
    setActiveId(current => (ids.includes(current) ? current : (ids[0] ?? '')))
  }, [ids])

  useEffect(() => {
    if (typeof window === 'undefined' || ids.length === 0) return

    let rafId: number | null = null

    const updateActive = () => {
      rafId = null
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight
      ) {
        const lastId = ids[ids.length - 1]
        if (lastId) {
          setActiveId(current => (current === lastId ? current : lastId))
        }
        return
      }

      let bestId: GuideSection['id'] | null = null
      let bestDist = Number.POSITIVE_INFINITY

      for (const id of ids) {
        const element = document.getElementById(id)
        if (!element) continue
        const rect = element.getBoundingClientRect()
        const dist = Math.abs(rect.top - HEADER_OFFSET)
        if (dist < bestDist) {
          bestDist = dist
          bestId = id
        }
      }

      if (bestId) {
        setActiveId(current => (current === bestId ? current : bestId))
      }
    }

    const onScroll = () => {
      if (rafId != null) return
      rafId = window.requestAnimationFrame(updateActive)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (rafId != null) window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids])

  return activeId
}

export const useDrawerFocusTrap = (
  open: boolean,
  panelRef: RefObject<HTMLDivElement | null>,
  closeButtonRef: RefObject<HTMLButtonElement | null>,
  openerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) => {
  useEffect(() => {
    if (!open) return
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeButtonRef, onClose, open, panelRef])

  useEffect(() => {
    if (open) return
    openerRef.current?.focus()
  }, [open, openerRef])
}
