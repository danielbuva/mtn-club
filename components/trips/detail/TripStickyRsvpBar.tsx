import { RsvpComingSoon } from '@/components/trips/rsvp-coming-soon'
import { TripStatusBadge } from '@/components/trips/TripStatusBadge'
import type { TripDetail } from '@/lib/trips/types'

type TripStickyRsvpBarProps = {
  trip: Pick<TripDetail, 'status'>
  viewer: {
    isAuthenticated: boolean
    isMember: boolean
  }
}

export function TripStickyRsvpBar({ trip }: TripStickyRsvpBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 p-3 backdrop-blur md:sticky md:top-20 md:border md:p-4">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:max-w-none">
        <TripStatusBadge status={trip.status} />
        <RsvpComingSoon />
      </div>
    </div>
  )
}
