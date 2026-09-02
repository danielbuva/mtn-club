import { cn } from '@/lib/utils'

export function RsvpComingSoon({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'flex min-h-9 w-full items-center justify-center border border-border bg-muted px-3 py-2 text-center text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      RSVP feature coming soon
    </p>
  )
}
