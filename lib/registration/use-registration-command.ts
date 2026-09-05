'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { registrationAction } from '@/lib/registration/actions'
import type {
  RegistrationInput,
  TripRegistrationSnapshot,
} from '@/lib/registration/schema'

export function useRegistrationCommand(tripId: string) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const request = useRef<{ fingerprint: string; id: string } | null>(null)
  const busy = useRef(false)
  function run(
    input: Omit<RegistrationInput, 'requestId' | 'tripId'>,
    onSuccess?: (snapshot: TripRegistrationSnapshot) => void,
  ) {
    if (busy.current) return
    busy.current = true
    const fingerprint = JSON.stringify(input)
    if (request.current?.fingerprint !== fingerprint)
      request.current = { fingerprint, id: crypto.randomUUID() }
    const requestId = request.current.id
    setMessage('')
    startTransition(async () => {
      try {
        const result = await registrationAction({ ...input, tripId, requestId })
        if (result.ok) {
          request.current = null
          setMessage('Registration updated.')
          onSuccess?.(result.snapshot)
        } else {
          setMessage(result.message)
        }
        router.refresh()
      } catch {
        setMessage(
          'The response could not be confirmed. Refresh to check your status, or retry safely.',
        )
      } finally {
        busy.current = false
      }
    })
  }
  return { run, pending, message }
}
