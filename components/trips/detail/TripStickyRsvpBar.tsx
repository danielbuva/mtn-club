'use client'

import { useRouter } from 'next/navigation'
import { TripCTA } from '@/components/trips/TripCTA'
import { TripStatusBadge } from '@/components/trips/TripStatusBadge'
import { Button } from '@/components/ui/button'
import type { TripDetail } from '@/lib/trips/types'

type TripStickyRsvpBarProps = {
  trip: Pick<
    TripDetail,
    | 'id'
    | 'status'
    | 'capacity'
    | 'rsvpCount'
    | 'waitlistEnabled'
    | 'viewerRsvpStatus'
    | 'visibility'
  >
  viewer: {
    isAuthenticated: boolean
    isMember: boolean
  }
}

export function TripStickyRsvpBar({ trip, viewer }: TripStickyRsvpBarProps) {
  const router = useRouter()
  const needsMembership = trip.visibility !== 'public'

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 p-3 backdrop-blur md:sticky md:top-20 md:rounded-2xl md:border md:p-4">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:max-w-none">
        <TripStatusBadge status={trip.status} />

        {!viewer.isAuthenticated ? (
          <Button
            onClick={() =>
              router.push(
                `/auth/login?returnTo=${encodeURIComponent(`/trips/${trip.id}`)}`,
              )
            }
          >
            Sign in to RSVP
          </Button>
        ) : null}

        {viewer.isAuthenticated && needsMembership && !viewer.isMember ? (
          <Button onClick={() => router.push('/membership')}>
            Become a member
          </Button>
        ) : null}

        {viewer.isAuthenticated && (!needsMembership || viewer.isMember) ? (
          <TripCTA
            trip={{
              id: trip.id,
              status: trip.status,
              rsvpCount: trip.rsvpCount,
              capacity: trip.capacity,
              waitlistEnabled: trip.waitlistEnabled,
              currentUserRsvp: trip.viewerRsvpStatus ?? null,
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
