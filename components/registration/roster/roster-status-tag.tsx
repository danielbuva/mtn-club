import {
  type RosterState,
  type RosterTone,
  rosterState,
} from '@/lib/registration/roster-status'
import { cn } from '@/lib/utils'

const toneClass: Record<RosterTone, string> = {
  going: 'border-[#211d18] bg-[var(--editorial-highlight)] text-[#211d18]',
  action: 'border-foreground bg-foreground text-background',
  queued: 'border-foreground/70 text-foreground',
  pending: 'border-dashed border-foreground/70 text-foreground',
  inactive: 'border-border text-muted-foreground',
  removed:
    'border-[#b00000] text-[#b00000] dark:border-[#ff8a80] dark:text-[#ff8a80]',
}

export function RosterStatusTag({
  state,
  className,
}: {
  state: RosterState
  className?: string
}) {
  const { label, tone } = rosterState(state)
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center border px-2 font-brand text-[12px] font-bold uppercase tracking-[0.08em] whitespace-nowrap',
        toneClass[tone],
        className,
      )}
    >
      {label}
    </span>
  )
}
