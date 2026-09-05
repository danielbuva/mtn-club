import { TripDescription } from '@/components/trips/detail/TripDescription'
import { TripHero } from '@/components/trips/detail/TripHero'
import { TripQuickFacts } from '@/components/trips/detail/TripQuickFacts'
import { TripBottomControls } from '@/components/trips/trip-bottom-controls'
import { TripCancellationNotice } from '@/components/trips/trip-cancellation-notice'
import { type FallTrip, getFallTripScheduleKey } from '@/lib/club-content'
import type { TripDetail } from '@/lib/trips/types'

export function ScheduledTripDetail({ scheduled }: { scheduled: FallTrip }) {
  const trip: TripDetail = {
    id: getFallTripScheduleKey(scheduled),
    title: scheduled.title,
    activityType:
      scheduled.activity === 'sport_climbing' ||
      scheduled.activity === 'bouldering'
        ? 'climbing'
        : scheduled.activity,
    activityTags: [scheduled.activity.replaceAll('_', ' ')],
    locationName: 'Exact location announced in Discord',
    startAt: new Date(`${scheduled.startDate}T12:00:00-07:00`),
    endAt: scheduled.endDate
      ? new Date(`${scheduled.endDate}T12:00:00-07:00`)
      : undefined,
    isAllDay: true,
    isOfficial: true,
    lifecycleStatus: scheduled.lifecycleStatus ?? 'published',
    status: scheduled.lifecycleStatus === 'canceled' ? 'cancelled' : 'closed',
    cancellationReason: scheduled.cancellationReason,
    leaderName: scheduled.hosts.map(host => host.name).join(', '),
    summary: 'Exact time and logistics will be announced in Discord.',
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 pb-32">
      <TripHero trip={trip} />
      {trip.status === 'cancelled' && (
        <TripCancellationNotice reason={trip.cancellationReason} />
      )}
      <TripQuickFacts trip={trip} />
      <TripDescription trip={trip} />
      <TripBottomControls fallbackHref="/schedule">
        <span className="px-3 text-xs text-muted-foreground">
          {trip.status === 'cancelled'
            ? 'Trip canceled'
            : 'Registration not yet available'}
        </span>
      </TripBottomControls>
    </main>
  )
}
