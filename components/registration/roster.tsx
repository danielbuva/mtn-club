'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { RegistrationRoster } from '@/lib/registration/schema'
import { RosterRow } from './roster-row'
import { SettingsEditor } from './settings-editor'

export function RegistrationRosterView({
  roster,
}: {
  roster: RegistrationRoster
}) {
  const [search, setSearch] = useState('')
  const router = useRouter()
  const [refreshing, startRefresh] = useTransition()
  const [filter, setFilter] = useState('all')
  const rows = roster.rows.filter(
    row =>
      (filter === 'all' || row.state === filter) &&
      row.name.toLowerCase().includes(search.toLowerCase()),
  )
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{roster.snapshot.title}</h2>
      <Button
        variant="outline"
        disabled={refreshing}
        onClick={() => startRefresh(() => router.refresh())}
      >
        {refreshing ? 'Refreshing…' : 'Refresh roster'}
      </Button>
      <p>
        {roster.snapshot.confirmedCount} confirmed ·{' '}
        {roster.snapshot.reservedCount} reserved ·{' '}
        {roster.snapshot.waitlistCount} waitlisted
      </p>
      <SettingsEditor key={roster.settings.revision} roster={roster} />
      <Link
        className="inline-block underline"
        href={`/trips/${roster.snapshot.tripId}/registrations/export`}
      >
        Export roster CSV
      </Link>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="roster-search">Search participants</Label>
          <Input
            id="roster-search"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="roster-filter">Registration status</Label>
          <select
            id="roster-filter"
            className="w-full rounded border bg-background p-2"
            value={filter}
            onChange={event => setFilter(event.target.value)}
          >
            {[
              'all',
              'confirmed',
              'waitlisted',
              'offered',
              'cancelled',
              'removed_by_organizer',
              'legacy_review',
              'none',
            ].map(state => (
              <option key={state} value={state}>
                {state === 'none'
                  ? 'Guardian review / not submitted'
                  : state.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>
      {rows.length ? (
        rows.map(row => (
          <RosterRow
            key={`${row.userId}-${row.revision}`}
            row={row}
            snapshot={roster.snapshot}
          />
        ))
      ) : (
        <p>No registrations match these filters.</p>
      )}
    </div>
  )
}
