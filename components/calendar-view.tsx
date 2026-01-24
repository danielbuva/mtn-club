'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CalendarTrip, TripTeaserDay } from '@/lib/events/types'
import { cn } from '@/lib/utils'

interface CalendarViewProps {
  trips: CalendarTrip[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onTripClick: (trip: CalendarTrip) => void
  teasersByDay?: Map<string, TripTeaserDay>
  showTeasers?: boolean
  onTeaserClick?: (day: string, teaser: TripTeaserDay) => void
}

export function CalendarView({
  trips,
  currentDate,
  onDateChange,
  onTripClick,
  teasersByDay,
  showTeasers = false,
  onTeaserClick,
}: CalendarViewProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startingDay = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days: {
      key: string
      day: number | null
      trips: CalendarTrip[]
      teaser?: TripTeaserDay
      dateStr?: string
    }[] = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push({ key: `${year}-${month}-empty-${i}`, day: null, trips: [] })
    }

    // Add days of the month
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayTrips = trips.filter((trip) => {
        const startDate = trip.dateStart
        const endDate = trip.dateEnd
        return dateStr >= startDate && dateStr <= endDate
      })
      const teaser = showTeasers ? teasersByDay?.get(dateStr) : undefined
      days.push({ key: dateStr, day, trips: dayTrips, teaser, dateStr })
    }

    return days
  }, [year, month, trips, teasersByDay, showTeasers])

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const goToPreviousMonth = () => {
    onDateChange(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    onDateChange(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  const today = new Date()
  const isToday = (day: number | null) => {
    if (!day) return false
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-semibold">{monthName}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl bg-transparent" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 border-b border-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={`weekday-${day}`} className="p-3 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarData.map((item, index) => {
          const teaser = item.teaser
          const dateStr = item.dateStr
          const teaserOnly = !!(
            onTeaserClick &&
            teaser &&
            teaser.event_count > 0 &&
            dateStr &&
            item.trips.length === 0
          )
          const handleTeaserClick = () => {
            if (!dateStr || !teaser) return
            onTeaserClick?.(dateStr, teaser)
          }

          return (
            <div
              key={item.key}
              className={cn(
                'min-h-24 p-2 border-b border-r border-border',
                index % 7 === 6 && 'border-r-0',
                !item.day && 'bg-muted/30'
              )}
            >
              {item.day && (
                <>
                  {teaserOnly ? (
                    <button
                      type="button"
                      onClick={handleTeaserClick}
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full',
                        isToday(item.day) && 'bg-primary text-primary-foreground',
                        'hover:bg-primary/10'
                      )}
                    >
                      {item.day}
                    </button>
                  ) : (
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full',
                        isToday(item.day) && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {item.day}
                    </span>
                  )}
                  <div className="mt-1 space-y-1">
                    {item.trips.slice(0, 2).map((trip) => (
                      <button
                        key={trip.id}
                        onClick={() => onTripClick(trip)}
                        className={cn(
                          'w-full text-left text-xs px-2 py-1 rounded-md truncate transition-colors',
                          trip.membersOnly
                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                            : 'bg-secondary text-foreground hover:bg-secondary/80'
                        )}
                      >
                        {trip.title}
                      </button>
                    ))}
                    {item.trips.length > 2 && (
                      <span className="text-xs text-muted-foreground px-2">
                        +{item.trips.length - 2} more
                      </span>
                    )}
                    {teaserOnly && teaser && teaser.event_count > 0 && (
                      <button
                        type="button"
                        onClick={handleTeaserClick}
                        aria-label={`${teaser.event_count} upcoming trips. Sign in to view details.`}
                        className="text-xs text-muted-foreground px-2 text-left hover:text-foreground"
                      >
                        <span className="inline-flex items-center gap-1">
                          <span>• {teaser.event_count} upcoming</span>
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 blur-[1px]">
                            members
                          </span>
                        </span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
