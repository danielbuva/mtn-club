import { getRoster } from '@/lib/registration/server'
import { AttendeeRosterSheet } from './attendee-roster-sheet'

export async function TripOrganizerRoster({ tripId }: { tripId: string }) {
  const roster = await getRoster(tripId).catch(() => null)
  if (!roster)
    return (
      <p role="alert" className="text-sm text-muted-foreground">
        The attendee list couldn’t load. Refresh the page, or open{' '}
        <a
          className="underline underline-offset-4"
          href={`/trips/${tripId}/registrations`}
        >
          Manage registration
        </a>
        .
      </p>
    )
  return <AttendeeRosterSheet roster={roster} />
}

export function TripOrganizerRosterFallback() {
  return (
    <output
      aria-label="Loading attendee list"
      className="block h-11 w-full animate-pulse border border-input bg-muted"
    />
  )
}
