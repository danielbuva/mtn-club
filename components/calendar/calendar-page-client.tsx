'use client'

import { addMonths, format, startOfWeek } from 'date-fns'
import { ExternalLink, Lock } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { CalendarActions } from '@/components/calendar/calendar-actions'
import {
  CalendarControls,
  type CalendarViewOption,
} from '@/components/calendar/calendar-controls'
import { CalendarListView } from '@/components/calendar/calendar-list-view'
import { CalendarMonthView } from '@/components/calendar/calendar-month-view'
import { CalendarSemesterSelect } from '@/components/calendar/calendar-semester-select'
import {
  buildTeaserMap,
  formatMonthParam,
  groupTripsByDay,
  parseMonthParam,
  type SemesterKey,
  setQueryParams,
  type ViewMode,
} from '@/components/calendar/calendar-utils'
import { useMediaQuery } from '@/components/calendar/use-media-query'
import { MemberCTA } from '@/components/member-cta'
import { TripDetailsDrawer } from '@/components/trip-details-drawer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { CalendarYearData, ViewerKey } from '@/lib/events/calendar'
import type { CalendarTrip, TripTeaserDay } from '@/lib/events/types'
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

const clampDateToBounds = (date: Date) => {
  const year = date.getFullYear()
  if (year < 1970) return new Date(1970, 0, 1)
  if (year > 2100) return new Date(2100, 11, 31)
  return date
}

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
  isMember: boolean
  isLeader: boolean
}

export function CalendarPageClient({
  yearData,
  viewerKey,
  initialMonth,
  isMember,
  isLeader,
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
    return parseMonthParam(initialMonth) ?? new Date(yearData.year, 0, 1)
  })
  const [selectedTrip, setSelectedTrip] = useState<CalendarTrip | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [teaserMessage, setTeaserMessage] = useState<string | null>(null)
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
        parseMonthParam(initialMonth) ?? new Date(yearData.year, 0, 1),
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
  const previousViewRef = useRef<ViewMode | null>(null)

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

    const resolvedDate = clampDateToBounds(
      parseMonthParam(resolvedMonthString) ?? new Date(yearData.year, 0, 1),
    )

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
      month: resolvedMonthString,
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
    previousViewRef.current = viewMode
  }, [viewMode])

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

  const filteredTrips = allTrips
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

  const handleTeaserClick = (_day: string, _teaser: TripTeaserDay) => {
    if (viewerKey === 'member') return
    setTeaserMessage('Log in / become a member to view details.')
  }

  const handleDayOpen = (date: Date) => {
    const dayKey = format(date, 'yyyy-MM-dd')
    const dayTrips = tripsByDay.get(dayKey) ?? []
    if (dayTrips.length === 0) return
    setCurrentDate(clampDateToBounds(date))
    if (dayTrips.length === 1) {
      handleTripSelect(dayTrips[0])
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
    const monthDate = parseMonthParam(monthKey) ?? new Date()
    await ensureYearsLoaded([monthDate.getFullYear()])
    setCurrentDate(clampDateToBounds(monthDate))
    setMonthScrollTarget({ kind: 'month', key: monthKey, behavior })
  }

  const handleToday = async () => {
    const today = clampDateToBounds(new Date())
    const weekStartKey = format(
      startOfWeek(today, { weekStartsOn: 0 }),
      'yyyy-MM-dd',
    )
    await ensureYearsLoaded([today.getFullYear()])
    setCurrentDate(today)
    setMonthScrollTarget({ kind: 'week', key: weekStartKey, behavior: 'auto' })
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

  const hasUpcomingTeasers = useMemo(() => {
    if (viewerKey !== 'public') return false
    const now = new Date()
    return allTeasers.some(
      teaser => new Date(teaser.day) >= now && teaser.event_count > 0,
    )
  }, [allTeasers, viewerKey])

  const currentView: CalendarViewOption = viewMode
  const currentYear = currentDate.getFullYear()
  const tripsInCurrentYear = useMemo(
    () =>
      filteredTrips.filter(trip => {
        const startYear = new Date(trip.dateStart).getFullYear()
        const endYear = new Date(trip.dateEnd).getFullYear()
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
    saveScrollPosition(currentView)
    setFocusedDay(null)
    setViewMode(nextView)
  }

  useLayoutEffect(() => {
    if (currentView !== 'list') return
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
      <main className="flex-1 pt-16">
        <section className="border-b border-border bg-linear-to-b from-muted/40 to-background px-4 py-10 md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold sm:text-4xl">
                Trip Calendar
              </h1>
              <p className="mt-2 text-muted-foreground">
                Browse adventures, reserve spots, and plan your season in one
                view.
              </p>
            </div>

            <Card className="border-border/60 bg-card">
              <CardContent className="p-4">
                <p className="text-sm font-medium">Subscribe</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2 bg-transparent"
                  >
                    <ExternalLink className="h-4 w-4" />
                    iCal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2 bg-transparent"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Google Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="px-4 py-6">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <CalendarControls
                  view={currentView}
                  onViewChange={handleViewChange}
                />
                {currentView === 'list' && (
                  <div className="hidden md:inline-flex h-9 items-center gap-0 rounded-full border border-border bg-card px-0 text-sm text-muted-foreground">
                    <span className="pl-3 text-foreground/70">Semester</span>
                    <span className="ml-2 mr-0 h-4 w-px bg-border" />
                    <CalendarSemesterSelect
                      value={semester}
                      onChange={setSemester}
                      triggerClassName="h-7 w-28 rounded-l-none rounded-r-full border-0 bg-transparent pl-2 pr-3 shadow-none justify-between"
                    />
                  </div>
                )}
                {viewerKey === 'public' && hasUpcomingTeasers && (
                  <div className="hidden md:inline-flex h-9 items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 text-xs text-primary/80 whitespace-nowrap">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    <span>Upcoming adventures are hidden.</span>
                    <MemberCTA
                      variant="link"
                      className="text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      Join to unlock
                    </MemberCTA>
                  </div>
                )}
              </div>
              <div className="hidden md:inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm text-muted-foreground">
                <span className="text-foreground/70">Subscribe</span>
                <span className="h-4 w-px bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full px-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  iCal
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full px-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Google
                </Button>
              </div>
            </div>

            {currentView === 'list' && (
              <div className="md:hidden rounded-2xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Semester
                </p>
                <div className="mt-3">
                  <CalendarSemesterSelect
                    value={semester}
                    onChange={setSemester}
                    triggerClassName="w-full rounded-full"
                  />
                </div>
              </div>
            )}

            {teaserMessage && viewerKey === 'public' && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  {teaserMessage}{' '}
                  <MemberCTA
                    variant="link"
                    className="underline text-foreground"
                  />
                  .
                </CardContent>
              </Card>
            )}

            <CalendarActions isMember={isMember} isLeader={isLeader} />

            {viewMode === 'calendar' && (
              <div
                ref={monthScrollRef}
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
                  onDaySelect={handleDayOpen}
                  onTeaserClick={handleTeaserClick}
                  onToday={handleToday}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                />
              </div>
            )}
            {viewMode === 'list' && (
              <div
                ref={listScrollRef}
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
                  viewerKey={viewerKey}
                  onTripSelect={handleTripSelect}
                  focusDate={focusedDay}
                  onClearFocus={() => setFocusedDay(null)}
                />
              </div>
            )}
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
