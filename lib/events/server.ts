import { endOfMonth, startOfMonth } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { eventToCalendarTrip } from '@/lib/events/mappers'
import { fetchEventsInRange, fetchPastTrips, fetchTripTeasersInRange } from '@/lib/events/queries'
import type { CalendarTrip, TripTeaserDay } from '@/lib/events/types'
import { connection } from 'next/server'

type CalendarDataParams = {
  currentDate: Date
  clubId: string | null
  isMemberOrLeader: boolean
}

export type CalendarData = {
  trips: CalendarTrip[]
  teasers: TripTeaserDay[]
}

export async function getCalendarData({
  currentDate,
  clubId,
  isMemberOrLeader,
}: CalendarDataParams): Promise<CalendarData> {
  connection()
  const supabase = await createClient()

  const range = {
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  }

  const tripsPromise = isMemberOrLeader
    ? fetchEventsInRange(supabase, range).then((events) => events.map(eventToCalendarTrip))
    : Promise.resolve<CalendarTrip[]>([])

  const teasersPromise = clubId
    ? fetchTripTeasersInRange(supabase, clubId, range)
    : Promise.resolve<TripTeaserDay[]>([])

  const [trips, teasers] = await Promise.all([tripsPromise, teasersPromise])

  return { trips, teasers }
}

export async function getPastTrips(options?: { limit?: number }): Promise<CalendarTrip[]> {
  connection()
  const supabase = await createClient()
  const events = await fetchPastTrips(supabase, options)
  return events.map(eventToCalendarTrip)
}
