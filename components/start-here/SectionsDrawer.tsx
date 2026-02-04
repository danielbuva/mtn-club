'use client'

import { ChevronRightIcon } from 'lucide-react'
import { animate, motion, useMotionValue } from 'motion/react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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
  const [present, setPresent] = useState(false)
  const [expandedIds, setExpandedIds] = useState<GuideSection['id'][]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const drawerWidthRef = useRef(320)
  const prevWidthRef = useRef(320)
  const openRef = useRef(open)
  const animIdRef = useRef(0)
  const animStopRef = useRef<null | (() => void)>(null)
  const pointerIdRef = useRef<number | null>(null)
  const dragStateRef = useRef<{
    active: boolean
    dragging: boolean
    startX: number
    startY: number
    startDrawerX: number
    lastX: number
    lastTime: number
  }>({
    active: false,
    dragging: false,
    startX: 0,
    startY: 0,
    startDrawerX: 0,
    lastX: 0,
    lastTime: 0,
  })
  const drawerX = useMotionValue(drawerWidthRef.current)

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

  useLayoutEffect(() => {
    const updateWidth = () => {
      const width = panelRef.current?.getBoundingClientRect().width ?? 320
      if (width !== prevWidthRef.current) {
        prevWidthRef.current = width
        drawerWidthRef.current = width
        if (!open && !isDragging && !isAnimating && !present) {
          drawerX.set(width)
        }
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [drawerX, isDragging, isAnimating, open, present])

  useEffect(() => {
    openRef.current = open
    if (!open) return
    closeButtonRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (isDragging) return
    const width = drawerWidthRef.current
    if (open) setPresent(true)
    if (!open && !present) return
    animStopRef.current?.()
    const myAnimId = ++animIdRef.current
    setIsAnimating(true)
    const target = open ? 0 : width
    const controls = animate(drawerX, target, {
      ...(open
        ? { type: 'spring', stiffness: 420, damping: 40 }
        : { duration: 0.18, ease: 'easeOut' }),
      onComplete: () => {
        if (myAnimId !== animIdRef.current) return
        setIsAnimating(false)
        if (!openRef.current) {
          requestAnimationFrame(() => setPresent(false))
        }
      },
    })
    animStopRef.current = () => controls.stop()
    return () => controls.stop()
  }, [drawerX, isDragging, open, present])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const isDesktop = () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 768px)').matches

    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max)

    const shouldIgnore = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false
      return Boolean(
        target.closest('[data-no-drawer-swipe], input, textarea, select'),
      )
    }

    const isInDrawerScroll = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false
      return Boolean(target.closest('[data-drawer-scroll]'))
    }

    const settle = (clientX: number) => {
      const width = drawerWidthRef.current
      const now = performance.now()
      const dx = clientX - dragStateRef.current.lastX
      const dt = Math.max(1, now - dragStateRef.current.lastTime)
      const velocity = dx / dt
      const x = drawerX.get()
      const openByVelocity = velocity < -0.35
      const closeByVelocity = velocity > 0.35
      const openByPosition = x < width * 0.5
      const nextOpen = openByVelocity
        ? true
        : closeByVelocity
          ? false
          : openByPosition
      setOpen(nextOpen)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (isDesktop()) return
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if (pointerIdRef.current != null) return
      if (shouldIgnore(event.target)) return

      pointerIdRef.current = event.pointerId
      dragStateRef.current.active = true
      dragStateRef.current.dragging = false
      dragStateRef.current.startX = event.clientX
      dragStateRef.current.startY = event.clientY
      dragStateRef.current.startDrawerX = drawerX.get()
      dragStateRef.current.lastX = event.clientX
      dragStateRef.current.lastTime = performance.now()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) return
      if (!dragStateRef.current.active) return

      const dx = event.clientX - dragStateRef.current.startX
      const dy = event.clientY - dragStateRef.current.startY

      if (!dragStateRef.current.dragging) {
        const inScroll = isInDrawerScroll(event.target)
        const horizontalEnough = inScroll
          ? Math.abs(dx) >= 18 && Math.abs(dx) >= Math.abs(dy) + 14
          : Math.abs(dx) >= 10 && Math.abs(dy) <= Math.abs(dx) + 6

        if (!horizontalEnough) return
        if (!openRef.current && dx > 0) return
        if (openRef.current && dx < 0) return

        dragStateRef.current.dragging = true
        setIsDragging(true)
        animStopRef.current?.()
        setPresent(true)
        if (!openRef.current) setOpen(true)
      }

      event.preventDefault()
      const width = drawerWidthRef.current
      const nextX = clamp(dragStateRef.current.startDrawerX + dx, 0, width)
      drawerX.set(nextX)
      dragStateRef.current.lastX = event.clientX
      dragStateRef.current.lastTime = performance.now()
    }

    const finish = (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) return
      if (!dragStateRef.current.active) return

      const wasDragging = dragStateRef.current.dragging
      dragStateRef.current.active = false
      dragStateRef.current.dragging = false
      pointerIdRef.current = null
      setIsDragging(false)

      if (!wasDragging) return
      settle(event.clientX)
    }

    const onPointerUp = (event: PointerEvent) => finish(event)
    const onPointerCancel = (event: PointerEvent) => finish(event)

    document.addEventListener('pointerdown', onPointerDown, {
      passive: true,
      capture: true,
    })
    document.addEventListener('pointermove', onPointerMove, {
      passive: false,
      capture: true,
    })
    document.addEventListener('pointerup', onPointerUp, {
      passive: true,
      capture: true,
    })
    document.addEventListener('pointercancel', onPointerCancel, {
      passive: true,
      capture: true,
    })

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('pointermove', onPointerMove, true)
      document.removeEventListener('pointerup', onPointerUp, true)
      document.removeEventListener('pointercancel', onPointerCancel, true)
    }
  }, [drawerX])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const width = drawerWidthRef.current
    if (!open && !isDragging && !isAnimating && !present) {
      drawerX.set(width)
    }
  }, [drawerX, open, isDragging, isAnimating, present])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const html = document.documentElement
    if (present || isDragging || isAnimating) {
      html.dataset.sectionsDrawerOpen = 'true'
    } else {
      delete html.dataset.sectionsDrawerOpen
    }
  }, [present, isDragging, isAnimating])

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

  const drawerVisible = present
  const drawerBlocking = open || isDragging || isAnimating

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3 text-xs text-muted-foreground backdrop-blur">
        <BackButton />
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full md:hidden"
          aria-expanded={open}
          aria-controls="sections-drawer"
          onClick={() => {
            setPresent(true)
            setOpen(true)
          }}
        >
          Sections
        </Button>
      </div>

      <div
        role="dialog"
        aria-modal={drawerVisible}
        aria-hidden={!drawerVisible}
        id="sections-drawer"
        className={`fixed inset-0 z-50 isolate ${drawerBlocking ? '' : 'pointer-events-none'}`}
      >
        <motion.button
          type="button"
          aria-label="Close sections drawer"
          className="absolute inset-0 bg-transparent"
          initial={false}
          animate={{ opacity: present ? 1 : 0 }}
          transition={{ duration: 0.12 }}
          onClick={() => setOpen(false)}
          style={{ pointerEvents: open ? 'auto' : 'none', touchAction: 'none' }}
        />
        <motion.div
          ref={panelRef}
          className="absolute right-0 top-0 h-dvh w-[min(320px,86vw)] border-l border-border/50 bg-background shadow-2xl transform-gpu"
          style={{
            x: drawerX,
            willChange: 'transform',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            touchAction: 'pan-y',
          }}
        >
          <div className="flex h-dvh flex-col px-5 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
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
            <nav
              data-drawer-scroll
              className="mt-4 flex-1 space-y-4 overflow-y-auto pb-6 pr-2 overscroll-contain"
            >
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
      </div>

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
