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
    <section
      aria-labelledby="trip-updates"
      className="space-y-3 border-t border-foreground/80 pt-5"
    >
      <h2
        id="trip-updates"
        className="font-brand text-2xl font-bold uppercase leading-none tracking-wide"
      >
        Trip updates
      </h2>
      <p className="text-[15px] leading-6 text-muted-foreground">
        {following
          ? 'You’ll get an email when signups open or the plan changes.'
          : 'Get an email when signups open or the plan changes.'}
      </p>
      {authenticated ? (
        <Button
          variant="outline"
          className="h-10 w-full shadow-none"
          disabled={pending}
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
              ? 'Stop following this trip'
              : 'Follow this trip'}
        </Button>
      ) : (
        <Button asChild variant="outline" className="h-10 w-full shadow-none">
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
