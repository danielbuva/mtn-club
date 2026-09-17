'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { setTripFollowing } from '@/lib/registration/follow-actions'

export function FollowTripButton({
  tripId,
  following,
  authenticated,
}: {
  tripId: string
  following: boolean
  authenticated: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()
  return (
    <section className="space-y-2 rounded-2xl border border-border/70 bg-card p-4">
      <p className="text-sm text-muted-foreground">
        Get an email when registration opens for this trip.
      </p>
      {authenticated ? (
        <Button
          variant="outline"
          disabled={pending}
          aria-pressed={following}
          onClick={() =>
            startTransition(async () => {
              setError(undefined)
              try {
                const result = await setTripFollowing(tripId, !following)
                if (result.error) setError(result.error)
              } catch {
                setError('Could not save your choice. Please try again.')
              }
            })
          }
        >
          {pending
            ? 'Saving…'
            : following
              ? 'Following trip updates · Unfollow'
              : 'Follow trip updates'}
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link
            href={`/auth/login?returnTo=${encodeURIComponent(`/trips/${tripId}`)}`}
          >
            Sign in to follow trip updates
          </Link>
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}{' '}
          <Link className="underline" href="/profile/user/privacy">
            Email preferences
          </Link>
        </p>
      )}
    </section>
  )
}
