'use client'

import { Users } from 'lucide-react'
import Link from 'next/link'
import { RosterList } from '@/components/registration/roster/roster-list'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { RegistrationRoster } from '@/lib/registration/schema'

export function AttendeeRosterSheet({
  roster,
}: {
  roster: RegistrationRoster
}) {
  const tripId = roster.snapshot.tripId
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-11 w-full justify-between shadow-none"
        >
          <span className="flex items-center gap-2">
            <Users aria-hidden="true" />
            All signups
          </span>
          <span className="tabular-nums text-muted-foreground">
            {roster.rows.length}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        data-trip-surface
        className="w-full gap-0 rounded-none bg-background sm:max-w-xl [&_*]:rounded-none"
      >
        <SheetHeader className="space-y-1 border-b border-border px-4 pt-5 pb-4 pr-12 sm:px-5">
          <p className="font-brand text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Organizer view
          </p>
          <SheetTitle className="font-brand text-2xl font-bold uppercase leading-none tracking-wide">
            All signups
          </SheetTitle>
          <SheetDescription className="text-sm">
            {roster.snapshot.title} · {roster.snapshot.confirmedCount} going
            {roster.snapshot.waitlistCount
              ? ` · ${roster.snapshot.waitlistCount} waiting`
              : ''}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-5">
          <RosterList roster={roster} stickyControls />
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-4 py-3 text-sm sm:px-5">
          <Link
            className="font-medium underline underline-offset-4"
            href={`/trips/${tripId}/registrations`}
          >
            Manage registration
          </Link>
          <a
            className="underline underline-offset-4"
            href={`/trips/${tripId}/registrations/export`}
          >
            Download CSV
          </a>
        </div>
      </SheetContent>
    </Sheet>
  )
}
