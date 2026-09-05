'use client'

import { Lock } from 'lucide-react'
import { getTripCategories } from '@/components/calendar/calendar-categories'
import { CalendarCategoryPill } from '@/components/calendar/calendar-category-pill'
import { TripCancellationNotice } from '@/components/trips/trip-cancellation-notice'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateRange, parseCalendarDate } from '@/lib/events/formatters'
import type { CalendarTrip } from '@/lib/events/types'

const difficultyColors: Record<
  NonNullable<CalendarTrip['difficulty']>,
  string
> = {
  Easy: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  Moderate:
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  Challenging:
    'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  Expert: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
}

interface TripListItemProps {
  trip: CalendarTrip
  onClick: () => void
}

export function TripListItem({ trip, onClick }: TripListItemProps) {
  const categories = getTripCategories(trip)

  return (
    <Card
      className="overflow-hidden rounded-none cursor-pointer hover:border-primary/20 hover:shadow-lg transition-all"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-32 p-4 bg-secondary flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1 text-center shrink-0">
            <span className="text-sm text-muted-foreground">
              {parseCalendarDate(trip.dateStart).toLocaleDateString('en-US', {
                month: 'short',
              })}
            </span>
            <span className="text-3xl font-bold">
              {parseCalendarDate(trip.dateStart).getDate()}
            </span>
            <span className="text-sm text-muted-foreground">
              {parseCalendarDate(trip.dateStart).getFullYear()}
            </span>
          </div>

          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CalendarCategoryPill
                    categories={categories}
                    className="shrink-0"
                  />
                  <h3 className="font-semibold text-lg">{trip.title}</h3>
                  {trip.membersOnly && (
                    <Badge variant="secondary" className="rounded-none gap-1">
                      <Lock className="w-3 h-3" />
                      Members
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  {trip.state} &bull;{' '}
                  {formatDateRange(trip.dateStart, trip.dateEnd)}
                </p>
              </div>
              {trip.difficulty && (
                <Badge
                  variant="outline"
                  className={`rounded-none ${difficultyColors[trip.difficulty]}`}
                >
                  {trip.difficulty}
                </Badge>
              )}
            </div>

            {trip.lifecycleStatus === 'canceled' && (
              <TripCancellationNotice reason={trip.cancellationReason} />
            )}
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {trip.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{trip.miles === null ? 'TBD' : `${trip.miles} miles`}</span>
              <span>
                {trip.elevationGain === null
                  ? 'TBD'
                  : `${trip.elevationGain.toLocaleString()} ft gain`}
              </span>
              <span>
                {trip.isAllDay ? 'Time announced in Discord' : trip.meetingTime}
              </span>
            </div>
            {trip.hosts.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Led by{' '}
                {trip.hosts
                  .map(host => `${host.name} — ${host.title}`)
                  .join('; ')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
