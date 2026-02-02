'use client'

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

  const handleJump = (id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth'
    target.scrollIntoView({ behavior, block: 'start' })
    setIsOpen(false)
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
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleJump(section.id)}
                  className="w-full text-left"
                >
                  <div className="text-sm font-semibold">{section.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {section.description}
                  </div>
                </button>
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
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleJump(section.id)}
                  className={`block text-left text-sm transition-colors ${
                    activeId === section.id
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </aside>
    </>
  )
}
