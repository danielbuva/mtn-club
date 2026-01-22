'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarDays, ExternalLink, List, Lock } from 'lucide-react'
import { TripDetailsDrawer } from '@/components/trip-details-drawer'
import { CalendarView } from '@/components/calendar-view'
import { FiltersPanel, type Filters } from '@/components/filters-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarActions } from '@/components/calendar/calendar-actions'
import { TripListItem } from '@/components/calendar/trip-list-item'
import { MemberCTA } from '@/components/member-cta'
import { useViewer } from '@/components/auth/viewer-provider'
import { filterTrips } from '@/lib/events/filters'
import type { CalendarTrip, TripTeaserDay } from '@/lib/events/types'
import { isLeaderRole } from '@/lib/memberships/types'

type CalendarPageClientProps = {
  trips: CalendarTrip[]
  teasers: TripTeaserDay[]
  currentMonth: string
}

const parseMonthString = (month: string): Date => {
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  if (!match) {
    return new Date()
  }

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  if (!Number.isFinite(year) || monthIndex < 0 || monthIndex > 11) {
    return new Date()
  }

  return new Date(year, monthIndex, 1)
}

export function CalendarPageClient({
  trips,
  teasers,
  currentMonth,
}: CalendarPageClientProps) {
  const router = useRouter()
  const viewer = useViewer()
  const [view, setView] = useState<'calendar' | 'list'>('list')
  const [currentDate, setCurrentDate] = useState(() => parseMonthString(currentMonth))
  const [selectedTrip, setSelectedTrip] = useState<CalendarTrip | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [teaserMessage, setTeaserMessage] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    season: 'All Seasons',
    difficulty: 'All Levels',
    activity: 'All Activities',
    membersOnly: false,
  })

  useEffect(() => {
    setCurrentDate(parseMonthString(currentMonth))
    setTeaserMessage(null)
  }, [currentMonth])

  const teasersByDay = useMemo(() => {
    const map = new Map<string, TripTeaserDay>()
    teasers.forEach((teaser) => {
      map.set(teaser.day, teaser)
    })
    return map
  }, [teasers])

  const isMember = viewer.isMember
  const isLeader = isLeaderRole(viewer.member?.role ?? null)
  const filteredTrips = useMemo(
    () => filterTrips(isMember ? trips : [], filters),
    [isMember, trips, filters]
  )

  const handleTripSelect = (trip: CalendarTrip) => {
    setSelectedTrip(trip)
    setDrawerOpen(true)
  }

  const handleDateChange = (date: Date) => {
    setCurrentDate(date)
    const monthParam = format(date, 'yyyy-MM')
    router.push(`/calendar?month=${monthParam}`)
  }

  const handleTeaserClick = (_day: string, _teaser: TripTeaserDay) => {
    if (isMember) return
    setTeaserMessage(`Log in / become a member to view details.`)
  }

  return (
    <>
      <main className="flex-1 pt-16">
        <section className="py-12 px-4 bg-secondary/30 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Trip Calendar</h1>
                <p className="text-muted-foreground">
                  Browse upcoming adventures and reserve your spot.
                </p>
              </div>

              <Card className="bg-card border-border/50">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-3">Subscribe to Calendar</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl gap-2 bg-transparent">
                      <ExternalLink className="w-4 h-4" />
                      iCal
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl gap-2 bg-transparent">
                      <ExternalLink className="w-4 h-4" />
                      Google Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              <aside className="lg:w-72 shrink-0">
                <div className="sticky top-24 space-y-6">
                  <Tabs value={view} onValueChange={(v) => setView(v as 'calendar' | 'list')}>
                    <TabsList className="w-full grid grid-cols-2 rounded-xl">
                      <TabsTrigger value="list" className="rounded-lg gap-2">
                        <List className="w-4 h-4" />
                        List
                      </TabsTrigger>
                      <TabsTrigger value="calendar" className="rounded-lg gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Calendar
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="p-4 rounded-2xl border border-border bg-card">
                    <h3 className="font-semibold mb-4">Filters</h3>
                    <FiltersPanel filters={filters} onFiltersChange={setFilters} />
                  </div>

                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Members-Only Trips</p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Some trips are exclusive to members. Join to unlock access.
                          </p>
                          <MemberCTA size="sm" className="rounded-xl" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </aside>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <p className="text-muted-foreground">
                    {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''} found
                  </p>
                  <CalendarActions isMember={isMember} isLeader={isLeader} />
                </div>

                {view === 'calendar' && (
                  <>
                    {teaserMessage && !isMember && (
                      <Card className="mb-4 border-primary/20 bg-primary/5">
                        <CardContent className="p-4 text-sm text-muted-foreground">
                          {teaserMessage}{' '}
                          <MemberCTA variant="link" className="underline text-foreground" />
                          .
                        </CardContent>
                      </Card>
                    )}
                    <CalendarView
                      trips={filteredTrips}
                      currentDate={currentDate}
                      onDateChange={handleDateChange}
                      onTripClick={handleTripSelect}
                      teasersByDay={teasersByDay}
                      showTeasers={!isMember}
                      onTeaserClick={handleTeaserClick}
                    />
                  </>
                )}

                {view === 'list' && (
                  <div className="space-y-4">
                    {filteredTrips.length === 0 ? (
                      <Card className="p-12 text-center">
                        <p className="text-muted-foreground">No trips match your filters.</p>
                        <Button
                          variant="outline"
                          className="mt-4 rounded-xl bg-transparent"
                          onClick={() => setFilters({
                            search: '',
                            season: 'All Seasons',
                            difficulty: 'All Levels',
                            activity: 'All Activities',
                            membersOnly: false,
                          })}
                        >
                          Clear Filters
                        </Button>
                      </Card>
                    ) : (
                      filteredTrips.map((trip) => (
                        <TripListItem
                          key={trip.id}
                          trip={trip}
                          onClick={() => handleTripSelect(trip)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
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
