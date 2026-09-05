'use client'

import { format, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { getTripCategories } from '@/components/calendar/calendar-categories'
import { CalendarCategoryPill } from '@/components/calendar/calendar-category-pill'
import {
  CALENDAR_MAX_YEAR,
  CALENDAR_MIN_MONTH_INDEX,
  CALENDAR_MIN_YEAR,
  formatMonthParam,
} from '@/components/calendar/calendar-utils'
import { TripTitleText } from '@/components/trips/trip-title-text'
import { Button } from '@/components/ui/button'
import type { ViewerKey } from '@/lib/events/calendar'
import { CLUB_TIME_ZONE, formatDateOnly } from '@/lib/events/formatters'
import type { CalendarTrip, TripTeaserDay } from '@/lib/events/types'
import { cn } from '@/lib/utils'

interface CalendarMonthViewProps {
  currentDate: Date
  tripsInYearCount: number
  tripsYear: number
  tripsByDay: Map<string, CalendarTrip[]>
  teasersByDay: Map<string, TripTeaserDay>
  viewerKey: ViewerKey
  showTitles: boolean
  isMobile: boolean
  loadedYears: number[]
  scrollContainerRef: RefObject<HTMLDivElement | null>
  scrollTarget: {
    kind: 'month' | 'week'
    key: string
    behavior: 'auto' | 'smooth'
  } | null
  restoreScrollTop: number
  scrollAdjustToken: number
  onRequestYear: (year: number, direction: 'prepend' | 'append') => void
  onScrollTargetHandled: () => void
  onVisibleMonthChange: (monthKey: string) => void
  onDaySelect: (date: Date) => void
  onTeaserClick: (day: string, teaser: TripTeaserDay) => void
  onToday: () => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

type WeekRow = {
  weekKey: string
  monthKey: string
  monthName: string
  isLastWeekOfMonth: boolean
  days: ({ date: Date; dateKey: string } | null)[]
  monthLabel?: { monthKey: string; label: string }
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SCROLL_END_DEBOUNCE_MS = 160
const SNAP_VELOCITY_THRESHOLD = 0.6

const getHeaderMonthForWeek = (week: WeekRow) => {
  return {
    monthKey: week.monthKey,
    label: week.monthName,
  }
}

const buildWeekRows = (minYear: number, maxYear: number): WeekRow[] => {
  const rows: WeekRow[] = []

  for (let year = minYear; year <= maxYear; year += 1) {
    const firstMonthIndex =
      year === CALENDAR_MIN_YEAR ? CALENDAR_MIN_MONTH_INDEX : 0

    for (let monthIndex = firstMonthIndex; monthIndex <= 11; monthIndex += 1) {
      const monthStart = new Date(year, monthIndex, 1)
      const monthKey = format(monthStart, 'yyyy-MM')
      const monthName = format(monthStart, 'MMMM yyyy')
      const leadingBlankCount = monthStart.getDay()
      const dayCount = new Date(year, monthIndex + 1, 0).getDate()
      const slotCount = Math.ceil((leadingBlankCount + dayCount) / 7) * 7

      for (let offset = 0; offset < slotCount; offset += 7) {
        const days = Array.from({ length: 7 }, (_, columnIndex) => {
          const dayNumber = offset + columnIndex - leadingBlankCount + 1
          if (dayNumber < 1 || dayNumber > dayCount) return null
          const date = new Date(year, monthIndex, dayNumber)
          return { date, dateKey: format(date, 'yyyy-MM-dd') }
        })
        const firstDate = days.find(day => day !== null)?.date ?? monthStart
        const weekStartKey = format(
          startOfWeek(firstDate, { weekStartsOn: 0 }),
          'yyyy-MM-dd',
        )
        const weekKey = `${monthKey}:${weekStartKey}`
        const isFirstWeek = offset === 0

        rows.push({
          weekKey,
          monthKey,
          monthName,
          isLastWeekOfMonth: offset + 7 >= slotCount,
          days,
          monthLabel: isFirstWeek ? { monthKey, label: monthName } : undefined,
        })
      }
    }
  }

  return rows
}

export function CalendarMonthView({
  currentDate,
  tripsInYearCount,
  tripsYear,
  tripsByDay,
  teasersByDay,
  viewerKey,
  showTitles,
  isMobile,
  loadedYears,
  scrollContainerRef,
  scrollTarget,
  restoreScrollTop,
  scrollAdjustToken,
  onRequestYear,
  onScrollTargetHandled,
  onVisibleMonthChange,
  onDaySelect,
  onTeaserClick,
  onToday,
  onPrevMonth,
  onNextMonth,
}: CalendarMonthViewProps) {
  const weekRowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const monthBoundaryWeekRef = useRef<Record<string, string>>({})
  const headerBlockRef = useRef<HTMLDivElement | null>(null)
  const scrollEndTimeoutRef = useRef<number | null>(null)
  const programmaticTimeoutRef = useRef<number | null>(null)
  const lastScrollRef = useRef<{
    top: number
    time: number
    velocity: number
    direction: number
  }>({
    top: 0,
    time: 0,
    velocity: 0,
    direction: 1,
  })
  const suppressSnapRef = useRef(false)
  const isProgrammaticScrollRef = useRef(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const [headerMonth, setHeaderMonth] = useState(() => ({
    monthKey: format(currentDate, 'yyyy-MM'),
    label: format(currentDate, 'MMMM yyyy'),
  }))
  const yearBounds = useMemo(() => {
    if (loadedYears.length === 0) {
      const year = currentDate.getFullYear()
      return { minYear: year, maxYear: year }
    }
    return {
      minYear: loadedYears[0],
      maxYear: loadedYears[loadedYears.length - 1],
    }
  }, [currentDate, loadedYears])

  const weekRows = useMemo(
    () => buildWeekRows(yearBounds.minYear, yearBounds.maxYear),
    [yearBounds.maxYear, yearBounds.minYear],
  )

  useLayoutEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const prevTop = container.scrollTop
    suppressSnapRef.current = prevTop !== restoreScrollTop
    container.scrollTop = restoreScrollTop
  }, [restoreScrollTop, scrollContainerRef])

  useEffect(() => {
    if (scrollAdjustToken > 0) {
      suppressSnapRef.current = true
    }
  }, [scrollAdjustToken])

  const setProgrammaticScroll = useCallback((behavior: 'auto' | 'smooth') => {
    isProgrammaticScrollRef.current = true
    if (programmaticTimeoutRef.current) {
      window.clearTimeout(programmaticTimeoutRef.current)
    }
    const delay = behavior === 'smooth' ? 500 : SCROLL_END_DEBOUNCE_MS + 80
    programmaticTimeoutRef.current = window.setTimeout(() => {
      isProgrammaticScrollRef.current = false
    }, delay)
  }, [])

  const scrollToWeekStart = useCallback(
    (weekStartISO: string, behavior: 'auto' | 'smooth') => {
      const container = scrollContainerRef.current
      const row = weekRowRefs.current[weekStartISO]
      if (!container || !row) return false
      const containerRect = container.getBoundingClientRect()
      const rowRect = row.getBoundingClientRect()
      const headerOffset = headerBlockRef.current?.offsetHeight ?? 0
      const top =
        rowRect.top - containerRect.top + container.scrollTop - headerOffset
      const nextTop = Math.max(0, top)
      suppressSnapRef.current = Math.abs(container.scrollTop - nextTop) > 1
      setProgrammaticScroll(behavior)
      container.scrollTo({ top: nextTop, behavior })
      return true
    },
    [scrollContainerRef, setProgrammaticScroll],
  )

  const findMonthBoundaryWeek = useCallback((monthKey: string) => {
    return monthBoundaryWeekRef.current[monthKey] ?? null
  }, [])

  useLayoutEffect(() => {
    if (!scrollTarget) return
    const { kind, key, behavior } = scrollTarget
    const handled =
      kind === 'week'
        ? scrollToWeekStart(key, behavior)
        : (() => {
            const boundaryWeek = findMonthBoundaryWeek(key)
            if (!boundaryWeek) return false
            return scrollToWeekStart(boundaryWeek, behavior)
          })()
    if (handled) {
      onScrollTargetHandled()
    }
  }, [
    findMonthBoundaryWeek,
    onScrollTargetHandled,
    scrollTarget,
    scrollToWeekStart,
  ])

  const updateHeaderMonth = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const headerOffset = headerBlockRef.current?.offsetHeight ?? 0
    const gridTop = container.scrollTop + headerOffset + 1
    let activeWeek: WeekRow | null = null

    for (const week of weekRows) {
      const row = weekRowRefs.current[week.weekKey]
      if (!row) continue
      const rowTop =
        row.getBoundingClientRect().top -
        containerRect.top +
        container.scrollTop
      if (rowTop <= gridTop) {
        activeWeek = week
      } else {
        break
      }
    }

    if (!activeWeek) return
    const nextHeader = getHeaderMonthForWeek(activeWeek)
    if (nextHeader.monthKey !== headerMonth.monthKey) {
      setHeaderMonth(nextHeader)
      onVisibleMonthChange(nextHeader.monthKey)
    }
  }, [headerMonth.monthKey, onVisibleMonthChange, scrollContainerRef, weekRows])

  const snapToTarget = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const { velocity, direction } = lastScrollRef.current
    const containerRect = container.getBoundingClientRect()
    const headerOffset = headerBlockRef.current?.offsetHeight ?? 0
    const gridTop = container.scrollTop + headerOffset + 1

    const rows = weekRows
      .map(week => {
        const row = weekRowRefs.current[week.weekKey]
        if (!row) return null
        const rowTop =
          row.getBoundingClientRect().top -
          containerRect.top +
          container.scrollTop
        return { week, rowTop, targetTop: rowTop - headerOffset }
      })
      .filter(
        (row): row is { week: WeekRow; rowTop: number; targetTop: number } =>
          row !== null,
      )

    if (rows.length === 0) return

    const isFast = Math.abs(velocity) > SNAP_VELOCITY_THRESHOLD
    const movingDown = direction >= 0

    const pickRow = (
      list: { week: WeekRow; rowTop: number; targetTop: number }[],
    ): { week: WeekRow; rowTop: number; targetTop: number } => {
      if (movingDown) {
        return list.find(row => row.rowTop >= gridTop) ?? list[list.length - 1]
      }
      for (let i = list.length - 1; i >= 0; i -= 1) {
        if (list[i].rowTop <= gridTop) return list[i]
      }
      return list[0]
    }

    const monthRows = rows.filter(row => row.week.monthLabel)
    const targetRow =
      isFast && monthRows.length > 0 ? pickRow(monthRows) : pickRow(rows)

    const maxScrollTop = container.scrollHeight - container.clientHeight
    const nextTop = Math.min(Math.max(targetRow.targetTop, 0), maxScrollTop)
    suppressSnapRef.current = true
    container.scrollTo({ top: nextTop, behavior: 'smooth' })
  }, [scrollContainerRef, weekRows])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const now = performance.now()
      const top = container.scrollTop
      const last = lastScrollRef.current
      const delta = top - last.top
      const dt = now - last.time
      const direction = delta === 0 ? last.direction : delta > 0 ? 1 : -1
      const velocity = dt > 0 ? delta / dt : last.velocity

      lastScrollRef.current = { top, time: now, velocity, direction }

      setIsScrolling(true)
      updateHeaderMonth()

      if (isProgrammaticScrollRef.current) {
        if (scrollEndTimeoutRef.current) {
          window.clearTimeout(scrollEndTimeoutRef.current)
        }
        scrollEndTimeoutRef.current = window.setTimeout(() => {
          setIsScrolling(false)
        }, SCROLL_END_DEBOUNCE_MS)
        return
      }

      const threshold = 240
      if (
        container.scrollTop < threshold &&
        yearBounds.minYear > CALENDAR_MIN_YEAR
      ) {
        onRequestYear(yearBounds.minYear - 1, 'prepend')
      }
      if (
        container.scrollHeight - container.scrollTop - container.clientHeight <
          threshold &&
        yearBounds.maxYear < CALENDAR_MAX_YEAR
      ) {
        onRequestYear(yearBounds.maxYear + 1, 'append')
      }

      if (scrollEndTimeoutRef.current) {
        window.clearTimeout(scrollEndTimeoutRef.current)
      }
      scrollEndTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false)
        if (isProgrammaticScrollRef.current) {
          return
        }
        if (suppressSnapRef.current) {
          suppressSnapRef.current = false
          return
        }
        snapToTarget()
      }, SCROLL_END_DEBOUNCE_MS)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollEndTimeoutRef.current) {
        window.clearTimeout(scrollEndTimeoutRef.current)
      }
      if (programmaticTimeoutRef.current) {
        window.clearTimeout(programmaticTimeoutRef.current)
      }
    }
  }, [
    onRequestYear,
    scrollContainerRef,
    snapToTarget,
    updateHeaderMonth,
    yearBounds.maxYear,
    yearBounds.minYear,
  ])

  useEffect(() => {
    updateHeaderMonth()
  }, [updateHeaderMonth])

  const todayKey = formatDateOnly(new Date(), CLUB_TIME_ZONE)
  const canGoToPreviousMonth =
    formatMonthParam(currentDate) !==
    `${CALENDAR_MIN_YEAR}-${String(CALENDAR_MIN_MONTH_INDEX + 1).padStart(2, '0')}`

  return (
    <div>
      <div
        ref={headerBlockRef}
        className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur"
      >
        <div className="px-2 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-base font-semibold">{headerMonth.label}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {tripsInYearCount} trip{tripsInYearCount === 1 ? '' : 's'} in{' '}
              {tripsYear}
            </span>
          </div>
          <div className="flex items-center">
            {!isMobile && (
              <div className="inline-flex overflow-hidden border border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-none"
                  onClick={onPrevMonth}
                  disabled={!canGoToPreviousMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-none border-x border-border h-9 px-4 text-xs"
                  onClick={onToday}
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-none"
                  onClick={onNextMonth}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            {isMobile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none"
                onClick={onToday}
              >
                Today
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-7 text-xs uppercase tracking-widest text-muted-foreground">
          {weekDays.map(day => (
            <div key={`weekday-${day}`} className="py-2 text-center">
              {day}
            </div>
          ))}
        </div>
      </div>

      <div>
        {weekRows.map(week => (
          <div
            key={week.weekKey}
            data-week-start={week.weekKey}
            data-month-key={week.monthKey}
            ref={(node: HTMLDivElement | null) => {
              weekRowRefs.current[week.weekKey] = node
              if (week.monthLabel) {
                monthBoundaryWeekRef.current[week.monthLabel.monthKey] =
                  week.weekKey
              }
            }}
            className={cn(
              'relative grid aspect-[7/1] grid-cols-7 grid-rows-1',
              !week.isLastWeekOfMonth && 'border-b border-border',
              week.isLastWeekOfMonth && 'mb-3 md:mb-0',
            )}
          >
            {week.monthLabel && (
              <div
                className={cn(
                  'pointer-events-none absolute left-2 top-0 text-[11px] font-semibold text-foreground/80 transition-opacity duration-200',
                  isScrolling ? 'opacity-100' : 'opacity-0',
                )}
              >
                {week.monthLabel.label}
              </div>
            )}
            {week.days.map((day, index) => {
              if (!day) {
                return (
                  <div
                    key={`${week.weekKey}:blank-${index}`}
                    aria-hidden="true"
                    className={cn(
                      'h-full min-h-0 border-r-0 border-border md:border-r',
                      index === 6 && 'md:border-r-0',
                    )}
                  />
                )
              }

              const dayTrips = tripsByDay.get(day.dateKey) ?? []
              const eventCategories = dayTrips.map(
                trip => getTripCategories(trip)[0],
              )
              const teaser =
                viewerKey === 'public'
                  ? teasersByDay.get(day.dateKey)
                  : undefined
              const isToday = day.dateKey === todayKey
              const tripsToShow = showTitles ? dayTrips.slice(0, 2) : []
              const hasTeaser =
                teaser && teaser.event_count > 0 && dayTrips.length === 0
              const handleDayClick = () => {
                if (hasTeaser && teaser) {
                  onTeaserClick(day.dateKey, teaser)
                  return
                }
                onDaySelect(day.date)
              }

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={handleDayClick}
                  className={cn(
                    'flex h-full min-h-0 min-w-0 w-full flex-col gap-1 overflow-hidden border-r-0 border-border px-0 py-1 text-left transition hover:bg-secondary/60 md:gap-2 md:border-r md:px-2 md:py-2',
                    isToday && 'bg-primary/5',
                    index % 7 === 6 && 'md:border-r-0',
                  )}
                >
                  <div className="flex h-6 flex-none items-center justify-center md:h-7">
                    <span
                      className={cn(
                        'inline-flex h-6 w-6 items-center justify-center text-xs font-semibold md:h-7 md:w-7',
                        isToday && 'bg-foreground text-background',
                      )}
                    >
                      {day.date.getDate()}
                    </span>
                  </div>

                  {showTitles ? (
                    <div className="space-y-1 text-[10px] sm:text-[11px]">
                      {tripsToShow.map(trip => (
                        <div
                          key={`${day.dateKey}:${trip.id}`}
                          className="flex items-center gap-1"
                        >
                          <CalendarCategoryPill
                            categories={getTripCategories(trip).slice(0, 1)}
                            eventMarker
                            className="shrink-0"
                          />
                          <span className="truncate">
                            {trip.lifecycleStatus === 'canceled' && (
                              <span className="sr-only">Canceled: </span>
                            )}
                            <TripTitleText
                              title={trip.title}
                              canceled={trip.lifecycleStatus === 'canceled'}
                            />
                          </span>
                        </div>
                      ))}
                      {dayTrips.length > tripsToShow.length && (
                        <span className="text-[10px] text-muted-foreground">
                          More events
                        </span>
                      )}
                    </div>
                  ) : (
                    eventCategories.length > 0 && (
                      <div className="flex h-2 w-full flex-none items-center justify-center">
                        <CalendarCategoryPill
                          categories={eventCategories}
                          eventMarker
                        />
                      </div>
                    )
                  )}

                  {hasTeaser && teaser && (
                    <div className="flex h-2 w-full flex-none items-center justify-center">
                      <CalendarCategoryPill
                        categories={Array.from(
                          { length: teaser.event_count },
                          () => 'other' as const,
                        )}
                        eventMarker
                      />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
