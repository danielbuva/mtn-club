import { endOfMonth, startOfMonth } from 'date-fns'
import { CalendarUpcomingHydrator } from '@/components/calendar/calendar-upcoming-hydrator'
import { getViewer } from '@/lib/auth/viewer'
import { eventToCalendarTrip } from '@/lib/events/mappers'
import { fetchUpcomingTripsInRangeMember } from '@/lib/events/queries'
import { createClient } from '@/lib/supabase/server'

type CalendarUpcomingTripsProps = {
  currentMonth: string
}

const resolveMonthDate = (monthValue: string): Date => {
  const match = /^(\d{4})-(\d{2})$/.exec(monthValue)
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

export async function CalendarUpcomingTrips({ currentMonth }: CalendarUpcomingTripsProps) {
  const viewer = await getViewer()
  if (!viewer.isMember) {
    return null
  }

  const supabase = await createClient()
  const monthDate = resolveMonthDate(currentMonth)
  const range = {
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  }

  const events = await fetchUpcomingTripsInRangeMember(supabase, range)
  if (!events.length) {
    return null
  }

  const trips = events.map(eventToCalendarTrip)

  return <CalendarUpcomingHydrator trips={trips} />
}
