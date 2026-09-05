import Link from 'next/link'
import { ManageRegistrationAlertDialog } from '@/components/registration/manage-registration-dialog'
import { RsvpChoices } from '@/components/registration/rsvp-choices'
import { Button } from '@/components/ui/button'
import type { TripRegistrationSnapshot } from '@/lib/registration/schema'
import type { TripStatus } from '@/lib/trips/types'
import { cn } from '@/lib/utils'

export function TripCTA({
  trip,
  className,
  expandable = false,
  onExpandedChange,
}: {
  trip: {
    id: string
    status?: TripStatus
    registrationState?: TripRegistrationSnapshot['state']
    registrationActionRequired?: boolean
  }
  className?: string
  expandable?: boolean
  onExpandedChange?: (expanded: boolean) => void
}) {
  if (trip.status === 'cancelled') return null
  if (trip.registrationState === 'confirmed') {
    if (trip.registrationActionRequired)
      return (
        <Button asChild size="sm" className={cn('w-full', className)}>
          <Link href={`/trips/${trip.id}/rsvp`}>Finish setup</Link>
        </Button>
      )
    return (
      <ManageRegistrationAlertDialog
        tripId={trip.id}
        className={cn('w-full', className)}
      />
    )
  }
  if (trip.status === 'closed' || trip.status === 'full') {
    return (
      <p
        className={cn(
          'flex min-h-9 w-full items-center justify-center border border-border bg-muted px-3 py-2 text-center text-xs font-medium text-muted-foreground',
          className,
        )}
      >
        {trip.status === 'full' ? 'Trip full' : 'Registration closed'}
      </p>
    )
  }
  if (
    expandable &&
    (!trip.registrationState ||
      ['none', 'maybe', 'cancelled'].includes(trip.registrationState))
  ) {
    return (
      <RsvpChoices
        tripId={trip.id}
        state={trip.registrationState}
        className={className}
        onExpandedChange={onExpandedChange}
      />
    )
  }
  const label =
    trip.registrationState === 'incomplete'
      ? 'Finish setup'
      : trip.registrationState === 'waitlisted'
        ? 'Waitlisted'
        : trip.registrationState === 'offered'
          ? 'View seat offer'
          : trip.registrationState === 'maybe'
            ? 'Maybe'
            : 'RSVP'
  return (
    <Button asChild size="sm" className={cn('w-full', className)}>
      <Link href={`/trips/${trip.id}/rsvp`}>{label}</Link>
    </Button>
  )
}
