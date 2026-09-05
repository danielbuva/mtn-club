import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { TripDetail } from '@/lib/trips/types'

type TripAttendeesPreviewProps = {
  attendees: NonNullable<TripDetail['attendees']>
  totalCount: number
  canView: boolean
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function TripAttendeesPreview({
  attendees,
  totalCount,
  canView,
}: TripAttendeesPreviewProps) {
  const preview = attendees.slice(0, 8)
  const overflow = Math.max(attendees.length - preview.length, 0)

  return (
    <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 md:p-5">
      <h2 className="text-lg font-semibold">Attendees</h2>
      {preview.length ? (
        <>
          <p className="text-sm text-muted-foreground">
            {totalCount} confirmed. Only people who opted in are shown.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {preview.map(attendee => (
              <Avatar
                key={attendee.userId}
                className="h-9 w-9 border border-border/70"
              >
                {attendee.avatarUrl ? (
                  <AvatarImage src={attendee.avatarUrl} alt={attendee.name} />
                ) : null}
                <AvatarFallback>{initials(attendee.name)}</AvatarFallback>
              </Avatar>
            ))}
            {overflow > 0 ? (
              <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                +{overflow}
              </span>
            ) : null}
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer underline">
              View participant names
            </summary>
            <ul className="mt-2 space-y-1">
              {attendees.map(person => (
                <li key={person.userId}>{person.name}</li>
              ))}
            </ul>
          </details>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {totalCount === 0
            ? 'No confirmed attendees yet.'
            : canView
              ? `${totalCount} confirmed. No visible profiles to show.`
              : `${totalCount} confirmed. Participant names are visible to confirmed participants and organizers.`}
        </p>
      )}
    </section>
  )
}
