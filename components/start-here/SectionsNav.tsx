'use client'

import { ChevronDownIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Section } from '@/app/(reader)/start-here/sections'
import { Button } from '@/components/ui/button'

const HEADER_OFFSET = 72

type SectionsNavProps = {
  sections: Section[]
  variant: 'mobile' | 'desktop'
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function SectionsNav({ sections, variant }: SectionsNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')
  const [open, setOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Section['id'][]>([])
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const activeIndex = Math.max(
    0,
    sections.findIndex(section => section.id === activeId),
  )

  const ids = useMemo(() => sections.map(section => section.id), [sections])

  useEffect(() => {
    const elements = ids
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el))

    if (!elements.length) return

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target) {
          setActiveId(visible[0].target.id as Section['id'])
        }
      },
      {
        rootMargin: `-${HEADER_OFFSET}px 0px -55% 0px`,
        threshold: [0.35, 0.6, 0.9],
      },
    )

    elements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [ids])

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

  const toggleExpanded = (id: Section['id']) => {
    setExpandedIds(current =>
      current.includes(id)
        ? current.filter(sectionId => sectionId !== id)
        : [...current, id],
    )
  }

  if (variant === 'mobile') {
    return (
      <>
        <div className="fixed left-0 right-0 top-16 z-40 flex justify-end px-4 py-2">
          <Button
            variant="secondary"
            className="rounded-full shadow-sm"
            aria-expanded={open}
            aria-controls="sections-drawer"
            onClick={() => setOpen(true)}
          >
            Sections
          </Button>
        </div>

        {open ? (
          <div
            role="dialog"
            aria-modal="true"
            id="sections-drawer"
            className="fixed inset-0 z-50"
          >
            <button
              type="button"
              aria-label="Close sections drawer"
              className="absolute inset-0 bg-black/20"
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              className="fixed right-0 top-0 h-dvh w-[min(320px,86vw)] border-l border-border/50 bg-background shadow-2xl transition-transform"
            >
              <div className="relative flex h-dvh flex-col px-5 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
                <div className="flex items-center justify-between py-4">
                  <div>
                    <h2 className="text-lg font-semibold">Sections</h2>
                    <p className="text-xs text-muted-foreground">
                      Jump to a section
                    </p>
                  </div>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className="text-sm text-muted-foreground"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <nav className="mt-4 flex-1 space-y-4 overflow-y-auto pb-6 pr-2 overscroll-contain">
                  {sections.map(section => (
                    <div key={section.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          className={`block flex-1 text-left text-sm transition-colors ${
                            activeId === section.id
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}
                          onClick={() => {
                            handleJump(section.id, false)
                            toggleExpanded(section.id)
                          }}
                        >
                          <div className="font-semibold">
                            {section.tocLabel}
                          </div>
                          {section.tocDescription ? (
                            <div className="text-xs text-muted-foreground">
                              {section.tocDescription}
                            </div>
                          ) : null}
                        </button>
                        {section.subsections.length ? (
                          <button
                            type="button"
                            className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground"
                            aria-expanded={expandedIds.includes(section.id)}
                            onClick={() => toggleExpanded(section.id)}
                          >
                            <ChevronDownIcon
                              className={`h-3 w-3 transition-transform ${
                                expandedIds.includes(section.id)
                                  ? 'rotate-180'
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
                      {section.subsections.length &&
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
            </div>
          </div>
        ) : null}

        <div className="pointer-events-none fixed bottom-4 left-1/2 z-40 -translate-x-1/2 text-xs text-muted-foreground">
          {activeIndex + 1} / {sections.length}
        </div>
      </>
    )
  }

  return (
    <aside>
      <div className="sticky top-24">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4 backdrop-blur">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Sections
          </p>
          <nav className="mt-4 space-y-3">
            {sections.map(section => (
              <div key={section.id} className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleJump(section.id, false)
                      toggleExpanded(section.id)
                    }}
                    className={`block text-left text-sm transition-colors ${
                      activeId === section.id
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {section.tocLabel}
                  </button>
                  {section.subsections.length ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground"
                      aria-expanded={expandedIds.includes(section.id)}
                      onClick={() => toggleExpanded(section.id)}
                    >
                      <ChevronDownIcon
                        className={`h-3 w-3 transition-transform ${
                          expandedIds.includes(section.id) ? 'rotate-180' : ''
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
                {section.subsections.length &&
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
      </div>
    </aside>
  )
}
