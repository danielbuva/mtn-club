import Link from 'next/link'
import type { MembershipTab } from '@/lib/admin/membership-queue'
import { cn } from '@/lib/utils'

const views = [
  { value: 'review', label: 'Membership review' },
  { value: 'members', label: 'Active members' },
  { value: 'exceptions', label: 'Exceptions' },
  { value: 'archive', label: 'Archive' },
] satisfies { value: MembershipTab; label: string }[]

export function MembershipTabs({
  tab,
  counts,
}: {
  tab: MembershipTab
  counts: Record<MembershipTab, number>
}) {
  return (
    <nav
      aria-label="Membership views"
      className="mt-8 grid grid-cols-2 border-b border-border sm:flex sm:flex-wrap"
    >
      {views.map(({ value, label }) => (
        <Link
          key={value}
          href={`/admin/membership?tab=${value}`}
          aria-current={value === tab ? 'page' : undefined}
          className={cn(
            'inline-flex min-h-12 items-center gap-2 border-b-2 border-transparent px-4 text-sm font-medium',
            value === tab && 'border-foreground',
          )}
        >
          {label}
          <span className="rounded-full bg-secondary px-2 text-xs tabular-nums">
            {counts[value]}
          </span>
        </Link>
      ))}
    </nav>
  )
}
