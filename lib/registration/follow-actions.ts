'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export async function setTripFollowing(tripId: string, following: boolean) {
  const input = z
    .object({ tripId: z.string().uuid(), following: z.boolean() })
    .safeParse({ tripId, following })
  if (!input.success) return { error: 'Check the trip and try again.' }
  const db = await createClient()
  const { error } = await db.rpc('set_trip_update_following', {
    p_trip_id: input.data.tripId,
    p_following: input.data.following,
  })
  if (error)
    return {
      error:
        error.code === 'P0001'
          ? error.message
          : 'Could not save your choice. Please try again.',
    }
  revalidatePath(`/trips/${tripId}`)
  return { following }
}
