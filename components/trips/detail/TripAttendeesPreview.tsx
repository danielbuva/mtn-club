import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { TripDetail } from '@/lib/trips/types'

type TripAttendeesPreviewProps = {
  attendees: NonNullable<TripDetail['attendees']>
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function TripAttendeesPreview({ attendees }: TripAttendeesPreviewProps) {
  const preview = attendees.slice(0, 8)
  const overflow = Math.max(attendees.length - preview.length, 0)

  return (
    <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 md:p-5">
      <h2 className="text-lg font-semibold">Attendees</h2>
      {preview.length ? (
        <>
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-transparent"
          >
            View all attendees
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No attendees yet.</p>
      )}
    </section>
  )
}
