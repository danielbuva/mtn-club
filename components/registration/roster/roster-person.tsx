'use client'

import { ChevronDown, EyeOff } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { PersonAvatar } from '@/components/trips/detail/person-avatar'
import { type RosterRow, rosterNames } from '@/lib/registration/roster-status'
import { cn } from '@/lib/utils'
import { RosterStatusTag } from './roster-status-tag'

export function RosterPerson({
  row,
  children,
}: {
  row: RosterRow
  /** Expanded content: details, and on the manage page, organizer actions. */
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const itemRef = useRef<HTMLLIElement>(null)
  useEffect(() => {
    if (open)
      itemRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [open])
  const todo = row.requirements.length
  const names = rosterNames(row)
  const subtitle = names.secondary
  return (
    <li
      ref={itemRef}
      className="scroll-mt-40 border-b border-border last:border-b-0"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(value => !value)}
        className={cn(
          'grid min-h-14 w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-secondary/40 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground sm:px-4',
          open && 'bg-secondary/30',
        )}
      >
        <PersonAvatar name={names.primary} src={row.avatarUrl} />
        <span className="min-w-0">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[15px] font-medium leading-5">
              {names.primary}
            </span>
            {row.showInAttendeeList ? null : (
              <span
                title="Hidden from the member attendee list"
                className="shrink-0"
              >
                <EyeOff
                  aria-hidden="true"
                  className="size-3.5 text-muted-foreground"
                />
                <span className="sr-only">
                  Hidden from the member attendee list
                </span>
              </span>
            )}
          </span>
          {subtitle || todo ? (
            <span className="block truncate text-[13px] leading-5 text-muted-foreground">
              {subtitle}
              {todo ? (
                <span className="font-medium text-foreground">
                  {subtitle ? ' · ' : ''}
                  {todo} to-do{todo === 1 ? '' : 's'}
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
        <span className="flex items-center gap-2">
          <RosterStatusTag state={row.state} />
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-4 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
          />
        </span>
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="space-y-4 pt-1 pr-3 pb-3 pl-14 sm:pr-4 sm:pl-[3.75rem]"
      >
        {open ? children : null}
      </div>
    </li>
  )
}
