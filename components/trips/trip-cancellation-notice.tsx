import { CircleX } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TripCancellationNotice({
  reason,
  inverse = false,
}: {
  reason?: string | null
  inverse?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 border border-rose-500/30 bg-rose-500/10 p-4',
        inverse ? 'text-rose-200' : 'text-rose-900 dark:text-rose-200',
      )}
    >
      <CircleX className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">Canceled</p>
        <p className="mt-1 text-sm">
          {reason || 'This trip is no longer taking place.'}
        </p>
      </div>
    </div>
  )
}
