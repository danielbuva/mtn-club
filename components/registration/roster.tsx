'use client'

import { RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { RegistrationRoster } from '@/lib/registration/schema'
import { RosterActions } from './roster/roster-actions'
import { RosterList } from './roster/roster-list'
import { SettingsEditor } from './settings-editor'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="font-brand text-2xl font-bold leading-none tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

export function RegistrationRosterView({
  roster,
}: {
  roster: RegistrationRoster
}) {
  const router = useRouter()
  const [refreshing, startRefresh] = useTransition()
  const [refreshed, setRefreshed] = useState(false)
  const { snapshot } = roster
  const unfinished = roster.rows.filter(
    row => row.state === 'incomplete',
  ).length
  const capacity = roster.trip.capacity
  return (
    <div data-trip-surface className="space-y-6">
      <div className="space-y-3">
        <Link
          href={`/trips/${snapshot.tripId}`}
          className="inline-flex min-h-9 items-center text-sm underline underline-offset-4"
        >
          ← Back to trip page
        </Link>
        <p className="font-brand text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Manage registration
        </p>
        <h1 className="text-balance font-brand text-4xl font-bold uppercase leading-[0.95] tracking-tight md:text-5xl">
          {snapshot.title}
        </h1>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-border border-2 border-foreground sm:grid-cols-4 sm:divide-y-0">
        <Stat
          label={capacity ? `Going of ${capacity}` : 'Going'}
          value={String(snapshot.confirmedCount)}
        />
        <Stat label="Seats offered" value={String(snapshot.reservedCount)} />
        <Stat label="Waitlist" value={String(snapshot.waitlistCount)} />
        <Stat label="Unfinished" value={String(unfinished)} />
      </div>
      <Tabs defaultValue="attendees" className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="h-10 gap-5 rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="attendees"
              className="-mb-px h-10 flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 text-[15px] data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent"
            >
              Attendees · {roster.rows.length}
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="-mb-px h-10 flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 text-[15px] data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent"
            >
              Settings
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="shadow-none"
              disabled={refreshing}
              onClick={() =>
                startRefresh(() => {
                  router.refresh()
                  setRefreshed(true)
                })
              }
            >
              <RefreshCw
                aria-hidden="true"
                className={refreshing ? 'animate-spin' : undefined}
              />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
            <output
              className="text-xs text-muted-foreground empty:hidden"
              aria-live="polite"
            >
              {refreshed && !refreshing ? 'Up to date' : ''}
            </output>
            <Button asChild variant="outline" size="sm" className="shadow-none">
              <a href={`/trips/${snapshot.tripId}/registrations/export`}>
                Download CSV
              </a>
            </Button>
          </div>
        </div>
        <TabsContent value="attendees">
          <RosterList
            roster={roster}
            renderActions={row => (
              <RosterActions row={row} snapshot={snapshot} />
            )}
          />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsEditor key={roster.settings.revision} roster={roster} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
