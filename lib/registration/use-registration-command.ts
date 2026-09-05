'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { registrationAction } from '@/lib/registration/actions'
import type {
  RegistrationInput,
  RegistrationResult,
  TripRegistrationSnapshot,
} from '@/lib/registration/schema'

export function useRegistrationCommand(tripId: string) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const request = useRef<{ fingerprint: string; id: string } | null>(null)
  const busy = useRef(false)
  async function run(
    input: Omit<RegistrationInput, 'requestId' | 'tripId'>,
    onSuccess?: (snapshot: TripRegistrationSnapshot) => void,
    onFailure?: () => void,
  ): Promise<RegistrationResult> {
    if (busy.current)
      return { ok: false, message: 'A request is already being saved.' }
    busy.current = true
    setPending(true)
    const fingerprint = JSON.stringify(input)
    if (request.current?.fingerprint !== fingerprint)
      request.current = { fingerprint, id: crypto.randomUUID() }
    setMessage('')
    setFieldErrors({})
    try {
      const result = await registrationAction({
        ...input,
        tripId,
        requestId: request.current.id,
      })
      if (result.ok) {
        request.current = null
        onSuccess?.(result.snapshot)
      } else {
        setMessage(result.message)
        setFieldErrors(result.fieldErrors ?? {})
        onFailure?.()
      }
      router.refresh()
      return result
    } catch {
      const message =
        'The response could not be confirmed. Refresh to check your status, or retry safely.'
      onFailure?.()
      setMessage(message)
      return { ok: false, message }
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return { run, pending, message, fieldErrors }
}
