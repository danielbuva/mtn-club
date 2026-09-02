import { WEEKLY_MEETUPS } from '@/lib/club-content'
import { cn } from '@/lib/utils'

type WeeklyMeetupNoteProps = {
  className?: string
}

export function WeeklyMeetupNote({ className }: WeeklyMeetupNoteProps) {
  return (
    <div className={cn('text-sm font-medium', className)}>
      <p>Meetups:</p>
      <p className="leading-6">
        {WEEKLY_MEETUPS.map((meetup, index) => (
          <span key={meetup.day}>
            {index > 0 ? ' · ' : null}
            {meetup.day} at {meetup.time} @{' '}
            {meetup.href ? (
              <a
                href={meetup.href}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-current/40 underline-offset-4 outline-none hover:decoration-current focus-visible:ring-2 focus-visible:ring-current"
              >
                {meetup.location}
              </a>
            ) : (
              meetup.location
            )}
          </span>
        ))}
      </p>
    </div>
  )
}
