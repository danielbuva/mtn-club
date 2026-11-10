import Image from 'next/image'
import Link from 'next/link'
import { Fragment } from 'react'
import { CopyTripLinkButton } from '@/components/trips/copy-trip-link-button'
import { TripStatusBadge } from '@/components/trips/TripStatusBadge'
import { Button } from '@/components/ui/button'
import { expeditionDateline, getTripEdition } from '@/lib/editorial/editions'
import { formatDateOnly } from '@/lib/events/formatters'
import { formatScheduleDate } from '@/lib/events/schedule'
import { isTripPast } from '@/lib/trips/is-trip-past'
import type {
  TripActivityType,
  TripDetail,
  TripDifficulty,
} from '@/lib/trips/types'
import { PersonAvatar } from './person-avatar'
import { TripEditionHero } from './trip-edition-hero'

type TripHeroProps = {
  trip: TripDetail
  canEdit?: boolean
  editHref?: string
}

const activityLabel: Record<TripActivityType, string> = {
  climbing: 'Climbing',
  hiking: 'Hiking',
  camping: 'Camping',
  backpacking: 'Backpacking',
  other: 'Outdoor',
}

const difficultyLabel: Record<TripDifficulty, string> = {
  beginner: 'Beginner friendly',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
}

export function TripHero({ trip, canEdit = false, editHref }: TripHeroProps) {
  const edition = getTripEdition(trip)
  const past = isTripPast(trip, Date.now())
  const zone = trip.timeZone ?? 'America/Los_Angeles'
  const eyebrow = [
    trip.isOfficial === false ? 'Community trip' : 'Official club trip',
    activityLabel[trip.activityType],
    trip.difficulty ? difficultyLabel[trip.difficulty] : null,
  ].filter((item): item is string => Boolean(item))
  const canceled = trip.status === 'cancelled'
  const singleLeader =
    Boolean(trip.leaderName) && !trip.leaderName?.includes(',')

  return (
    <header className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 pt-1.5 font-brand text-[13px] font-semibold uppercase leading-5 tracking-[0.14em] text-muted-foreground">
          {eyebrow.map((item, index) => (
            <Fragment key={item}>
              <span className="whitespace-nowrap">
                {item}
                {index < eyebrow.length - 1 ? (
                  <span aria-hidden="true" className="pl-[0.5em]">
                    ·
                  </span>
                ) : null}
              </span>{' '}
            </Fragment>
          ))}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {canEdit && editHref ? (
            <Button asChild size="sm" variant="outline" className="shadow-none">
              <Link href={editHref}>Edit trip</Link>
            </Button>
          ) : null}
          <CopyTripLinkButton tripId={trip.id} />
        </div>
      </div>

      {canceled && edition?.level === 'special' ? null : past && !canceled ? (
        <p className="font-brand text-sm font-bold uppercase tracking-wide">
          Past trip ·{' '}
          {formatScheduleDate(
            formatDateOnly(trip.startAt, zone),
            trip.endAt ? formatDateOnly(trip.endAt, zone) : undefined,
          )}
        </p>
      ) : canceled ? (
        <p className="inline-flex h-7 items-center border-2 border-foreground px-2 font-brand text-sm font-bold uppercase tracking-[0.1em]">
          Canceled
        </p>
      ) : trip.status !== 'open' ? (
        <TripStatusBadge status={trip.status} />
      ) : null}

      <h1 className="max-w-4xl text-balance font-brand text-[2.5rem] font-bold uppercase leading-[0.95] tracking-tight md:text-6xl">
        {trip.title}
      </h1>

      {edition?.level === 'feature' && trip.endAt ? (
        <p className="text-balance border-t border-border pt-3 font-brand text-base uppercase tracking-[0.1em] text-muted-foreground">
          {expeditionDateline(trip.startAt, trip.endAt, zone)}
        </p>
      ) : null}

      <div className="flex items-center gap-3 text-sm">
        {singleLeader ? (
          <PersonAvatar name={trip.leaderName} src={trip.leaderAvatarUrl} />
        ) : null}
        <p>
          <span className="text-muted-foreground">Led by </span>
          <span className="font-medium">
            {trip.leaderName ?? 'UNLV Mountain Club'}
          </span>
        </p>
      </div>

      {edition?.level === 'special' ? (
        <TripEditionHero trip={trip} edition={edition} />
      ) : trip.heroImageUrl ? (
        <div className="relative aspect-[16/9] overflow-hidden border border-border bg-muted md:aspect-[21/9]">
          <Image
            src={trip.heroImageUrl}
            alt=""
            fill
            priority
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
    </header>
  )
}
