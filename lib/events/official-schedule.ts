import type { SupabaseClient } from '@supabase/supabase-js'
import { eventToCalendarTrip } from '@/lib/events/mappers'
import {
  fetchOfficialTrips,
  fetchPublicHostsByTrip,
} from '@/lib/events/queries'
import type { CalendarTrip } from '@/lib/events/types'
import type { Database } from '@/lib/supabase/types'

export async function getOfficialSchedule(
  client: SupabaseClient<Database>,
): Promise<CalendarTrip[]> {
  const events = await fetchOfficialTrips(client)
  const hostsByTrip = await fetchPublicHostsByTrip(
    client,
    events.map(event => event.id),
  )
  return events.map(event => ({
    ...eventToCalendarTrip(event),
    hosts: hostsByTrip.get(event.id) ?? [],
  }))
}
