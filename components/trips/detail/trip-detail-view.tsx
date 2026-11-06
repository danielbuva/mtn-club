import Link from 'next/link'
import { type ReactNode, Suspense } from 'react'
import { TripFollowControl } from '@/components/trips/trip-follow-control'
import type { TripDetail } from '@/lib/trips/types'
import { TripAttendees } from './TripAttendees'
import { TripDescription } from './TripDescription'
import { TripHero } from './TripHero'
import { TripLogistics } from './TripLogistics'
import { TripQuickFacts } from './TripQuickFacts'
import { TripRequirements } from './TripRequirements'
import { TripStickyRsvpBar } from './TripStickyRsvpBar'

function cancellationText(reason?: string | null) {
  const note = reason?.trim().replace(/^cancel(?:l)?ed\s*[—–-]?\s*/i, '')
  return note
    ? note.charAt(0).toUpperCase() + note.slice(1)
    : 'The trip leaders called it off. Check the club Discord for what’s next.'
}

type TripDetailViewProps = {
  trip: TripDetail
  viewer: { isAuthenticated: boolean; isMember: boolean }
  canEdit: boolean
  editHref: string
  /** Organizer entry point to the full attendee list (already Suspense-wrapped). */
  organizerRoster?: ReactNode
}

function FollowFallback() {
  return (
    <output
      aria-label="Loading trip email preferences"
      className="block h-[9.5rem] animate-pulse border-t border-foreground/80 bg-muted/40"
    />
  )
}

export function TripDetailView({
  trip,
  viewer,
  canEdit,
  editHref,
  organizerRoster,
}: TripDetailViewProps) {
  const registered = [
    'confirmed',
    'waitlisted',
    'offered',
    'incomplete',
    'legacy_review',
  ].includes(trip.registrationState ?? 'none')
  const upcoming =
    trip.lifecycleStatus === 'published' &&
    trip.startAt > new Date() &&
    !registered
  return (
    <main
      data-trip-surface
      className="mx-auto w-full max-w-6xl px-4 pt-8 pb-36 md:px-6 md:pt-12"
    >
      <TripHero trip={trip} canEdit={canEdit} editHref={editHref} />
      {trip.status === 'cancelled' ? (
        <div className="mt-6 max-w-prose border-l-4 border-[#b00000] py-1 pl-4 dark:border-[#ff8a80]">
          <p className="font-medium">This trip is canceled.</p>
          <p className="mt-1 text-[15px] leading-6">
            {cancellationText(trip.cancellationReason)}
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_auto_1fr] lg:gap-x-12">
        <div className="lg:col-start-2 lg:row-start-1">
          <TripQuickFacts trip={trip} />
        </div>

        <div className="space-y-10 lg:col-start-1 lg:row-span-3 lg:row-start-1">
          <TripDescription trip={trip} />
          <TripLogistics trip={trip} />
          <TripRequirements trip={trip} />
        </div>

        <div className="lg:col-start-2 lg:row-start-2">
          <TripAttendees
            tripId={trip.id}
            attendees={trip.attendees ?? []}
            goingCount={trip.rsvpCount ?? 0}
            canView={trip.canViewAttendees ?? false}
            viewer={viewer}
            canceled={trip.status === 'cancelled'}
            organizerAction={
              trip.canManageRegistration ? (
                <div className="space-y-2">
                  {organizerRoster}
                  <Link
                    href={`/trips/${trip.id}/registrations`}
                    className="inline-flex min-h-9 items-center text-sm underline underline-offset-4"
                  >
                    Manage registration
                  </Link>
                </div>
              ) : undefined
            }
          />
        </div>

        {upcoming ? (
          <div className="lg:col-start-2 lg:row-start-3 lg:self-start">
            <Suspense fallback={<FollowFallback />}>
              <TripFollowControl tripId={trip.id} />
            </Suspense>
          </div>
        ) : null}
      </div>

      <TripStickyRsvpBar trip={trip} viewer={viewer} />
    </main>
  )
}
