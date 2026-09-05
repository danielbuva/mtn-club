'use client'

import { format } from 'date-fns'
import { CalendarDays, Clock3, MapPin } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { TripCTA } from '@/components/trips/TripCTA'
import { TripMetaRow } from '@/components/trips/TripMetaRow'
import { TripStats } from '@/components/trips/TripStats'
import { TripStatusBadge } from '@/components/trips/TripStatusBadge'
import { DifficultyTag } from '@/components/trips/TripTags'
import { TripCancellationNotice } from '@/components/trips/trip-cancellation-notice'
import { TripEventTag } from '@/components/trips/trip-event-tag'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { TripListItem } from '@/lib/trips/types'

const formatTripDate = (date: Date) =>
  format(date, 'EEE, MMM d').replace(', Sep ', ', Sept ')

const getDateLabel = (startAt: Date, endAt?: Date) => {
  if (!endAt || format(startAt, 'yyyy-MM-dd') === format(endAt, 'yyyy-MM-dd')) {
    return formatTripDate(startAt)
  }
  return `${formatTripDate(startAt)} – ${formatTripDate(endAt)}`
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
  const heroImageUrl = viewMode === 'grid' ? trip.heroImageUrl : undefined
  const showImage = Boolean(heroImageUrl)
  const visibleTags = (trip.tags ?? trip.activityTags).filter(
    tag => !['outdoor', 'fall'].includes(tag.trim().toLowerCase()),
  )

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-border/70 transition-all hover:shadow-md"
      onClick={event => {
        if (
          !(event.target instanceof Element) ||
          !event.target.closest('a,button,input,select')
        )
          router.push(detailHref)
      }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          router.push(detailHref)
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Open details for ${trip.title}`}
    >
      {heroImageUrl ? (
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={heroImageUrl}
            alt={trip.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {visibleTags.length || trip.status === 'members_only' ? (
            <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
              {visibleTags.map(tag => (
                <TripEventTag key={tag} tag={tag} />
              ))}
              {trip.status === 'members_only' ? (
                <TripStatusBadge status={trip.status} />
              ) : null}
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
        <div className="space-y-2">
          <h2 className="line-clamp-2 text-lg font-semibold leading-snug md:text-xl">
            {trip.title}
          </h2>

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
                Led by {trip.leaderName ?? 'UNLV Mountain Club'}
              </p>
            </div>
          </div>
        </div>
        {!showImage ? (
          <div className="flex flex-wrap items-center gap-2">
            {visibleTags.map(tag => (
              <TripEventTag key={tag} tag={tag} />
            ))}
            {trip.difficulty ? (
              <DifficultyTag difficulty={trip.difficulty} />
            ) : null}
            {trip.status === 'members_only' ? (
              <TripStatusBadge status={trip.status} />
            ) : null}
          </div>
        ) : null}
        <Badge
          variant={trip.isOfficial === false ? 'secondary' : 'outline'}
          className="w-fit text-[11px] uppercase tracking-wide"
        >
          {trip.isOfficial === false
            ? 'Community-created trip'
            : 'Official club trip'}
        </Badge>

        <TripMetaRow
          location={{ icon: MapPin, text: trip.locationName }}
          date={{
            icon: CalendarDays,
            text: getDateLabel(trip.startAt, trip.endAt),
          }}
          time={{
            icon: Clock3,
            text: trip.isAllDay ? 'TBA' : format(trip.startAt, 'h:mm a'),
          }}
        />

        {trip.status === 'cancelled' && (
          <TripCancellationNotice reason={trip.cancellationReason} />
        )}
        <TripStats trip={trip} />

        <div className="space-y-3 border-t border-border/70 pt-3">
          <div className="flex items-center justify-between gap-2 md:justify-end">
            {trip.status !== 'members_only' ? (
              <TripStatusBadge status={trip.status} />
            ) : null}
            <div className="flex-1 md:max-w-48">
              <TripCTA trip={trip} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
