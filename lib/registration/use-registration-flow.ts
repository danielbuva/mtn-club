'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  focusFormError,
  useFormNavigation,
} from '@/lib/forms/use-form-navigation'
import {
  initialRegistrationValues,
  normalizeRegistrationValues,
  type RegistrationValues,
  registrationFieldStep,
  registrationSteps,
} from './form-values'
import type {
  RegistrationInput,
  RegistrationResult,
  TripRegistrationSnapshot,
} from './schema'
import { validateRegistrationValues } from './validate-form'

export type RegistrationFlowProps = {
  snapshot: TripRegistrationSnapshot
  onPersist: (
    data: RegistrationInput['data'],
    intent: 'draft' | 'submit',
    snapshot: TripRegistrationSnapshot,
  ) => Promise<RegistrationResult>
  onDeclareAge: (adult: boolean) => Promise<TripRegistrationSnapshot>
  onSavedDraft?: () => void
}
export function useRegistrationFlow(props: RegistrationFlowProps) {
  const [snapshot, setSnapshot] = useState(props.snapshot)
  const form = useForm<RegistrationValues>({
    defaultValues: initialRegistrationValues(props.snapshot),
    shouldUnregister: false,
  })
  const {
    watch,
    getValues,
    setValue,
    reset,
    formState: { dirtyFields },
  } = form
  const values = watch()
  const [age, setAge] = useState<'adult' | 'minor' | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const [pending, setPending] = useState(false)
  const [complete, setComplete] = useState(false)
  const busy = useRef(false)
  const root = useRef<HTMLFormElement>(null)
  const previous = useRef(props.snapshot)
  const accepted = useRef(props.snapshot)
  const nav = useFormNavigation(registrationSteps(snapshot, values))
  // Subscribe to dirty fields so RHF's keepDirtyValues merges only untouched defaults.
  const dirty = Object.keys(dirtyFields).length > 0
  const receiveSnapshot = useCallback(
    (next: TripRegistrationSnapshot) => {
      const changed =
        accepted.current.formVersion !== next.formVersion ||
        accepted.current.waiver?.id !== next.waiver?.id ||
        accepted.current.collectTransportation !== next.collectTransportation
      accepted.current = next
      setSnapshot(next)
      reset(initialRegistrationValues(next), { keepDirtyValues: dirty })
      if (changed) {
        setValue('waiverReadId', null)
        setValue('waiverAgreed', false)
        setValue('signatureName', '')
        setValue('signerDetails', initialRegistrationValues(next).signerDetails)
        setValue('emergencyConfirmed', false)
        setComplete(false)
        setMessage(
          'The trip form has changed. Your matching answers are kept; please review the current questions before submitting.',
        )
      }
    },
    [reset, setValue, dirty],
  )
  useEffect(() => {
    if (previous.current === props.snapshot) return
    previous.current = props.snapshot
    // A slower refresh must not replace a newer command result.
    if (props.snapshot.revision < accepted.current.revision) return
    receiveSnapshot(props.snapshot)
  }, [props.snapshot, receiveSnapshot])
  function update<K extends keyof RegistrationValues>(
    key: K,
    value: RegistrationValues[K],
  ) {
    setValue<keyof RegistrationValues>(key, value, { shouldDirty: true })
    setErrors({})
  }
  function validate(all: boolean) {
    const nextErrors = validateRegistrationValues(
      getValues(),
      snapshot,
      all ? undefined : nav.current,
    )
    setErrors(nextErrors)
    const first = Object.keys(nextErrors)[0]
    if (!first) return true
    nav.goTo(registrationFieldStep(first))
    focusFormError(root.current)
    return false
  }
  async function persist(intent: 'draft' | 'submit') {
    if (busy.current || (intent === 'submit' && !validate(true))) return
    busy.current = true
    setPending(true)
    setMessage('')
    setFailed(false)
    try {
      const result = await props.onPersist(
        normalizeRegistrationValues(getValues(), snapshot, intent),
        intent,
        snapshot,
      )
      if (!result.ok) {
        setMessage(result.message)
        setFailed(true)
        if (result.snapshot) receiveSnapshot(result.snapshot)
        if (result.fieldErrors) {
          const next = Object.fromEntries(
            Object.entries(result.fieldErrors).map(([key, errors]) => [
              key.replace(/^data\./, ''),
              errors[0] ?? 'Check this answer.',
            ]),
          )
          setErrors(next)
          const first = Object.keys(next)[0]
          if (first) {
            nav.goTo(registrationFieldStep(first))
            focusFormError(root.current)
          }
        }
        return
      }
      receiveSnapshot(result.snapshot)
      if (intent === 'draft') {
        setMessage('Signup saved, but your place is not confirmed yet.')
        props.onSavedDraft?.()
      } else {
        setComplete(true)
        setMessage(
          result.snapshot.state === 'waitlisted'
            ? 'You’re on the waitlist. Check back for a seat offer.'
            : snapshot.actions.includes('update_response')
              ? 'Your registration details are updated.'
              : 'You’re confirmed. See you out there!',
        )
      }
    } catch {
      setMessage('Unable to save. Your answers are still here; please retry.')
      setFailed(true)
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  async function advance() {
    if (busy.current) return
    if (nav.current === 'age') {
      if (!age) {
        setErrors({ age: 'Choose your age group.' })
        focusFormError(root.current)
        return
      }
      busy.current = true
      setPending(true)
      try {
        receiveSnapshot(await props.onDeclareAge(age === 'adult'))
        nav.next()
      } catch {
        setFailed(true)
        setMessage('Your age declaration could not be saved. Please retry.')
      } finally {
        busy.current = false
        setPending(false)
      }
    } else if (nav.isLast) await persist('submit')
    else if (validate(false)) nav.next()
  }
  return {
    data: { snapshot, values, age, errors },
    feedback: { message, failed, pending, complete },
    actions: { update, setAge, setComplete, persist, advance },
    navigation: nav,
    root,
  }
}
