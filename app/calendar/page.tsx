'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CalendarDays, ExternalLink, List, Lock } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { TripCard } from '@/components/trip-card'
import { TripDetailsDrawer } from '@/components/trip-details-drawer'
import { CalendarView } from '@/components/calendar-view'
import { FiltersPanel, type Filters } from '@/components/filters-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { trips, type Trip, formatDateRange } from '@/lib/data'

export default function CalendarPage() {
  const [view, setView] = useState<'calendar' | 'list'>('list')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    season: 'All Seasons',
    difficulty: 'All Levels',
    activity: 'All Activities',
    membersOnly: false,
  })

  // Filter trips
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        if (
          !trip.title.toLowerCase().includes(searchLower) &&
          !trip.state.toLowerCase().includes(searchLower)
        ) {
          return false
        }
      }

      if (filters.season !== 'All Seasons') {
        const seasonTag = filters.season.toLowerCase()
        if (!trip.tags.includes(seasonTag)) return false
      }

      if (filters.difficulty !== 'All Levels') {
        if (trip.difficulty !== filters.difficulty) return false
      }

      if (filters.activity !== 'All Activities') {
        const activityTag = filters.activity.toLowerCase()
        if (!trip.tags.includes(activityTag)) return false
      }

      if (filters.membersOnly && !trip.membersOnly) return false

      return true
    }).sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
  }, [filters])

  const handleTripSelect = (trip: Trip) => {
    setSelectedTrip(trip)
    setDrawerOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-12 px-4 bg-secondary/30 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Trip Calendar</h1>
                <p className="text-muted-foreground">
                  Browse upcoming adventures and reserve your spot.
                </p>
              </div>

              {/* Subscribe Options */}
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

        {/* Main Content */}
        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <aside className="lg:w-72 shrink-0">
                <div className="sticky top-24 space-y-6">
                  {/* View Toggle */}
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

                  {/* Filters */}
                  <div className="p-4 rounded-2xl border border-border bg-card">
                    <h3 className="font-semibold mb-4">Filters</h3>
                    <FiltersPanel filters={filters} onFiltersChange={setFilters} />
                  </div>

                  {/* Members Only Notice */}
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
                          <Link href="/membership">
                            <Button size="sm" className="rounded-xl">
                              Become a Member
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </aside>

              {/* Main Area */}
              <div className="flex-1 min-w-0">
                {/* Results Count */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-muted-foreground">
                    {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                {/* Calendar View */}
                {view === 'calendar' && (
                  <CalendarView
                    trips={filteredTrips}
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                    onTripClick={handleTripSelect}
                  />
                )}

                {/* List View */}
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

      <Footer />

      {/* Trip Details Drawer */}
      <TripDetailsDrawer
        trip={selectedTrip}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  )
}

// Trip List Item Component
function TripListItem({ trip, onClick }: { trip: Trip; onClick: () => void }) {
  const difficultyColors: Record<Trip['difficulty'], string> = {
    Easy: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    Moderate: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    Challenging: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    Expert: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  }

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:border-primary/20 hover:shadow-lg transition-all"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Date Block */}
          <div className="sm:w-32 p-4 bg-secondary flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1 text-center shrink-0">
            <span className="text-sm text-muted-foreground">
              {new Date(trip.dateStart).toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span className="text-3xl font-bold">
              {new Date(trip.dateStart).getDate()}
            </span>
            <span className="text-sm text-muted-foreground">
              {new Date(trip.dateStart).getFullYear()}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{trip.title}</h3>
                  {trip.membersOnly && (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="w-3 h-3" />
                      Members
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  {trip.state} • {formatDateRange(trip.dateStart, trip.dateEnd)}
                </p>
              </div>
              <Badge variant="outline" className={difficultyColors[trip.difficulty]}>
                {trip.difficulty}
              </Badge>
            </div>

            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {trip.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{trip.miles} miles</span>
              <span>{trip.elevationGain.toLocaleString()} ft gain</span>
              <span>Meet at {trip.meetingTime}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
