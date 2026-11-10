import type { TripStatus } from '@/lib/trips/types'

const labels: Record<TripStatus, string> = {
  closed: 'Registration closed',
  open: 'RSVP open',
  waitlist: 'Waitlist',
  full: 'Full',
  members_only: 'Members only',
  cancelled: 'Canceled',
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  if (status === 'open') return null
  return (
    <span className="inline-block border border-foreground bg-background px-2 py-1 font-brand text-[13px] uppercase tracking-[0.14em] text-foreground">
      {labels[status]}
    </span>
  )
}
