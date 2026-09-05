'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ChoiceCards } from '@/components/forms/choice-cards'
import { FormActions } from '@/components/forms/form-actions'
import {
  FormMessage,
  FormProgress,
  FormShell,
  FormStep,
} from '@/components/forms/form-shell'
import { FormViewport } from '@/components/forms/form-viewport'
import { Button } from '@/components/ui/button'
import {
  creationStepForField,
  creationSteps,
  creationTitles,
  normalizeEventValues,
} from '@/lib/events/form-values'
import { type EventFormValues, eventFormSchema } from '@/lib/events/schema'
import {
  focusFormError,
  useFormNavigation,
} from '@/lib/forms/use-form-navigation'
import { ActivityChoices } from './activity-choices'
import {
  CreationBasics,
  CreationDetails,
  CreationPlace,
  CreationSettings,
} from './creation-fields'
import { CreationReview } from './creation-review'

export type CreationSubmission = {
  values: EventFormValues
  isNoLimitEnabled: boolean
  publicHostIds: string[]
  leaderUserIds: string[]
}
export type CreationFlowProps = {
  initialValues: EventFormValues
  initialNoLimit: boolean
  initialHostIds?: string[]
  initialLeaderIds?: string[]
  canChooseOfficial: boolean
  activityOptions: string[]
  publicHostOptions: { id: string; label: string }[]
  leaderOptions: { id: string; label: string }[]
  onSave: (payload: CreationSubmission) => Promise<string>
  onPublish: (payload: CreationSubmission) => Promise<string>
  onCancel?: () => void
  onAddTag?: (tag: string) => Promise<void>
  onRemoveTags?: (tags: string[]) => Promise<void>
}

export function TripCreationFlow(props: CreationFlowProps) {
  const { watch, setValue, getValues } = useForm<EventFormValues>({
    defaultValues: props.initialValues,
    shouldUnregister: false,
  })
  const values = watch()
  const [noLimit, setNoLimit] = useState(props.initialNoLimit)
  const [hostIds, setHostIds] = useState(props.initialHostIds ?? [])
  const [leaderIds, setLeaderIds] = useState(props.initialLeaderIds ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const [pending, setPending] = useState(false)
  const [complete, setComplete] = useState(false)
  const busy = useRef(false)
  const root = useRef<HTMLFormElement>(null)
  const nav = useFormNavigation(creationSteps)
  function update<K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) {
    setValue<keyof EventFormValues>(key, value, { shouldDirty: true })
    setErrors(current => ({ ...current, [key]: '' }))
  }
  function payload(): CreationSubmission {
    return {
      values: normalizeEventValues(
        getValues(),
        noLimit,
        props.canChooseOfficial,
      ),
      isNoLimitEnabled: noLimit,
      publicHostIds: hostIds,
      leaderUserIds: leaderIds,
    }
  }
  function validate(all = false) {
    const normalized = payload().values
    const result = eventFormSchema.safeParse(normalized)
    const nextErrors: Record<string, string> = {}
    if (!result.success)
      for (const issue of result.error.issues) {
        const field = String(issue.path[0])
        if (all || creationStepForField(field) === nav.current)
          nextErrors[field] ??= issue.message
      }
    if (!noLimit && (all || nav.current === 'settings')) {
      const limit = Number(normalized.maxParticipants)
      if (!Number.isInteger(limit) || limit < 1 || limit > 100000)
        nextErrors.maxParticipants = 'Enter a whole number from 1 to 100,000.'
    }
    setErrors(nextErrors)
    const first = Object.keys(nextErrors)[0]
    if (first) {
      nav.goTo(creationStepForField(first))
      focusFormError(root.current)
      return false
    }
    return true
  }
  async function save(publish: boolean) {
    if (busy.current || (publish && !validate(true))) return
    busy.current = true
    setPending(true)
    setFailed(false)
    setMessage('')
    try {
      setMessage(
        await (publish ? props.onPublish(payload()) : props.onSave(payload())),
      )
      if (publish) setComplete(true)
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save. Your answers are still here; please retry.',
      )
      setFailed(true)
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  const shared = {
    values,
    errors,
    onChange: update,
    canChooseOfficial: props.canChooseOfficial,
  }
  return (
    <FormShell
      ref={root}
      id="trip-event-form"
      onSubmit={async event => {
        event.preventDefault()
        if (complete || pending) return
        if (nav.isLast) await save(true)
        else if (validate()) nav.next()
      }}
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Plan something good / MTN Club
      </p>
      <FormProgress index={nav.index} count={nav.count} />
      <FormMessage error={failed}>{message}</FormMessage>
      {complete ? (
        <FormStep
          title="Your trip is ready."
          description="Everything is saved. See you out there."
        >
          <CreationReview
            values={values}
            noLimit={noLimit}
            onEdit={() => setComplete(false)}
            hosts={props.publicHostOptions
              .filter(option => hostIds.includes(option.id))
              .map(option => option.label)}
            leaders={props.leaderOptions
              .filter(option => leaderIds.includes(option.id))
              .map(option => option.label)}
          />
        </FormStep>
      ) : (
        <>
          <fieldset disabled={pending} className="min-w-0">
            <FormViewport stepId={nav.current} direction={nav.direction}>
              <FormStep
                title={creationTitles[nav.current] ?? ''}
                description={
                  nav.current === 'details'
                    ? 'A little context makes a better day outside. Add what matters; leave the rest.'
                    : nav.current === 'review'
                      ? 'Give it one last look. You can jump back to any section.'
                      : undefined
                }
              >
                {nav.current === 'basics' && (
                  <div className="space-y-7">
                    <CreationBasics {...shared} />
                    <ActivityChoices
                      options={props.activityOptions}
                      selected={values.activityTypes ?? []}
                      onChange={value => update('activityTypes', value)}
                      onAdd={props.onAddTag}
                      onRemove={props.onRemoveTags}
                    />
                  </div>
                )}
                {nav.current === 'place' && <CreationPlace {...shared} />}
                {nav.current === 'details' && <CreationDetails {...shared} />}
                {nav.current === 'settings' && (
                  <div className="space-y-7">
                    <CreationSettings
                      {...shared}
                      noLimit={noLimit}
                      onNoLimit={setNoLimit}
                    />
                    {props.publicHostOptions.length > 0 && (
                      <ChoiceCards
                        multiple
                        label="Public host credits"
                        value={hostIds}
                        onChange={setHostIds}
                        options={props.publicHostOptions.map(option => ({
                          value: option.id,
                          label: option.label,
                        }))}
                      />
                    )}
                    {props.leaderOptions.length > 0 && (
                      <ChoiceCards
                        multiple
                        label="Linked account leaders"
                        value={leaderIds}
                        onChange={setLeaderIds}
                        options={props.leaderOptions.map(option => ({
                          value: option.id,
                          label: option.label,
                        }))}
                      />
                    )}
                  </div>
                )}
                {nav.current === 'review' && (
                  <CreationReview
                    values={payload().values}
                    noLimit={noLimit}
                    onEdit={nav.goTo}
                    hosts={props.publicHostOptions
                      .filter(option => hostIds.includes(option.id))
                      .map(option => option.label)}
                    leaders={props.leaderOptions
                      .filter(option => leaderIds.includes(option.id))
                      .map(option => option.label)}
                  />
                )}
              </FormStep>
            </FormViewport>
          </fieldset>
          <FormActions
            onBack={nav.index ? nav.back : undefined}
            pending={pending}
            primaryLabel={
              nav.isLast
                ? values.isOfficial
                  ? 'Create Official Trip'
                  : 'Post Meetup'
                : 'Continue'
            }
            secondary={
              <>
                {props.onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pending}
                    onClick={props.onCancel}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  id="trip-save-draft-btn"
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => save(false)}
                >
                  Save draft
                </Button>
              </>
            }
          />
        </>
      )}
    </FormShell>
  )
}
