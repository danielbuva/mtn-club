import { Badge } from '@/components/ui/badge'
import type { TripStatus } from '@/lib/trips/types'

type TripStatusBadgeProps = {
  status: TripStatus
}

const statusMap: Record<TripStatus, { label: string; className: string }> = {
  open: {
    label: 'RSVP Open',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  },
  waitlist: {
    label: 'Waitlist',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  },
  full: {
    label: 'Full',
    className: 'border-slate-500/30 bg-slate-500/10 text-slate-700',
  },
  members_only: {
    label: 'Members only',
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-700',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'border-rose-500/30 bg-rose-500/10 text-rose-700',
  },
}

export function TripStatusBadge({ status }: TripStatusBadgeProps) {
  if (status === 'open') {
    return null
  }

  const meta = statusMap[status]
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}
