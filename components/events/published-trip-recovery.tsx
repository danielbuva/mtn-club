'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { configureTripTransportationAction } from '@/app/(reader)/trips/draft-actions'
import { FormMessage, FormStep } from '@/components/forms/form-shell'
import { Button } from '@/components/ui/button'

export function PublishedTripRecovery({
  tripId,
  onDone,
}: {
  tripId: string
  onDone: () => void
}) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState(
    'Your trip is published. Transportation preferences still need to be enabled.',
  )
  const busy = useRef(false)
  async function retry() {
    if (busy.current) return
    busy.current = true
    setPending(true)
    try {
      await configureTripTransportationAction(tripId, true)
      onDone()
    } catch {
      setMessage(
        'Your trip is safe. We couldn’t enable transportation preferences yet. Try again or open the trip to finish later.',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <FormStep title="Your trip is published.">
      <FormMessage>{message}</FormMessage>
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={pending} onClick={retry}>
          {pending ? 'Saving…' : 'Retry transportation setup'}
        </Button>
        <Link className="underline" href={`/trips/${tripId}`}>
          Open your trip
        </Link>
      </div>
    </FormStep>
  )
}
