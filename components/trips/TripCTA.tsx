import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { TripStatus } from '@/lib/trips/types'

export function TripCTA({
  trip,
}: {
  trip: { id: string; status?: TripStatus }
}) {
  if (trip.status === 'cancelled')
    return (
      <Button asChild size="sm" variant="outline" className="w-full">
        <Link href={`/trips/${trip.id}`}>View canceled trip</Link>
      </Button>
    )
  return (
    <Button asChild size="sm" className="w-full">
      <Link href={`/trips/${trip.id}/rsvp`}>RSVP / registration</Link>
    </Button>
  )
}
