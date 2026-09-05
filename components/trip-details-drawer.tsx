'use client'

import {
  Calendar,
  ChevronDown,
  Clock,
  MapPin,
  MessageCircle,
  Users,
  X,
} from 'lucide-react'
import {
  CATEGORY_COLORS,
  type CalendarCategoryKey,
  getTagCategory,
  getTripCategories,
} from '@/components/calendar/calendar-categories'
import { TripCancellationNotice } from '@/components/trips/trip-cancellation-notice'
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
import { cn } from '@/lib/utils'

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
  const primaryCategory = getTripCategories(trip)[0]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full overflow-y-auto p-0 sm:max-w-lg"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center border border-border bg-secondary transition-colors hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>

          <div className="border-b border-border bg-background px-6 pb-7 pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {trip.isOfficial ? 'Official club schedule' : 'Community event'}
            </p>
            <SheetHeader className="mt-3 p-0 text-left">
              <SheetTitle className="pr-10 text-3xl font-bold leading-tight text-balance">
                {trip.title}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-5 flex flex-wrap gap-2">
              {trip.tags.map(tag => {
                const category = getTagCategory(tag)
                const colorCategory =
                  category === 'other' ? primaryCategory : category
                return (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={cn(
                      'rounded-full border-transparent capitalize shadow-none',
                      CATEGORY_COLORS[colorCategory],
                      CATEGORY_TEXT_COLORS[colorCategory],
                    )}
                  >
                    {tag}
                  </Badge>
                )
              })}
            </div>
          </div>

          <div className="space-y-7 p-6">
            {trip.lifecycleStatus === 'canceled' && (
              <TripCancellationNotice reason={trip.cancellationReason} />
            )}
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

            <details className="group border-y border-border">
              <summary className="flex min-h-12 list-none items-center justify-between gap-4 py-3 font-semibold outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
                More Info
                <ChevronDown
                  className="size-4 shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="pb-5">
                <p className="leading-7 text-muted-foreground">
                  {trip.description}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  RSVP instructions, exact meetup points, gear requirements, and
                  day-of changes are shared in Discord or protected trip
                  details.
                </p>
              </div>
            </details>

            {DISCORD_INVITE_URL && (
              <Button size="lg" className="w-full rounded-none gap-2" asChild>
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
    <div className="bg-secondary p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-2 text-sm font-medium leading-6">{children}</div>
    </div>
  )
}

const CATEGORY_TEXT_COLORS: Record<CalendarCategoryKey, string> = {
  hike: 'text-white',
  climb: 'text-white',
  snow: 'text-slate-950',
  camp: 'text-slate-950',
  run: 'text-slate-950',
  social: 'text-slate-950',
  other: 'text-white',
}
