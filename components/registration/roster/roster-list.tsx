'use client'

import { EyeOff, Search } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import {
  matchesRosterSearch,
  type RosterGroup,
  type RosterRow,
  rosterGroups,
  rosterState,
  sortRoster,
} from '@/lib/registration/roster-status'
import type { RegistrationRoster } from '@/lib/registration/schema'
import { cn } from '@/lib/utils'
import { RosterDetails } from './roster-details'
import { RosterPerson } from './roster-person'

type Filter = 'all' | RosterGroup

export function RosterList({
  roster,
  renderActions,
  className,
  stickyControls = false,
}: {
  roster: RegistrationRoster
  renderActions?: (row: RosterRow) => ReactNode
  className?: string
  /** Pin filters and search while the list scrolls (side sheet). */
  stickyControls?: boolean
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const sorted = sortRoster(roster.rows)
  const counts = new Map<RosterGroup, number>()
  for (const row of sorted) {
    const group = rosterState(row.state).group
    counts.set(group, (counts.get(group) ?? 0) + 1)
  }
  const hiddenCount = sorted.filter(row => !row.showInAttendeeList).length
  const waitlist = sorted.filter(row => row.state === 'waitlisted')
  const rows = sorted.filter(
    row =>
      (filter === 'all' || rosterState(row.state).group === filter) &&
      matchesRosterSearch(row, query),
  )
  const filters: Array<{ id: Filter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: sorted.length },
    ...rosterGroups
      .map(group => ({ ...group, count: counts.get(group.id) ?? 0 }))
      .filter(group => group.count > 0 || group.id === 'going'),
  ]

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'space-y-2.5',
          stickyControls &&
            'sticky top-0 z-10 -mx-4 border-b border-border bg-background px-4 pt-3 pb-3 sm:-mx-5 sm:px-5',
        )}
      >
        <fieldset
          className={cn(
            'flex min-w-0 gap-1.5',
            stickyControls
              ? 'mr-9 overflow-x-auto [mask-image:linear-gradient(to_right,#000_85%,transparent)] pr-6 [scrollbar-width:none]'
              : 'flex-wrap',
          )}
        >
          <legend className="sr-only">Filter by status</legend>
          {filters.map(item => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                'inline-flex min-h-9 shrink-0 items-center gap-1.5 border px-3 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground',
                filter === item.id
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground/60',
              )}
            >
              {item.label}
              <span className="tabular-nums opacity-70">{item.count}</span>
            </button>
          ))}
        </fieldset>
        <label className="relative block">
          <span className="sr-only">Search by name, Discord, or email</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search name, Discord, or email"
            className="h-10 w-full border border-input bg-background pr-3 pl-9 text-[15px] placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-foreground"
          />
        </label>
      </div>
      {hiddenCount ? (
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <EyeOff aria-hidden="true" className="size-3.5" />
          Hidden from the member attendee list ({hiddenCount})
        </p>
      ) : null}
      {rows.length ? (
        <ul className="border border-border bg-card">
          {rows.map(row => (
            <RosterPerson key={row.userId} row={row}>
              <RosterDetails
                row={row}
                snapshot={roster.snapshot}
                waitlistPosition={
                  row.state === 'waitlisted'
                    ? waitlist.findIndex(item => item.userId === row.userId) + 1
                    : undefined
                }
              />
              {renderActions ? renderActions(row) : null}
            </RosterPerson>
          ))}
        </ul>
      ) : (
        <p className="border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {sorted.length
            ? 'No one matches. Try another name or clear the filter.'
            : 'No one has registered yet.'}
        </p>
      )}
    </div>
  )
}
