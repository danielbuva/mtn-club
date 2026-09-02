import type { TripListItem } from '@/lib/trips/types'

type TripStatsProps = {
  trip: TripListItem
}

const formatMiles = (miles: number) =>
  `${miles.toFixed(miles % 1 === 0 ? 0 : 1)} mi`

export function TripStats({ trip }: TripStatsProps) {
  const stats: string[] = []

  if (trip.activityType === 'climbing') {
    if (trip.climbStyle) {
      stats.push(trip.climbStyle)
    }
    if (trip.gradeMin && trip.gradeMax) {
      stats.push(`${trip.gradeMin}-${trip.gradeMax}`)
    } else if (trip.gradeMin) {
      stats.push(`From ${trip.gradeMin}`)
    } else if (trip.gradeMax) {
      stats.push(`Up to ${trip.gradeMax}`)
    }
  }

  if (trip.activityType === 'hiking') {
    if (typeof trip.distanceMi === 'number') {
      stats.push(formatMiles(trip.distanceMi))
    }
    if (typeof trip.elevationFt === 'number') {
      stats.push(`${trip.elevationFt.toLocaleString()} ft gain`)
    }
  }

  if (trip.activityType === 'backpacking') {
    if (typeof trip.distanceMi === 'number') {
      stats.push(formatMiles(trip.distanceMi))
    }
    if (typeof trip.nights === 'number') {
      stats.push(`${trip.nights} night${trip.nights === 1 ? '' : 's'}`)
    }
  }

  if (trip.activityType === 'camping') {
    if (typeof trip.nights === 'number') {
      stats.push(`${trip.nights} night${trip.nights === 1 ? '' : 's'}`)
    }
    if (trip.campStyle) {
      stats.push(trip.campStyle)
    }
  }

  if (!stats.length) {
    return null
  }

  return (
    <p className="text-sm text-muted-foreground">
      {stats.slice(0, 3).join(' • ')}
    </p>
  )
}
