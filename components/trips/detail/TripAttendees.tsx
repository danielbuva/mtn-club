import Link from 'next/link'
import type { ReactNode } from 'react'
import type { TripAttendee } from '@/lib/trips/types'
import { PersonAvatar } from './person-avatar'

const previewLimit = 12

type TripAttendeesProps = {
  tripId: string
  attendees: TripAttendee[]
  goingCount: number
  canView: boolean
  viewer: { isAuthenticated: boolean; isMember: boolean }
  canceled?: boolean
  /** Organizer-only entry point to the full attendee list. */
  organizerAction?: ReactNode
}

function AttendeeGrid({ people }: { people: TripAttendee[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-1">
      {people.map(person => (
        <li key={person.userId} className="flex min-w-0 items-center gap-2.5">
          <PersonAvatar
            name={person.name}
            src={person.avatarUrl}
            className="size-7"
          />
          <span className="truncate text-[15px]">{person.name}</span>
        </li>
      ))}
    </ul>
  )
}

function LockedMessage({
  tripId,
  viewer,
}: Pick<TripAttendeesProps, 'tripId' | 'viewer'>) {
  if (!viewer.isAuthenticated)
    return (
      <p className="text-[15px] leading-6 text-muted-foreground">
        Club members can see who’s going.{' '}
        <Link
          className="font-medium text-foreground underline underline-offset-4"
          href={`/auth/login?returnTo=${encodeURIComponent(`/trips/${tripId}`)}`}
        >
          Sign in
        </Link>{' '}
        to check.
      </p>
    )
  return (
    <p className="text-[15px] leading-6 text-muted-foreground">
      The list of who’s going is for club members.{' '}
      <Link
        className="font-medium text-foreground underline underline-offset-4"
        href="/membership"
      >
        Become a member
      </Link>{' '}
      to see it.
    </p>
  )
}

export function TripAttendees({
  tripId,
  attendees,
  goingCount,
  canView,
  viewer,
  canceled = false,
  organizerAction,
}: TripAttendeesProps) {
  const unlisted = Math.max(goingCount - attendees.length, 0)
  const preview = attendees.slice(0, previewLimit)
  const rest = attendees.slice(previewLimit)

  return (
    <section
      aria-labelledby="trip-attendees"
      className="space-y-4 border-t border-foreground/80 pt-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="trip-attendees"
          className="font-brand text-2xl font-bold uppercase leading-none tracking-wide"
        >
          {canceled ? 'Who was going' : 'Who’s going'}
        </h2>
        <p className="text-sm tabular-nums text-muted-foreground">
          {canceled ? `${goingCount} signed up` : `${goingCount} going`}
        </p>
      </div>

      {!canView ? (
        <LockedMessage tripId={tripId} viewer={viewer} />
      ) : goingCount === 0 ? (
        <p className="text-[15px] leading-6 text-muted-foreground">
          {canceled
            ? 'No one had signed up.'
            : 'No one has signed up yet. Be the first.'}
        </p>
      ) : (
        <div className="space-y-3">
          {preview.length ? <AttendeeGrid people={preview} /> : null}
          {rest.length ? (
            <details className="group">
              <summary className="inline-flex min-h-9 cursor-pointer list-none items-center text-sm font-medium underline underline-offset-4 [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">
                  Show all {attendees.length}
                </span>
                <span className="hidden group-open:inline">Show fewer</span>
              </summary>
              <div className="pt-2.5">
                <AttendeeGrid people={rest} />
              </div>
            </details>
          ) : null}
          {unlisted ? (
            <p className="text-sm leading-5 text-muted-foreground">
              {preview.length
                ? `+ ${unlisted} more who chose not to be listed.`
                : `${goingCount} going. Nobody has chosen to be listed yet.`}
            </p>
          ) : null}
        </div>
      )}

      {organizerAction ? (
        <div className="border-t border-border pt-4">{organizerAction}</div>
      ) : null}
    </section>
  )
}
