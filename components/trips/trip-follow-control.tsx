import { FollowTripButton } from '@/components/trips/follow-trip-button'
import { createClient } from '@/lib/supabase/server'

export async function TripFollowControl({ tripId }: { tripId: string }) {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()
  const result = user
    ? await db
        .from('trip_update_followers')
        .select('trip_id')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null, error: null }
  if (result.error)
    return (
      <p role="alert" className="text-sm text-muted-foreground">
        Trip email preferences could not be loaded. Refresh to try again.
      </p>
    )
  return (
    <FollowTripButton
      tripId={tripId}
      following={Boolean(result.data)}
      authenticated={Boolean(user)}
    />
  )
}
