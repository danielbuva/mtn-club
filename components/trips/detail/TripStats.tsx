import type { TripDetail } from '@/lib/trips/types'

type TripStatsProps = {
  trip: TripDetail
}

const fmtMiles = (miles: number) =>
  `${miles.toFixed(miles % 1 === 0 ? 0 : 1)} mi`

export function TripStats({ trip }: TripStatsProps) {
  const stats: string[] = []

  if (trip.activityType === 'climbing') {
    if (trip.climbStyle) stats.push(trip.climbStyle)
    if (trip.gradeMin && trip.gradeMax)
      stats.push(`${trip.gradeMin}-${trip.gradeMax}`)
  }

  if (trip.activityType === 'hiking') {
    if (typeof trip.distanceMi === 'number')
      stats.push(fmtMiles(trip.distanceMi))
    if (typeof trip.elevationFt === 'number')
      stats.push(`${trip.elevationFt.toLocaleString()} ft gain`)
  }

  if (trip.activityType === 'backpacking') {
    if (typeof trip.distanceMi === 'number')
      stats.push(fmtMiles(trip.distanceMi))
    if (typeof trip.nights === 'number')
      stats.push(`${trip.nights} night${trip.nights === 1 ? '' : 's'}`)
  }

  if (trip.activityType === 'camping') {
    if (typeof trip.nights === 'number')
      stats.push(`${trip.nights} night${trip.nights === 1 ? '' : 's'}`)
    if (trip.campStyle) stats.push(trip.campStyle)
  }

  if (!stats.length) return null

  return (
    <section className="space-y-2 rounded-2xl border border-border/70 bg-card p-4 md:p-5">
      <h2 className="text-lg font-semibold">Stats</h2>
      <p className="text-sm text-muted-foreground">{stats.join(' • ')}</p>
    </section>
  )
}
