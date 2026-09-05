import { cn } from '@/lib/utils'

export function TripCancellationNotice({
  reason,
  inverse = false,
}: {
  reason?: string | null
  inverse?: boolean
}) {
  const note = reason?.trim()
  const text = note
    ? /^cancel(?:l)?ed\b/i.test(note)
      ? note
      : `Canceled — ${note}`
    : 'Canceled — this trip is no longer taking place.'

  return (
    <p
      className={cn(
        'text-xs italic leading-relaxed',
        inverse ? 'text-[#E99C73]' : 'text-[#A1482D] dark:text-[#E99C73]',
      )}
    >
      {text}
    </p>
  )
}
