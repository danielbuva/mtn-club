import type { Metadata, Viewport } from 'next'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { TripSchedulePage } from '@/components/landing/trip-schedule-page'
import { FALL_2026_TRIPS, getFallTripScheduleKey } from '@/lib/club-content'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Fall 2026 Trip Schedule | UNLV Mountain Club',
  description:
    'See the UNLV Mountain Club weekly meetups and public Fall 2026 trip schedule.',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#211D18',
}

async function TripScheduleContent() {
  await connection()
  const supabase = await createClient()
  const scheduleKeys = FALL_2026_TRIPS.map(getFallTripScheduleKey)
  const result = await supabase
    .from('trips')
    .select('id, schedule_key, lifecycle_status, cancellation_reason')
    .in('schedule_key', scheduleKeys)

  const tripDetailHrefs = Object.fromEntries(
    (result.data ?? []).flatMap(trip =>
      trip.schedule_key
        ? [[trip.schedule_key, `/trips/${trip.id}`] as const]
        : [],
    ),
  )

  const tripStates = Object.fromEntries(
    (result.data ?? []).flatMap(trip =>
      trip.schedule_key
        ? [
            [
              trip.schedule_key,
              {
                lifecycleStatus: trip.lifecycle_status,
                cancellationReason: trip.cancellation_reason,
              },
            ],
          ]
        : [],
    ),
  )
  return (
    <TripSchedulePage
      tripDetailHrefs={tripDetailHrefs}
      tripStates={tripStates}
    />
  )
}

export default function Page() {
  return (
    <Suspense fallback={<TripSchedulePage tripDetailHrefs={{}} />}>
      <TripScheduleContent />
    </Suspense>
  )
}
