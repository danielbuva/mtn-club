'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { setTripRsvpAction } from '@/app/(reader)/trips/actions'
import { Button } from '@/components/ui/button'
import type { TripListItem } from '@/lib/trips/types'

type TripCTAProps = {
  trip: Pick<
    TripListItem,
    | 'id'
    | 'status'
    | 'rsvpCount'
    | 'capacity'
    | 'waitlistEnabled'
    | 'currentUserRsvp'
  >
}

const isAtCapacity = (trip: TripCTAProps['trip']) =>
  typeof trip.capacity === 'number' && (trip.rsvpCount ?? 0) >= trip.capacity

const getGoingLabel = (trip: TripCTAProps['trip']) => {
  const atCapacity = isAtCapacity(trip)
  const currentlyGoing = trip.currentUserRsvp === 'going'

  if (trip.currentUserRsvp === 'waitlisted') {
    return 'Waitlisted'
  }

  if (atCapacity && trip.waitlistEnabled && !currentlyGoing) {
    return 'Join waitlist'
  }

  return 'Going'
}

const isGoingDisabled = (trip: TripCTAProps['trip']) => {
  if (trip.status === 'cancelled') {
    return true
  }

  const atCapacity = isAtCapacity(trip)
  const currentlyGoing = trip.currentUserRsvp === 'going'

  return atCapacity && !trip.waitlistEnabled && !currentlyGoing
}

export function TripCTA({ trip }: TripCTAProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticRsvp, setOptimisticRsvp] = useState(trip.currentUserRsvp)
  const [optimisticRsvpCount, setOptimisticRsvpCount] = useState(
    trip.rsvpCount ?? 0,
  )
  const [isCoolingDown, setIsCoolingDown] = useState(false)
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current)
      }
    }
  }, [])

  const atCapacity =
    typeof trip.capacity === 'number' && optimisticRsvpCount >= trip.capacity
  const canClickGoing = !isGoingDisabled({
    ...trip,
    rsvpCount: optimisticRsvpCount,
    currentUserRsvp: optimisticRsvp,
  })

  const resolveNextStatus = (choice: 'going' | 'not_going') => {
    if (choice === 'going') {
      const targetStatus =
        atCapacity && trip.waitlistEnabled ? 'waitlisted' : 'going'
      return optimisticRsvp === targetStatus ? null : targetStatus
    }

    return optimisticRsvp === choice ? null : choice
  }

  const applyOptimisticCount = (
    current: number,
    previous: typeof optimisticRsvp,
    next: typeof optimisticRsvp,
  ) => {
    const prevIsGoing = previous === 'going'
    const nextIsGoing = next === 'going'
    if (prevIsGoing === nextIsGoing) {
      return current
    }
    if (nextIsGoing) {
      return current + 1
    }
    return Math.max(current - 1, 0)
  }

  const submitRsvp = (choice: 'going' | 'not_going') => {
    if (isPending || isCoolingDown) {
      return
    }

    if (choice === 'going' && !canClickGoing) {
      return
    }

    const previousStatus = optimisticRsvp
    const nextStatus = resolveNextStatus(choice)
    const isToggleOff = nextStatus === null
    setOptimisticRsvp(nextStatus)
    setOptimisticRsvpCount(count =>
      applyOptimisticCount(count, previousStatus, nextStatus),
    )
    setIsCoolingDown(true)
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current)
    }
    cooldownTimerRef.current = setTimeout(() => {
      setIsCoolingDown(false)
    }, 500)

    startTransition(async () => {
      const formData = new FormData()
      formData.set('tripId', trip.id)
      formData.set('status', choice)
      formData.set('toggle', isToggleOff ? '1' : '0')

      try {
        const result = await setTripRsvpAction(formData)
        const confirmedStatus = result?.status ?? null
        setOptimisticRsvp(confirmedStatus)
        setOptimisticRsvpCount(count =>
          applyOptimisticCount(count, nextStatus, confirmedStatus),
        )
        router.refresh()
      } catch {
        setOptimisticRsvp(previousStatus)
        setOptimisticRsvpCount(count =>
          applyOptimisticCount(count, nextStatus, previousStatus),
        )
      }
    })
  }

  if (trip.status === 'cancelled') {
    return (
      <div className="w-full rounded-md border border-border/80 bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
        RSVP unavailable
      </div>
    )
  }

  return (
    <div className="grid w-full grid-cols-2 gap-1">
      <Button
        type="button"
        size="sm"
        variant={
          optimisticRsvp === 'going' || optimisticRsvp === 'waitlisted'
            ? 'default'
            : 'outline'
        }
        className="h-9 px-2 text-xs"
        disabled={isPending || isCoolingDown || !canClickGoing}
        onClick={event => {
          event.stopPropagation()
          submitRsvp('going')
        }}
      >
        {getGoingLabel({
          ...trip,
          rsvpCount: optimisticRsvpCount,
          currentUserRsvp: optimisticRsvp,
        })}
      </Button>

      <Button
        type="button"
        size="sm"
        variant={optimisticRsvp === 'not_going' ? 'default' : 'outline'}
        className="h-9 px-2 text-xs"
        disabled={isPending || isCoolingDown}
        onClick={event => {
          event.stopPropagation()
          submitRsvp('not_going')
        }}
      >
        Not going
      </Button>
    </div>
  )
}
