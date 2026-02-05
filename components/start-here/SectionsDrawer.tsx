'use client'

import { ChevronRightIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { RefObject } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GuideSection } from '@/app/(reader)/guides/types'
import { BackButton } from '@/components/back-button'
import { Button } from '@/components/ui/button'

const HEADER_OFFSET = 72

type SectionsDrawerProps = {
  sections: GuideSection[]
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const useTocSections = (sections: GuideSection[]) =>
  useMemo(() => sections.filter(section => !section.hideInToc), [sections])

const useInitialHashScroll = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.location.hash) return

    const id = window.location.hash.replace('#', '')
    const target = document.getElementById(id)
    if (!target) return

    const behavior = prefersReducedMotion() ? 'auto' : 'smooth'
    window.setTimeout(() => {
      target.scrollIntoView({ behavior, block: 'start' })
    }, 50)
  }, [])
}

const useScrollSpy = (ids: GuideSection['id'][]) => {
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

      let bestId: GuideSection['id'] | null = null
      let bestDist = Number.POSITIVE_INFINITY

      for (const id of ids) {
        const element = document.getElementById(id)
        if (!element) continue
        const rect = element.getBoundingClientRect()
        const dist = Math.abs(rect.top - HEADER_OFFSET)
        if (dist < bestDist) {
          bestDist = dist
          bestId = id as GuideSection['id']
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

const useDrawerFocusTrap = (
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

export function SectionsDrawer({ sections }: SectionsDrawerProps) {
  const [open, setOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<GuideSection['id'][]>([])
  const [hideFab, setHideFab] = useState(false)
  const highlightTimerRef = useRef<number | null>(null)
  const highlightRafRef = useRef<number | null>(null)
  const lastClickRef = useRef<GuideSection['id'] | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const scrollHideTimerRef = useRef<number | null>(null)

  const tocSections = useTocSections(sections)
  const ids = useMemo(
    () => tocSections.map(section => section.id),
    [tocSections],
  )
  const activeId = useScrollSpy(ids)
  const handleClose = useCallback(() => setOpen(false), [])
  useDrawerFocusTrap(open, panelRef, closeButtonRef, openerRef, handleClose)
  useInitialHashScroll()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onScroll = () => {
      setHideFab(true)
      if (scrollHideTimerRef.current) {
        window.clearTimeout(scrollHideTimerRef.current)
      }
      scrollHideTimerRef.current = window.setTimeout(() => {
        setHideFab(false)
      }, 180)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollHideTimerRef.current) {
        window.clearTimeout(scrollHideTimerRef.current)
      }
    }
  }, [])

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
      void target.offsetWidth
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

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3 text-xs text-muted-foreground backdrop-blur">
        <BackButton />
        <div aria-hidden="true" />
      </div>

      <AnimatePresence>
        {!hideFab ? (
          <motion.div
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 md:hidden"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full"
              aria-expanded={open}
              aria-controls="sections-drawer"
              onClick={event => {
                openerRef.current = event.currentTarget
                setOpen(true)
              }}
            >
              Sections
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sections-drawer-title"
            id="sections-drawer"
            className="fixed inset-0 z-50"
          >
            <motion.button
              type="button"
              aria-label="Close sections drawer"
              className="absolute inset-0 border-0 bg-transparent p-0"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            />
            <motion.div
              ref={panelRef}
              className="absolute right-0 top-0 h-dvh w-[min(300px,77vw)] border-l border-border/50 bg-background shadow-2xl"
              initial={{ x: '100%' }}
              animate={{
                x: 0,
                transition: { type: 'spring', stiffness: 420, damping: 40 },
              }}
              exit={{
                x: '100%',
                transition: { duration: 0.18, ease: 'easeOut' },
              }}
            >
              <div className="flex h-dvh flex-col px-5 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
                <div className="flex items-center justify-between py-4">
                  <div>
                    <h2
                      id="sections-drawer-title"
                      className="text-lg font-semibold"
                    >
                      Sections
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Jump to a section
                    </p>
                  </div>
                </div>
                <div className="h-36" aria-hidden="true" />
                <nav className="max-h-[70vh] space-y-4 overflow-y-auto pb-42 pr-2 overscroll-contain">
                  {tocSections.map(section => (
                    <div key={section.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          className={`block flex-1 rounded-md text-left text-sm transition-colors ${
                            activeId === section.id
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}
                          onClick={() => handleSectionClick(section)}
                        >
                          <div className="font-semibold">
                            {section.tocLabel ?? section.title}
                          </div>
                          {section.tocDescription ? (
                            <div className="text-xs text-muted-foreground">
                              {section.tocDescription}
                            </div>
                          ) : null}
                        </button>
                        {section.subsections?.length ? (
                          <button
                            type="button"
                            className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground"
                            aria-expanded={expandedIds.includes(section.id)}
                            onClick={() => toggleExpanded(section.id)}
                          >
                            <ChevronRightIcon
                              className={`h-3 w-3 transition-transform ${
                                expandedIds.includes(section.id)
                                  ? 'rotate-90'
                                  : ''
                              }`}
                            />
                            <span className="sr-only">
                              {expandedIds.includes(section.id)
                                ? 'Collapse'
                                : 'Expand'}
                            </span>
                          </button>
                        ) : null}
                      </div>
                      {section.subsections?.length &&
                      expandedIds.includes(section.id) ? (
                        <div className="space-y-1 border-l border-border/60 pl-4">
                          {section.subsections.map(subsection => (
                            <button
                              key={subsection.id}
                              type="button"
                              className="block text-left text-xs text-muted-foreground"
                              onClick={() => {
                                triggerHighlight(subsection.id)
                                lastClickRef.current = subsection.id
                                handleJump(section.id, false)
                              }}
                            >
                              {subsection.title}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </nav>
              </div>
            </motion.div>
            <motion.div
              className="fixed inset-x-0 bottom-4 z-50 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <button
                ref={closeButtonRef}
                type="button"
                className="px-10 py-4 text-sm text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <aside className="hidden md:block md:sticky md:top-20 md:self-start">
        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border/50 bg-background/70 p-4 text-sm text-muted-foreground backdrop-blur">
          <p className="text-xs uppercase tracking-widest">Sections</p>
          <nav className="mt-4 space-y-3">
            {tocSections.map(section => (
              <div key={section.id} className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleSectionClick(section)}
                    className={`block rounded-md text-left transition-colors ${
                      activeId === section.id
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {section.tocLabel ?? section.title}
                  </button>
                  {section.subsections?.length ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground"
                      aria-expanded={expandedIds.includes(section.id)}
                      onClick={() => toggleExpanded(section.id)}
                    >
                      <ChevronRightIcon
                        className={`h-3 w-3 transition-transform ${
                          expandedIds.includes(section.id) ? 'rotate-90' : ''
                        }`}
                      />
                      <span className="sr-only">
                        {expandedIds.includes(section.id)
                          ? 'Collapse'
                          : 'Expand'}
                      </span>
                    </button>
                  ) : null}
                </div>
                {section.subsections?.length &&
                expandedIds.includes(section.id) ? (
                  <div className="space-y-1 border-l border-border/60 pl-3">
                    {section.subsections.map(subsection => (
                      <button
                        key={subsection.id}
                        type="button"
                        onClick={() => {
                          triggerHighlight(subsection.id)
                          lastClickRef.current = subsection.id
                          handleJump(section.id, false)
                        }}
                        className="block text-left text-xs text-muted-foreground"
                      >
                        {subsection.title}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
