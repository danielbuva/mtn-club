import type { TripDetail } from './types'

/** Evaluate outside cached scopes so archive status follows the request time. */
export function isTripPast(
  trip: Pick<TripDetail, 'lifecycleStatus' | 'startAt' | 'endAt'>,
  now: number | Date,
): boolean {
  return (
    trip.lifecycleStatus === 'archived' ||
    (trip.endAt ?? trip.startAt).getTime() < Number(now)
  )
}
