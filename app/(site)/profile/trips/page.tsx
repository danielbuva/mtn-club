import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import {
  RegistrationShell,
  RegistrationSkeleton,
} from '@/components/registration/page-shell'
import { getMyRegistrations } from '@/lib/registration/server'
import { createClient } from '@/lib/supabase/server'

async function MyTrips() {
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user) redirect('/auth/login?returnTo=%2Fprofile%2Ftrips')
  const trips = await getMyRegistrations()
  if (!trips.length)
    return (
      <p>
        No registrations yet.{' '}
        <Link className="underline" href="/trips">
          Find a trip
        </Link>{' '}
        to get started.
      </p>
    )
  return (
    <div className="space-y-4">
      {trips.map(trip => (
        <article key={trip.tripId} className="space-y-2 rounded-lg border p-4">
          <h2 className="text-xl font-medium">
            <Link className="underline" href={`/trips/${trip.tripId}/rsvp`}>
              {trip.title}
            </Link>
          </h2>
          <p className="capitalize">{trip.state.replaceAll('_', ' ')}</p>
          <p className="text-sm">
            {new Date(trip.startAt).toLocaleString('en-US', {
              timeZone: trip.timeZone,
            })}{' '}
            ({trip.timeZone})
          </p>
          {trip.offer ? (
            <p className="font-medium">
              Seat offer: accept by{' '}
              {new Date(trip.offer.expiresAt).toLocaleString('en-US', {
                timeZone: trip.timeZone,
              })}
              .
            </p>
          ) : null}
          {!trip.emailEnabled ? (
            <p className="text-sm">
              Email updates are disabled. Check here for offers and changes.
            </p>
          ) : null}
          {trip.events[0] ? (
            <p className="text-sm capitalize">
              Latest: {trip.events[0].kind.replaceAll('_', ' ')}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  )
}
export default function MyTripsPage() {
  return (
    <RegistrationShell title="My trips">
      <Suspense fallback={<RegistrationSkeleton />}>
        <MyTrips />
      </Suspense>
    </RegistrationShell>
  )
}
