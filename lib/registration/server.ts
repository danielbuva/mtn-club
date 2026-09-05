import 'server-only'
import { z } from 'zod'
import { rosterSchema, snapshotSchema } from '@/lib/registration/schema'
import { createClient } from '@/lib/supabase/server'

export async function getRegistration(tripId: string) {
  const id = z.string().uuid().parse(tripId)
  const db = await createClient()
  const { data, error } = await db.rpc('get_trip_registration', {
    p_trip_id: id,
  })
  if (error)
    throw new Error(
      'Registration could not be loaded. Please refresh or contact the club.',
    )
  return snapshotSchema.parse(data)
}
export async function getRoster(tripId: string) {
  const id = z.string().uuid().parse(tripId)
  const db = await createClient()
  const { data, error } = await db.rpc('get_registration_roster', {
    p_trip_id: id,
  })
  if (error)
    throw new Error(
      'The roster is unavailable or you do not have permission to manage this trip.',
    )
  return rosterSchema.parse(data)
}
export async function getMyRegistrations() {
  const db = await createClient()
  const { data, error } = await db.rpc('get_my_registrations')
  if (error)
    throw new Error('Your registrations could not be loaded. Please try again.')
  return z.array(snapshotSchema).parse(data)
}
export async function getRegistrationSummaries(tripIds: string[]) {
  if (!tripIds.length) return []
  const db = await createClient()
  const { data, error } = await db.rpc('get_registration_summaries', {
    p_trip_ids: tripIds,
  })
  if (error)
    throw new Error(
      'Registration counts are temporarily unavailable. Please refresh.',
    )
  return z
    .array(
      snapshotSchema.pick({
        tripId: true,
        confirmedCount: true,
        reservedCount: true,
        availability: true,
        state: true,
        requirements: true,
      }),
    )
    .parse(data)
}
