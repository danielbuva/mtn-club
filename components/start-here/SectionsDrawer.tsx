'use client'

import { ChevronRightIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
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

export function SectionsDrawer({ sections }: SectionsDrawerProps) {
  const firstTocId = sections.find(section => !section.hideInToc)?.id ?? ''
  const [activeId, setActiveId] = useState<GuideSection['id']>(firstTocId)
  const [open, setOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<GuideSection['id'][]>([])
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const tocSections = useMemo(
    () => sections.filter(section => !section.hideInToc),
    [sections],
  )
  const ids = useMemo(
    () => tocSections.map(section => section.id),
    [tocSections],
  )
  const isSectionId = useCallback(
    (id: string): id is GuideSection['id'] =>
      ids.includes(id as GuideSection['id']),
    [ids],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateActive = () => {
      const lastSectionId = tocSections[tocSections.length - 1]?.id
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2
      if (nearBottom && lastSectionId) {
        if (isSectionId(lastSectionId)) setActiveId(lastSectionId)
        return
      }

      const candidates = ids
        .map(id => {
          const element = document.getElementById(id)
          if (!element) return null
          const rect = element.getBoundingClientRect()
          if (rect.bottom <= HEADER_OFFSET) return null
          return { id, distance: Math.abs(rect.top - HEADER_OFFSET) }
        })
        .filter(
          (value): value is { id: GuideSection['id']; distance: number } =>
            Boolean(value),
        )

      if (!candidates.length) return
      candidates.sort((a, b) => a.distance - b.distance)
      const nextId = candidates[0]?.id
      if (nextId && isSectionId(nextId)) setActiveId(nextId)
    }

    const handleScroll = () => {
      updateActive()
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('touchmove', handleScroll, { passive: true })
    window.addEventListener('touchend', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('touchmove', handleScroll)
      window.removeEventListener('touchend', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [
    ids,
    isSectionId,
    tocSections.length,
    tocSections[tocSections.length - 1]?.id,
  ])

  useEffect(() => {
    if (!open) return
    closeButtonRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (open) return
    setExpandedIds([])
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
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
  }, [open])

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

  const handleSectionClick = (section: GuideSection) => {
    if (section.subsections?.length) {
      const isExpanded = expandedIds.includes(section.id)
      if (!isExpanded) {
        handleJump(section.id, false)
      }
      toggleExpanded(section.id)
      return
    }
    handleJump(section.id, false)
  }

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3 text-xs text-muted-foreground backdrop-blur">
        <BackButton />
        <div aria-hidden="true" />
      </div>

      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 md:hidden">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full"
          aria-expanded={open}
          aria-controls="sections-drawer"
          onClick={() => setOpen(true)}
        >
          Sections
        </Button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            id="sections-drawer"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <button
              type="button"
              aria-label="Close sections drawer"
              className="absolute inset-0 border-0 bg-transparent p-0"
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={panelRef}
              className="absolute right-0 top-0 h-dvh w-[min(320px,86vw)] border-l border-border/50 bg-background shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            >
              <div className="flex h-dvh flex-col px-5 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
                <div className="flex items-center justify-between py-4">
                  <div>
                    <h2 className="text-lg font-semibold">Sections</h2>
                    <p className="text-xs text-muted-foreground">
                      Jump to a section
                    </p>
                  </div>
                </div>
                <nav className="mt-2 flex-1 space-y-4 overflow-y-auto pb-6 pr-2 overscroll-contain">
                  {tocSections.map(section => (
                    <div key={section.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          className={`block flex-1 text-left text-sm transition-colors ${
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
                              onClick={() => handleJump(subsection.id)}
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
            <button
              ref={closeButtonRef}
              type="button"
              className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 text-sm text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </motion.div>
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
                    className={`block text-left transition-colors ${
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
                        onClick={() => handleJump(subsection.id)}
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
