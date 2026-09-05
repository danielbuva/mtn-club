import Link from 'next/link'
import { TripBottomControls } from '@/components/trips/trip-bottom-controls'
import { Button } from '@/components/ui/button'
import type { TripDetail } from '@/lib/trips/types'

type TripStickyRsvpBarProps = {
  trip: Pick<TripDetail, 'id' | 'status'>
  viewer: {
    isAuthenticated: boolean
    isMember: boolean
  }
}

export function TripStickyRsvpBar({ trip }: TripStickyRsvpBarProps) {
  return (
    <TripBottomControls fallbackHref="/trips">
      {trip.status === 'cancelled' ? (
        <span className="px-4 text-sm font-semibold">Trip canceled</span>
      ) : (
        <Button
          asChild
          size="sm"
          className="rounded-full px-4 text-xs whitespace-nowrap"
        >
          <Link href={`/trips/${trip.id}/rsvp`}>RSVP</Link>
        </Button>
      )}
    </TripBottomControls>
  )
}
