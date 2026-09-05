import Link from 'next/link'
import type { TripRegistrationSnapshot } from '@/lib/registration/schema'

export function RegistrationSummary({
  snapshot,
}: {
  snapshot: TripRegistrationSnapshot
}) {
  const formatTime = (time: string) =>
    new Date(time).toLocaleString('en-US', {
      timeZone: snapshot.timeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  return (
    <section
      className="space-y-2 rounded-lg border p-4"
      aria-label="Registration status"
    >
      <p className="text-lg font-semibold capitalize">
        {snapshot.state.replaceAll('_', ' ')}
      </p>
      <p>
        {snapshot.confirmedCount} confirmed
        {snapshot.capacity !== null ? ` / ${snapshot.capacity} seats` : ''} ·{' '}
        {snapshot.reservedCount} reserved · {snapshot.waitlistCount} waitlisted
      </p>
      <p className="text-sm">
        Registration closes {formatTime(snapshot.closeAt)} ({snapshot.timeZone}
        ).
      </p>
      {['disabled', 'closed', 'canceled', 'archived', 'full'].includes(
        snapshot.availability,
      ) ? (
        <output>
          {snapshot.availability === 'disabled'
            ? 'Registration is not open yet.'
            : `Registration is ${snapshot.availability}.`}
        </output>
      ) : null}
      {!snapshot.emailEnabled ? (
        <p className="text-sm">
          Trip emails are disabled in your preferences. Check{' '}
          <Link className="underline" href="/profile/trips">
            My trips
          </Link>{' '}
          for offers and changes.
        </p>
      ) : null}
      {snapshot.offer ? (
        <p className="font-medium">
          A seat is reserved for you until{' '}
          {formatTime(snapshot.offer.expiresAt)}. Accept before it expires.
        </p>
      ) : null}
    </section>
  )
}
export function RegistrationEvents({
  snapshot,
}: {
  snapshot: TripRegistrationSnapshot
}) {
  const formatTime = (time: string) =>
    new Date(time).toLocaleString('en-US', {
      timeZone: snapshot.timeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  return (
    <section className="space-y-2">
      <h2 className="font-semibold">Recent updates</h2>
      {snapshot.events.length ? (
        snapshot.events.map((event, index) => (
          <p key={`${event.createdAt}-${index}`} className="text-sm capitalize">
            {event.kind.replaceAll('_', ' ')} — {formatTime(event.createdAt)}
          </p>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          Your registration updates will appear here.
        </p>
      )}
    </section>
  )
}
