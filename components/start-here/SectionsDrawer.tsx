'use client'

import { List } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { GuideSection } from '@/app/(reader)/guides/types'
import { BackButton } from '@/components/back-button'
import { GuideContents } from '@/components/guides/GuideContents'

import {
  prefersReducedMotion,
  useDrawerFocusTrap,
  useInitialHashScroll,
  useScrollSpy,
} from './use-guide-navigation'

type SectionsDrawerProps = { sections: GuideSection[] }

export function SectionsDrawer({ sections }: SectionsDrawerProps) {
  const [open, setOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<GuideSection['id'][]>([])
  const highlightTimerRef = useRef<number | null>(null)
  const highlightRafRef = useRef<number | null>(null)
  const lastClickRef = useRef<GuideSection['id'] | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const tocSections = sections.filter(section => {
    const label = (section.tocLabel ?? section.title).trim()
    return !section.hideInToc && label.length > 0
  })
  const ids = tocSections.map(section => section.id)
  const activeId = useScrollSpy(ids)
  const handleClose = useCallback(() => setOpen(false), [])
  useDrawerFocusTrap(open, panelRef, closeButtonRef, openerRef, handleClose)
  useInitialHashScroll()

  const handleJump = (id: string, closeAfter = true) => {
    const target = document.getElementById(id)
    if (!target) return
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth'
    target.scrollIntoView({ behavior, block: 'start' })
    if (closeAfter) setOpen(false)
  }

  const toggleExpanded = (id: GuideSection['id']) => {
    setExpandedIds(current =>
      current.includes(id)
        ? current.filter(sectionId => sectionId !== id)
        : [...current, id],
    )
  }

  const triggerHighlight = useCallback((id: GuideSection['id']) => {
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current)
    }
    if (highlightRafRef.current) {
      window.cancelAnimationFrame(highlightRafRef.current)
    }
    highlightRafRef.current = window.requestAnimationFrame(() => {
      const safeId =
        typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id
      const target = document.querySelector<HTMLElement>(
        `[data-guide-highlight="${safeId}"]`,
      )
      if (!target) return
      target.classList.remove('guide-highlight')
      target.getBoundingClientRect()
      target.classList.add('guide-highlight')
      highlightTimerRef.current = window.setTimeout(() => {
        target.classList.remove('guide-highlight')
      }, 700)
    })
  }, [])

  const handleSectionClick = (section: GuideSection) => {
    if (lastClickRef.current === section.id) {
      triggerHighlight(section.id)
    }
    lastClickRef.current = section.id
    if (section.subsections?.length) {
      const isExpanded = expandedIds.includes(section.id)
      handleJump(section.id, false)
      if (!isExpanded) {
        toggleExpanded(section.id)
        return
      }
      if (activeId === section.id) {
        toggleExpanded(section.id)
      }
      return
    }
    handleJump(section.id, false)
  }

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current)
      }
      if (highlightRafRef.current) {
        window.cancelAnimationFrame(highlightRafRef.current)
      }
    }
  }, [])

  // The drawer is hidden from md up; close it there so the scroll lock and
  // focus trap don't outlive it after a rotation or resize.
  useEffect(() => {
    if (!open) return
    const desktop = window.matchMedia('(min-width: 768px)')
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false)
    }
    closeOnDesktop()
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [open])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const contents = (closeOnSelect = false) => (
    <GuideContents
      sections={tocSections}
      activeId={activeId}
      expandedIds={expandedIds}
      onSectionClick={
        closeOnSelect ? section => handleJump(section.id) : handleSectionClick
      }
      onToggle={toggleExpanded}
      onJump={id => handleJump(id)}
    />
  )

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-between border-t border-border bg-background px-4 pb-[env(safe-area-inset-bottom)] md:hidden">
        <BackButton className="min-h-11 rounded-none px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2" />
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 px-3 font-brand text-[13px] font-bold uppercase tracking-[0.14em] focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-expanded={open}
          aria-controls="sections-drawer"
          onClick={event => {
            openerRef.current = event.currentTarget
            setOpen(true)
          }}
        >
          <List aria-hidden="true" className="size-4" />
          Contents
        </button>
      </div>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sections-drawer-title"
          id="sections-drawer"
          className="fixed inset-0 z-50 bg-background/80 md:hidden"
        >
          <button
            type="button"
            aria-label="Close contents"
            className="absolute inset-0"
            onClick={handleClose}
          />
          <div
            ref={panelRef}
            className="absolute inset-y-0 right-0 flex w-[min(340px,90vw)] flex-col border-l border-border bg-background px-5 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border py-3">
              <h2
                id="sections-drawer-title"
                className="font-brand text-xl font-bold uppercase"
              >
                Contents
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                className="min-h-11 min-w-11 px-2 font-brand text-[13px] uppercase tracking-wide focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4">
              {contents(true)}
            </div>
          </div>
        </div>
      ) : null}
      <aside
        className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] overflow-y-auto border border-border bg-background p-4 md:block"
        aria-label="Field guide index"
      >
        <p className="mb-4 font-brand text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Contents
        </p>
        {contents()}
      </aside>
    </>
  )
}
