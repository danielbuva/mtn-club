'use client'

import { ChevronDownIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const HEADER_OFFSET = 72

type TocSection = {
  id: string
  title: string
  description: string
  subsections?: Array<{ id: string; title: string }>
}

type TocProps = {
  sections: TocSection[]
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function TOC({ sections }: TocProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  const sectionIds = useMemo(
    () => sections.map(section => section.id),
    [sections],
  )

  useEffect(() => {
    const elements = sectionIds
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el))

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        rootMargin: `-${HEADER_OFFSET}px 0px -60% 0px`,
        threshold: [0.25, 0.5, 0.75],
      },
    )

    elements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [sectionIds])

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

  useEffect(() => {
    if (isOpen) return
    setExpandedIds([])
  }, [isOpen])

  const handleJump = (id: string, closeAfter = true) => {
    const target = document.getElementById(id)
    if (!target) return
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth'
    target.scrollIntoView({ behavior, block: 'start' })
    if (closeAfter) setIsOpen(false)
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id],
    )
  }

  return (
    <>
      {/* Mobile Chapters button */}
      <div className="md:hidden sticky top-16 z-40 flex justify-end px-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              className="rounded-full shadow-sm"
              aria-expanded={isOpen}
              aria-controls="chapters-drawer"
            >
              Chapters
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle id="chapters-drawer">Chapters</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {sections.map(section => (
                <div key={section.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleJump(section.id, false)
                        toggleExpanded(section.id)
                      }}
                      className="block flex-1 text-left"
                    >
                      <div className="text-sm font-semibold">
                        {section.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {section.description}
                      </div>
                    </button>
                    {section.subsections?.length ? (
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
                  {section.subsections?.length &&
                  expandedIds.includes(section.id) ? (
                    <div className="space-y-1 border-l border-border/60 pl-4">
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
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop TOC rail */}
      <aside className="hidden md:block">
        <div className="sticky top-24">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Chapters
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
                      className={`block flex-1 text-left text-sm transition-colors ${
                        activeId === section.id
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {section.title}
                    </button>
                    {section.subsections?.length ? (
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
        </div>
      </aside>
    </>
  )
}
