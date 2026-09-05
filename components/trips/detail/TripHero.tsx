import Image from 'next/image'
import Link from 'next/link'
import { TripStatusBadge } from '@/components/trips/TripStatusBadge'
import { ActivityTag, DifficultyTag } from '@/components/trips/TripTags'
import { TripTitleText } from '@/components/trips/trip-title-text'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TripDetail } from '@/lib/trips/types'

type TripHeroProps = {
  trip: TripDetail
  canEdit?: boolean
  editHref?: string
}

function initials(name?: string) {
  if (!name) return 'MC'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function TripHero({ trip, canEdit = false, editHref }: TripHeroProps) {
  if (!trip.heroImageUrl) {
    return (
      <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge
              variant={trip.isOfficial === false ? 'secondary' : 'outline'}
            >
              {trip.isOfficial === false
                ? 'Community-created trip'
                : 'Official club trip'}
            </Badge>
            <ActivityTag activityType={trip.activityType} uppercase />
            {trip.difficulty ? (
              <DifficultyTag difficulty={trip.difficulty} />
            ) : null}
            {trip.status !== 'open' ? (
              <TripStatusBadge status={trip.status} />
            ) : null}
          </div>
          {canEdit && editHref ? (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="bg-transparent"
            >
              <Link href={editHref}>Edit</Link>
            </Button>
          ) : null}
        </div>
        <h1 className="text-2xl font-semibold leading-tight md:text-4xl">
          <TripTitleText
            title={trip.title}
            canceled={trip.status === 'cancelled'}
          />
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="h-7 w-7 border border-border/70">
            {trip.leaderAvatarUrl ? (
              <AvatarImage
                src={trip.leaderAvatarUrl}
                alt={trip.leaderName ?? 'Host'}
              />
            ) : null}
            <AvatarFallback>{initials(trip.leaderName)}</AvatarFallback>
          </Avatar>
          <span>Led by {trip.leaderName ?? 'UNLV Mountain Club'}</span>
        </div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={trip.heroImageUrl}
          alt={trip.title}
          fill
          sizes="(min-width: 1280px) 1280px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <Badge
            variant="secondary"
            className="border border-white/20 bg-black/50 text-white"
          >
            {trip.isOfficial === false
              ? 'Community-created trip'
              : 'Official club trip'}
          </Badge>
          <ActivityTag activityType={trip.activityType} uppercase onImage />
        </div>

        <div className="absolute right-4 top-4 flex items-center gap-2">
          {canEdit && editHref ? (
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="border border-white/30 bg-black/50 text-white hover:bg-black/60"
            >
              <Link href={editHref}>Edit</Link>
            </Button>
          ) : null}
          {trip.difficulty ? (
            <DifficultyTag difficulty={trip.difficulty} onImage />
          ) : null}
          {trip.status !== 'open' ? (
            <TripStatusBadge status={trip.status} />
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-6">
          <h1 className="text-2xl font-semibold leading-tight md:text-4xl">
            <TripTitleText
              title={trip.title}
              canceled={trip.status === 'cancelled'}
            />
          </h1>
          <div className="mt-4 flex items-center gap-2 text-sm text-white/90">
            <Avatar className="h-7 w-7 border border-white/20">
              {trip.leaderAvatarUrl ? (
                <AvatarImage
                  src={trip.leaderAvatarUrl}
                  alt={trip.leaderName ?? 'Host'}
                />
              ) : null}
              <AvatarFallback>{initials(trip.leaderName)}</AvatarFallback>
            </Avatar>
            <span>Led by {trip.leaderName ?? 'UNLV Mountain Club'}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
