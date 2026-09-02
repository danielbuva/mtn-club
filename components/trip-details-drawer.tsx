'use client'

import { Calendar, Clock, MapPin, MessageCircle, Users, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DISCORD_INVITE_URL } from '@/lib/constants'
import { formatDateRange } from '@/lib/events/formatters'
import type { CalendarTrip } from '@/lib/events/types'

interface TripDetailsDrawerProps {
  trip: CalendarTrip | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TripDetailsDrawer({
  trip,
  open,
  onOpenChange,
}: TripDetailsDrawerProps) {
  if (!trip) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-lg"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-background/90 p-2 transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>

          <div className="border-b border-border bg-linear-to-br from-primary/15 via-secondary to-background px-6 pb-8 pt-16">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {trip.isOfficial ? 'Official club schedule' : 'Community event'}
            </p>
            <SheetHeader className="mt-3 p-0 text-left">
              <SheetTitle className="pr-10 text-3xl font-bold leading-tight text-balance">
                {trip.title}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-5 flex flex-wrap gap-2">
              {trip.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="capitalize">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-7 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail icon={Calendar} label="Date">
                {formatDateRange(trip.dateStart, trip.dateEnd)}
              </Detail>
              <Detail icon={Clock} label="Time">
                {trip.isAllDay
                  ? 'Exact time announced in Discord'
                  : (trip.meetingTime ?? 'Announced in Discord')}
              </Detail>
              <Detail icon={MapPin} label="Public location">
                {trip.meetingLocation}
              </Detail>
              {trip.hosts.length > 0 && (
                <Detail
                  icon={Users}
                  label={trip.hosts.length === 1 ? 'Host' : 'Hosts'}
                >
                  {trip.hosts.map(host => (
                    <span key={`${host.name}:${host.title}`} className="block">
                      {host.name} — {host.title}
                    </span>
                  ))}
                </Detail>
              )}
            </div>

            <section>
              <h3 className="font-semibold">What is public now</h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                {trip.description}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                RSVP instructions, exact meetup points, gear requirements, and
                day-of changes are shared in Discord or protected trip details.
              </p>
            </section>

            {DISCORD_INVITE_URL && (
              <Button size="lg" className="w-full rounded-xl gap-2" asChild>
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Open Discord for logistics
                </a>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Calendar
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl bg-secondary p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-2 text-sm font-medium leading-6">{children}</div>
    </div>
  )
}
