import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { TripStatus } from '@/lib/trips/types'

export function TripCTA({
  trip,
}: {
  trip: { id: string; status?: TripStatus }
}) {
  if (trip.status === 'cancelled') return null
  return (
    <Button asChild size="sm" className="w-full">
      <Link href={`/trips/${trip.id}/rsvp`}>RSVP / registration</Link>
    </Button>
  )
}
