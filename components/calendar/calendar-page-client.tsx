'use client'

import { addMonths, format, startOfWeek } from 'date-fns'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  CalendarControls,
  type CalendarViewOption,
} from '@/components/calendar/calendar-controls'
import { CalendarListView } from '@/components/calendar/calendar-list-view'
import { CalendarMonthView } from '@/components/calendar/calendar-month-view'
import { CalendarSemesterSelect } from '@/components/calendar/calendar-semester-select'
import {
  buildTeaserMap,
  CALENDAR_MAX_YEAR,
  CALENDAR_MIN_YEAR,
  clampCalendarDate,
  clampCalendarMonthDate,
  formatMonthParam,
  groupTripsByDay,
  isCalendarTripSupported,
  parseMonthParam,
  type SemesterKey,
  setQueryParams,
  type ViewMode,
} from '@/components/calendar/calendar-utils'
import { useMediaQuery } from '@/components/calendar/use-media-query'
import { TripDetailsDrawer } from '@/components/trip-details-drawer'
import type { CalendarYearData, ViewerKey } from '@/lib/events/calendar'
import { getSingleTripForDay } from '@/lib/events/calendar-day-selection'
import { parseCalendarDate } from '@/lib/events/formatters'
import type { CalendarTrip } from '@/lib/events/types'
import { cn } from '@/lib/utils'

const resolveViewMode = (value: string | null): ViewMode => {
  if (value === 'list') return 'list'
  if (value === 'calendar') return 'calendar'
  return 'calendar'
}

const isValidSemester = (value: string | null): value is SemesterKey =>
  value === 'spring' ||
  value === 'summer' ||
  value === 'fall' ||
  value === 'winter' ||
  value === 'all'

const getMonthKey = (date: Date) => formatMonthParam(date)

const addMonthsToKey = (monthKey: string, delta: number) => {
  const base = parseMonthParam(monthKey) ?? new Date()
  return formatMonthParam(addMonths(base, delta))
}

type ScrollState = { pos: number; has: boolean }
type ScrollStateByView = Record<CalendarViewOption, ScrollState>
type PendingScrollAdjust = { prevHeight: number; prevScrollTop: number } | null

interface CalendarPageClientProps {
  yearData: CalendarYearData
  viewerKey: ViewerKey
  initialMonth: string
}

export function CalendarPageClient({
  yearData,
  viewerKey,
  initialMonth,
}: CalendarPageClientProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [yearDataByYear, setYearDataByYear] = useState<
    Record<number, CalendarYearData>
  >(() => ({
    [yearData.year]: yearData,
  }))
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [semester, setSemester] = useState<SemesterKey>('all')
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    return clampCalendarMonthDate(
      parseMonthParam(initialMonth) ?? new Date(yearData.year, 0, 1),
    )
  })
  const [selectedTrip, setSelectedTrip] = useState<CalendarTrip | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [focusedDay, setFocusedDay] = useState<string | null>(null)
  const [monthScrollTarget, setMonthScrollTarget] = useState<{
    kind: 'month' | 'week'
    key: string
    behavior: 'auto' | 'smooth'
  } | null>(() => {
    return {
      kind: 'month',
      key: formatMonthParam(
        clampCalendarMonthDate(
          parseMonthParam(initialMonth) ?? new Date(yearData.year, 0, 1),
        ),
      ),
      behavior: 'auto',
    }
  })
  const [monthScrollAdjustToken, setMonthScrollAdjustToken] = useState(0)
  const [scrollPosByView, setScrollPosByView] = useState<ScrollStateByView>(
    () => ({
      calendar: { pos: 0, has: false },
      list: { pos: 0, has: false },
    }),
  )
  const [scrollingByView, setScrollingByView] = useState<
    Record<CalendarViewOption, boolean>
  >(() => ({ calendar: false, list: false }))
  const [pendingScrollAdjust, setPendingScrollAdjust] =
    useState<PendingScrollAdjust>(null)
  const monthScrollRef = useRef<HTMLDivElement | null>(null)
  const listScrollRef = useRef<HTMLDivElement | null>(null)
  const scrollTimeoutsRef = useRef<Record<CalendarViewOption, number | null>>({
    calendar: null,
    list: null,
  })
  const loadingYearsRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const urlView = url.searchParams.get('view')
    const urlSemester = url.searchParams.get('semester')
    const urlMonth = url.searchParams.get('month')
    const storedView = window.localStorage.getItem('calendar:view')
    const storedSemester = window.localStorage.getItem('calendar:semester')
    const storedMonth = window.localStorage.getItem('calendar:month')
    const resolvedView = resolveViewMode(urlView ?? storedView)

    const resolvedSemester = isValidSemester(urlSemester)
      ? urlSemester
      : isValidSemester(storedSemester)
        ? storedSemester
        : 'all'

    const resolvedMonthString = parseMonthParam(urlMonth)
      ? (urlMonth as string)
      : parseMonthParam(storedMonth)
        ? (storedMonth as string)
        : initialMonth

    const resolvedDate = clampCalendarMonthDate(
      parseMonthParam(resolvedMonthString) ?? new Date(yearData.year, 0, 1),
    )
    const resolvedMonth = formatMonthParam(resolvedDate)

    setViewMode(resolvedView)
    setSemester(resolvedSemester)
    setCurrentDate(resolvedDate)
    setMonthScrollTarget({
      kind: 'month',
      key: formatMonthParam(resolvedDate),
      behavior: 'auto',
    })

    setQueryParams({
      view: resolvedView,
      semester: resolvedSemester,
      month: resolvedMonth,
      range: undefined,
    })

    setHydrated(true)
  }, [initialMonth, yearData.year])

  useEffect(() => {
    setYearDataByYear({ [yearData.year]: yearData })
    loadingYearsRef.current = new Set()
    setFocusedDay(null)
    setScrollPosByView({
      calendar: { pos: 0, has: false },
      list: { pos: 0, has: false },
    })
  }, [yearData])

  useEffect(() => {
    if (!hydrated) return
    const monthParam = formatMonthParam(currentDate)
    setQueryParams({
      view: viewMode,
      semester,
      month: monthParam,
      range: undefined,
    })

    window.localStorage.setItem('calendar:view', viewMode)
    window.localStorage.setItem('calendar:semester', semester)
    window.localStorage.setItem('calendar:month', monthParam)
  }, [currentDate, hydrated, semester, viewMode])

  useEffect(() => {
    return () => {
      Object.values(scrollTimeoutsRef.current).forEach(timeoutId => {
        if (timeoutId) {
          window.clearTimeout(timeoutId)
        }
      })
    }
  }, [])

  const loadedYears = useMemo(
    () =>
      Object.keys(yearDataByYear)
        .map(Number)
        .sort((a, b) => a - b),
    [yearDataByYear],
  )

  const allTrips = useMemo(
    () => loadedYears.flatMap(year => yearDataByYear[year]?.trips ?? []),
    [loadedYears, yearDataByYear],
  )

  const allTeasers = useMemo(
    () => loadedYears.flatMap(year => yearDataByYear[year]?.teasers ?? []),
    [loadedYears, yearDataByYear],
  )

  const filteredTrips = useMemo(
    () =>
      allTrips.filter(trip =>
        isCalendarTripSupported(parseCalendarDate(trip.dateEnd)),
      ),
    [allTrips],
  )
  const tripsByDay = useMemo(() => groupTripsByDay(allTrips), [allTrips])
  const teasersByDay = useMemo(() => buildTeaserMap(allTeasers), [allTeasers])

  useLayoutEffect(() => {
    if (!pendingScrollAdjust) return
    const container = monthScrollRef.current
    if (!container) {
      setPendingScrollAdjust(null)
      return
    }
    const nextHeight = container.scrollHeight
    container.scrollTop =
      pendingScrollAdjust.prevScrollTop +
      (nextHeight - pendingScrollAdjust.prevHeight)
    setPendingScrollAdjust(null)
    setMonthScrollAdjustToken(prev => prev + 1)
  }, [pendingScrollAdjust])

  const handleTripSelect = (trip: CalendarTrip) => {
    setSelectedTrip(trip)
    setDrawerOpen(true)
  }

  const handleDayOpen = (date: Date) => {
    const dayKey = format(date, 'yyyy-MM-dd')
    const dayTrips = tripsByDay.get(dayKey) ?? []
    if (dayTrips.length === 0) return
    setCurrentDate(clampCalendarMonthDate(date))
    const singleTrip = getSingleTripForDay(dayKey, dayTrips)
    if (singleTrip) {
      handleTripSelect(singleTrip)
      return
    }
    saveScrollPosition(currentView)
    setViewMode('list')
    setFocusedDay(dayKey)
  }

  const scrollToMonth = async (
    monthKey: string,
    behavior: 'auto' | 'smooth',
  ) => {
    const monthDate = clampCalendarMonthDate(
      parseMonthParam(monthKey) ?? new Date(),
    )
    const boundedMonthKey = formatMonthParam(monthDate)
    await ensureYearsLoaded([monthDate.getFullYear()])
    setCurrentDate(monthDate)
    setMonthScrollTarget({
      kind: 'month',
      key: boundedMonthKey,
      behavior,
    })
  }

  const handleToday = async () => {
    const today = clampCalendarDate(new Date())
    const weekStartKey = format(
      startOfWeek(today, { weekStartsOn: 0 }),
      'yyyy-MM-dd',
    )
    await ensureYearsLoaded([today.getFullYear()])
    setCurrentDate(today)
    setMonthScrollTarget({
      kind: 'week',
      key: `${formatMonthParam(today)}:${weekStartKey}`,
      behavior: 'auto',
    })
  }

  const handlePrevMonth = async () => {
    const monthKey = getMonthKey(currentDate)
    const prevKey = addMonthsToKey(monthKey, -1)
    await scrollToMonth(prevKey, 'smooth')
  }

  const handleNextMonth = async () => {
    const monthKey = getMonthKey(currentDate)
    const nextKey = addMonthsToKey(monthKey, 1)
    await scrollToMonth(nextKey, 'smooth')
  }

  const ensureYearLoaded = useCallback(
    async (year: number, direction: 'prepend' | 'append') => {
      if (year < CALENDAR_MIN_YEAR || year > CALENDAR_MAX_YEAR) return
      if (yearDataByYear[year] || loadingYearsRef.current.has(year)) return
      loadingYearsRef.current.add(year)
      const container = monthScrollRef.current
      if (direction === 'prepend' && container) {
        setPendingScrollAdjust({
          prevHeight: container.scrollHeight,
          prevScrollTop: container.scrollTop,
        })
      }

      try {
        const response = await fetch(`/api/calendar/year?year=${year}`)
        if (!response.ok) {
          return
        }
        const payload = (await response.json()) as { data: CalendarYearData }
        setYearDataByYear(prev => {
          if (prev[year]) return prev
          return { ...prev, [year]: payload.data }
        })
      } finally {
        loadingYearsRef.current.delete(year)
      }
    },
    [yearDataByYear],
  )

  const ensureYearsLoaded = useCallback(
    async (years: number[]) => {
      const uniqueYears = Array.from(new Set(years))
      if (uniqueYears.length === 0) return
      const minLoaded = loadedYears[0] ?? uniqueYears[0]
      const maxLoaded = loadedYears[loadedYears.length - 1] ?? uniqueYears[0]
      await Promise.all(
        uniqueYears.map(async year => {
          if (yearDataByYear[year]) return
          const direction =
            year < minLoaded
              ? 'prepend'
              : year > maxLoaded
                ? 'append'
                : 'append'
          await ensureYearLoaded(year, direction)
        }),
      )
    },
    [ensureYearLoaded, loadedYears, yearDataByYear],
  )

  const currentView: CalendarViewOption = viewMode
  const currentYear = currentDate.getFullYear()
  const tripsInCurrentYear = useMemo(
    () =>
      filteredTrips.filter(trip => {
        const startYear = parseCalendarDate(trip.dateStart).getFullYear()
        const endYear = parseCalendarDate(trip.dateEnd).getFullYear()
        return startYear === currentYear || endYear === currentYear
      }),
    [currentYear, filteredTrips],
  )

  const getScrollRef = useCallback((view: CalendarViewOption) => {
    if (view === 'calendar') return monthScrollRef
    return listScrollRef
  }, [])

  const saveScrollPosition = useCallback(
    (view: CalendarViewOption) => {
      const ref = getScrollRef(view)
      if (!ref.current) return
      setScrollPosByView(prev => ({
        ...prev,
        [view]: { pos: ref.current?.scrollTop ?? 0, has: true },
      }))
    },
    [getScrollRef],
  )

  const handleViewChange = (nextView: CalendarViewOption) => {
    if (nextView === currentView) return
    saveScrollPosition(currentView)
    setFocusedDay(null)
    setViewMode(nextView)
  }

  const handleVisibleMonthChange = useCallback((monthKey: string) => {
    const monthDate = parseMonthParam(monthKey)
    if (!monthDate) return
    setCurrentDate(previousDate =>
      getMonthKey(previousDate) === monthKey
        ? previousDate
        : clampCalendarMonthDate(monthDate),
    )
  }, [])

  useLayoutEffect(() => {
    const ref = getScrollRef(currentView)
    if (!ref.current) return
    const state = scrollPosByView[currentView]
    const target = state.has ? state.pos : 0
    ref.current.scrollTop = target
  }, [currentView, getScrollRef, scrollPosByView])

  const handleScroll = useCallback(
    (view: CalendarViewOption) => () => {
      setScrollingByView(prev => ({ ...prev, [view]: true }))
      const existing = scrollTimeoutsRef.current[view]
      if (existing) {
        window.clearTimeout(existing)
      }
      scrollTimeoutsRef.current[view] = window.setTimeout(() => {
        setScrollingByView(prev => ({ ...prev, [view]: false }))
      }, 700)
    },
    [],
  )

  return (
    <>
      <main className="flex-1">
        <section className="public-page-top border-b border-border bg-linear-to-b from-muted/40 to-background px-4 pb-10 md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-brand text-4xl uppercase leading-[0.92] sm:text-5xl">
                Trip Calendar
              </h1>
              <p className="mt-2 text-muted-foreground">
                Browse adventures, reserve spots, and plan your season in one
                view.
              </p>
            </div>

            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Official dates are public. Exact meetup points, requirements,
              RSVPs, and schedule changes are announced in Discord.
            </p>
          </div>
        </section>

        <section className="px-4 pb-6 pt-6 md:pt-12">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <CalendarControls
                  view={currentView}
                  onViewChange={handleViewChange}
                />
                {currentView === 'list' && (
                  <div className="hidden h-9 items-center gap-0 border border-border bg-card px-0 text-sm text-muted-foreground md:inline-flex">
                    <span className="pl-3 text-foreground/70">Semester</span>
                    <span className="ml-2 mr-0 h-4 w-px bg-border" />
                    <CalendarSemesterSelect
                      value={semester}
                      onChange={setSemester}
                      triggerClassName="h-7 w-28 rounded-none border-0 bg-transparent pl-2 pr-3 shadow-none justify-between"
                    />
                  </div>
                )}
              </div>
            </div>

            {currentView === 'list' && (
              <div className="border border-border bg-card p-4 md:hidden">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Semester
                </p>
                <div className="mt-3">
                  <CalendarSemesterSelect
                    value={semester}
                    onChange={setSemester}
                    triggerClassName="w-full rounded-none"
                  />
                </div>
              </div>
            )}

            <div
              ref={monthScrollRef}
              hidden={viewMode !== 'calendar'}
              aria-hidden={viewMode !== 'calendar'}
              className={cn(
                'calendar-scroll calendar-month-scroll max-h-[70vh] overflow-y-auto pr-2 lg:max-h-[75vh]',
              )}
            >
              <CalendarMonthView
                currentDate={currentDate}
                tripsInYearCount={tripsInCurrentYear.length}
                tripsYear={currentYear}
                tripsByDay={tripsByDay}
                teasersByDay={teasersByDay}
                viewerKey={viewerKey}
                showTitles={!isMobile}
                isMobile={isMobile}
                loadedYears={loadedYears}
                scrollContainerRef={monthScrollRef}
                scrollTarget={monthScrollTarget}
                restoreScrollTop={
                  scrollPosByView.calendar.has
                    ? scrollPosByView.calendar.pos
                    : 0
                }
                scrollAdjustToken={monthScrollAdjustToken}
                onRequestYear={ensureYearLoaded}
                onScrollTargetHandled={() => setMonthScrollTarget(null)}
                onVisibleMonthChange={handleVisibleMonthChange}
                onDaySelect={handleDayOpen}
                onTeaserClick={() => undefined}
                onToday={handleToday}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
              />
            </div>
            <div
              ref={listScrollRef}
              hidden={viewMode !== 'list'}
              aria-hidden={viewMode !== 'list'}
              onScroll={handleScroll('list')}
              className={cn(
                'calendar-scroll max-h-[70vh] overflow-y-auto pr-2 lg:max-h-[75vh]',
                scrollingByView.list && 'is-scrolling',
              )}
            >
              <CalendarListView
                trips={filteredTrips}
                semester={semester}
                year={currentYear}
                onTripSelect={handleTripSelect}
                focusDate={focusedDay}
                onClearFocus={() => setFocusedDay(null)}
              />
            </div>
          </div>
        </section>
      </main>

      <TripDetailsDrawer
        trip={selectedTrip}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  )
}
