'use client'

import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAdminViewer } from '../admin-view-frame'
import {
  roleCardClass,
  roleSummaryClass,
  rosterCardClass,
  rosterLabelClass,
} from '../leadership-styles'
import { LoadingValue } from './primitives'

function RosterField({
  label,
  select = false,
  fullWidth = false,
}: {
  label: string
  select?: boolean
  fullWidth?: boolean
}) {
  return (
    <div className={cn(rosterLabelClass, fullWidth && 'sm:col-span-2')}>
      {label}
      <div
        className={cn(
          'mt-1 flex w-full items-center border border-input px-3',
          select
            ? 'h-10 justify-between bg-background'
            : 'h-9 bg-transparent py-1',
        )}
      >
        <LoadingValue className="h-3 w-2/3" />
        {select ? <ChevronDown className="size-4" aria-hidden="true" /> : null}
      </div>
    </div>
  )
}

export function LeadershipLoading() {
  const viewer = useAdminViewer()
  return (
    <>
      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-brand text-3xl uppercase">Active roster</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Public names stay separate from accounts until an officer signs
              up.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {[0, 1].map(row => (
            <div key={row} className={rosterCardClass}>
              <RosterField label="Public name" />
              <RosterField label="Title" />
              <RosterField label="Role" select />
              <RosterField label="Display order" />
              <RosterField label="Linked account" select fullWidth />
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled
                  aria-label="Show on public roster"
                />{' '}
                Show on public roster
              </div>
              {!viewer || viewer.isSuperAdmin ? (
                <Button type="button" size="sm" disabled>
                  Save roster entry
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </section>
      <section className="mt-12">
        <h2 className="font-brand text-3xl uppercase">Role permissions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Multiple roles combine; the most permissive scope wins. Protected
          super-admin powers are not delegable here.
        </p>
        <div className="mt-5 space-y-5">
          {[0, 1, 2].map(row => (
            <div key={row} className={roleCardClass}>
              <div className={roleSummaryClass}>
                <LoadingValue className="h-6 w-48" />
                <span className="flex items-center gap-3">
                  <LoadingValue className="h-5 w-24 rounded-full" />
                  <ChevronDown className="size-4" aria-hidden="true" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
