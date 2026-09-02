'use client'

import { format } from 'date-fns'
import { CalendarDays, Clock3, MapPin, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { TripMetaRow } from '@/components/trips/TripMetaRow'
import { RsvpComingSoon } from '@/components/trips/rsvp-coming-soon'
import { TripStats } from '@/components/trips/TripStats'
import { TripStatusBadge } from '@/components/trips/TripStatusBadge'
import { DifficultyTag } from '@/components/trips/TripTags'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { TripListItem } from '@/lib/trips/types'

const getDateLabel = (startAt: Date, endAt?: Date) => {
  if (!endAt || format(startAt, 'yyyy-MM-dd') === format(endAt, 'yyyy-MM-dd')) {
    return format(startAt, 'MMM d')
  }
  return `${format(startAt, 'MMM d')}-${format(endAt, 'MMM d')}`
}

const getCapacityLabel = (trip: TripListItem) => {
  if (typeof trip.capacity !== 'number') {
    return null
  }

  if (typeof trip.rsvpCount === 'number') {
    const remaining = Math.max(trip.capacity - trip.rsvpCount, 0)
    return remaining > 0
      ? `${remaining} spots left`
      : `${trip.rsvpCount} / ${trip.capacity}`
  }

  return `${trip.capacity} spots`
}

const getLeaderInitials = (name?: string) => {
  if (!name) {
    return 'MC'
  }

  const parts = name.split(' ').filter(Boolean)
  const initials = parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? '')
  return initials.join('') || 'MC'
}

type TripCardProps = {
  trip: TripListItem
  viewMode?: 'grid' | 'list'
}

export function TripCard({ trip, viewMode = 'grid' }: TripCardProps) {
  const router = useRouter()
  const detailHref = trip.detailHref ?? `/trips/${trip.id}`
  const showImage = viewMode === 'grid' && Boolean(trip.heroImageUrl)
  const visibleTags = (trip.tags ?? trip.activityTags).filter(
    tag => tag.trim().toLowerCase() !== 'outdoor',
  )

  const metaItems = [
    { icon: MapPin, text: trip.locationName },
    { icon: CalendarDays, text: getDateLabel(trip.startAt, trip.endAt) },
    { icon: Clock3, text: format(trip.startAt, 'h:mm a') },
    { icon: Users, text: `${trip.rsvpCount ?? 0} going` },
  ]

  const capacityLabel = getCapacityLabel(trip)
  if (capacityLabel) {
    metaItems.push({ icon: Users, text: capacityLabel })
  }

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-border/70 transition-all hover:shadow-md"
      onClick={() => router.push(detailHref)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          router.push(detailHref)
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Open details for ${trip.title}`}
    >
      {showImage ? (
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={trip.heroImageUrl}
            alt={trip.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {visibleTags.length ? (
            <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
              {visibleTags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="border-white/20 bg-black/40 text-[11px] uppercase tracking-wide text-white backdrop-blur"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          {trip.difficulty ? (
            <div className="absolute right-3 top-3 z-10">
              <DifficultyTag difficulty={trip.difficulty} onImage />
            </div>
          ) : null}
        </div>
      ) : null}

      <CardContent className="space-y-3 p-4 md:p-5">
        {!showImage ? (
          <div className="flex items-center gap-2">
            {visibleTags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[11px] uppercase tracking-wide"
              >
                {tag}
              </Badge>
            ))}
            {trip.difficulty ? (
              <DifficultyTag difficulty={trip.difficulty} />
            ) : null}
          </div>
        ) : null}

        <h2 className="line-clamp-2 text-lg font-semibold leading-snug md:text-xl">
          {trip.title}
        </h2>

        <TripMetaRow items={metaItems} />

        <TripStats trip={trip} />

        <div className="space-y-3 border-t border-border/70 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-7 w-7">
                {trip.leaderAvatarUrl ? (
                  <AvatarImage
                    src={trip.leaderAvatarUrl}
                    alt={trip.leaderName ?? 'Host'}
                  />
                ) : null}
                <AvatarFallback>
                  {getLeaderInitials(trip.leaderName)}
                </AvatarFallback>
              </Avatar>
              <p className="truncate text-sm text-muted-foreground">
                Hosted by {trip.leaderName ?? 'UNLV Mountain Club'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 md:justify-end">
            <TripStatusBadge status={trip.status} />
            <div className="flex-1 md:max-w-48">
              <RsvpComingSoon />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
