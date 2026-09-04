'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  addTripTagOptionAction,
  removeTripTagOptionsAction,
} from '@/app/(reader)/trips/actions'
import {
  publishTripFormAction,
  saveTripDraftAction,
} from '@/app/(reader)/trips/draft-actions'
import { EventFloatingActions } from '@/components/events/event-floating-actions'
import { EventBasicsSection } from '@/components/events/sections/event-basics-section'
import { EventDescriptionSection } from '@/components/events/sections/event-description-section'
import { EventDetailsSection } from '@/components/events/sections/event-details-section'
import { EventLocationsSection } from '@/components/events/sections/event-locations-section'
import { EventScheduleSection } from '@/components/events/sections/event-schedule-section'
import { EventSettingsSection } from '@/components/events/sections/event-settings-section'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toEventFormValuesFromDraft } from '@/lib/events/drafts'
import { type EventFormValues, eventFormSchema } from '@/lib/events/schema'
import type { Database } from '@/lib/supabase/types'

const timezoneFallback = Intl.DateTimeFormat().resolvedOptions().timeZone

const emptyValues = (isOfficial: boolean): EventFormValues => ({
  title: '',
  shortSummary: '',
  kind: 'outdoor',
  activityTypes: [],
  startAt: '',
  endAt: '',
  timezone: timezoneFallback,
  primaryLocationName: '',
  meetingLocationName: '',
  locationNotes: '',
  overviewWhat: '',
  overviewWhere: '',
  overviewWeather: '',
  overviewEquipment: '',
  overviewCarpoolNeedGear: '',
  visibility: 'members',
  maxParticipants: '',
  difficulty: undefined,
  isOfficial,
})

const resolveInitialFormState = ({
  initialDraft,
  canChooseOfficial,
  initialIsOfficial,
}: {
  initialDraft: Database['public']['Tables']['trip_drafts']['Row'] | null
  canChooseOfficial: boolean
  initialIsOfficial: boolean
}) => {
  if (initialDraft) {
    return toEventFormValuesFromDraft({
      draft: initialDraft,
      canChooseOfficial,
      timezoneFallback,
    })
  }
  return {
    values: emptyValues(initialIsOfficial),
    isNoLimitEnabled: true,
  }
}

type EventFormProps = {
  canChooseOfficial: boolean
  canManageTags: boolean
  initialIsOfficial: boolean
  initialDraft: Database['public']['Tables']['trip_drafts']['Row'] | null
  activityOptions: string[]
  publicHostOptions: Array<{ id: string; label: string }>
  leaderOptions: Array<{ id: string; label: string }>
  successPath: string
}

export function EventForm({
  canChooseOfficial,
  canManageTags,
  initialIsOfficial,
  initialDraft,
  activityOptions,
  publicHostOptions,
  leaderOptions,
  successPath,
}: EventFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin/')
  const handleCancel = () => {
    resetForm()
    router.push(successPath)
  }
  const initialState = resolveInitialFormState({
    initialDraft,
    canChooseOfficial,
    initialIsOfficial,
  })

  const [currentDraftId, setCurrentDraftId] = useState<string | null>(
    initialDraft?.id ?? null,
  )
  const [values, setValues] = useState<EventFormValues>(initialState.values)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [newActivityTag, setNewActivityTag] = useState('')
  const [activityOptionValues, setActivityOptionValues] =
    useState<string[]>(activityOptions)
  const [isNoLimitEnabled, setIsNoLimitEnabled] = useState(
    initialState.isNoLimitEnabled,
  )
  const [publicHostIds, setPublicHostIds] = useState<string[]>([])
  const [leaderUserIds, setLeaderUserIds] = useState<string[]>([])

  useEffect(() => {
    const nextState = resolveInitialFormState({
      initialDraft,
      canChooseOfficial,
      initialIsOfficial,
    })
    setValues(nextState.values)
    setCurrentDraftId(initialDraft?.id ?? null)
    setIsNoLimitEnabled(nextState.isNoLimitEnabled)
    setFieldErrors({})
    setFormError(null)
  }, [initialDraft, canChooseOfficial, initialIsOfficial])

  useEffect(() => {
    setValues(prev => ({
      ...prev,
      isOfficial: canChooseOfficial ? prev.isOfficial : false,
      visibility:
        !canChooseOfficial && prev.visibility === 'leaders_only'
          ? 'members'
          : prev.visibility,
    }))
  }, [canChooseOfficial])

  const resetForm = () => {
    setValues(emptyValues(initialIsOfficial))
    setCurrentDraftId(null)
    setFieldErrors({})
    setFormError(null)
    setIsSubmitting(false)
    setIsSavingDraft(false)
    setNewActivityTag('')
    setActivityOptionValues(activityOptions)
    setIsNoLimitEnabled(true)
    setPublicHostIds([])
    setLeaderUserIds([])
  }

  const updateField = <K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const toggleActivity = (activity: string) => {
    setValues(prev => {
      const next = new Set(prev.activityTypes ?? [])
      if (next.has(activity)) {
        next.delete(activity)
      } else {
        next.add(activity)
      }
      return { ...prev, activityTypes: Array.from(next) }
    })
  }

  const setActivityTypes = (activityTypes: string[]) => {
    setValues(prev => ({
      ...prev,
      activityTypes: Array.from(
        new Set(activityTypes.map(activity => activity.trim().toLowerCase())),
      ),
    }))
  }

  const addActivityTag = () => {
    const cleaned = newActivityTag.trim().toLowerCase()
    if (!cleaned) {
      return
    }

    setValues(prev => {
      const next = new Set(
        (prev.activityTypes ?? []).map(activity => activity.toLowerCase()),
      )
      next.add(cleaned)
      return { ...prev, activityTypes: Array.from(next) }
    })
    setNewActivityTag('')

    if (!canManageTags) {
      return
    }

    addTripTagOptionAction(cleaned)
      .then(() => {
        setActivityOptionValues(current =>
          current.includes(cleaned) ? current : [...current, cleaned],
        )
      })
      .catch(error => {
        setFormError(
          error instanceof Error ? error.message : 'Unable to add tag option.',
        )
      })
  }

  const removeActivityTags = (tagsToRemove: string[]) => {
    if (!canManageTags || !tagsToRemove.length) {
      return
    }

    removeTripTagOptionsAction(tagsToRemove)
      .then(() => {
        setActivityOptionValues(current =>
          current.filter(option => !tagsToRemove.includes(option)),
        )
      })
      .catch(error => {
        setFormError(
          error instanceof Error
            ? error.message
            : 'Unable to remove tag options.',
        )
      })
  }

  const setOfficial = (next: boolean) => {
    updateField('isOfficial', next)
  }

  const handleSaveDraft = async () => {
    setFormError(null)
    setFieldErrors({})
    setIsSavingDraft(true)

    try {
      const result = await saveTripDraftAction(
        { values, isNoLimitEnabled },
        currentDraftId,
      )
      setCurrentDraftId(result.id)
      router.replace(`${pathname}?draft=${result.id}`, { scroll: false })
    } catch (error: unknown) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to save draft',
      )
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    const parsed = eventFormSchema.safeParse(values)
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      const nextErrors: Record<string, string> = {}
      for (const [key, messages] of Object.entries(errors)) {
        if (messages && messages.length > 0) {
          nextErrors[key] = messages[0] ?? 'Invalid value'
        }
      }
      setFieldErrors(nextErrors)
      return
    }

    const maxParticipantsRaw = parsed.data.maxParticipants?.trim()
    if (!isNoLimitEnabled && maxParticipantsRaw) {
      const parsedMax = Number.parseInt(maxParticipantsRaw, 10)
      if (!Number.isFinite(parsedMax) || parsedMax <= 0) {
        setFieldErrors(prev => ({
          ...prev,
          maxParticipants: 'Enter a valid participant limit',
        }))
        return
      }
    }

    setIsSubmitting(true)
    try {
      await publishTripFormAction({
        values: parsed.data,
        isNoLimitEnabled,
        sourceDraftId: currentDraftId,
        publicHostIds,
        leaderUserIds,
      })

      resetForm()
      router.push(successPath)
    } catch (error: unknown) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to create event',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      id="trip-event-form"
      className="space-y-6 pb-8 md:pb-0"
      onSubmit={handleSubmit}
    >
      {formError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {formError}
        </div>
      )}

      <EventBasicsSection
        values={values}
        fieldErrors={fieldErrors}
        activityOptions={activityOptionValues}
        canManageTags={canManageTags}
        newActivityTag={newActivityTag}
        canChooseOfficial={canChooseOfficial}
        onOfficialChange={setOfficial}
        onFieldChange={updateField}
        onToggleActivity={toggleActivity}
        onSetActivityTypes={setActivityTypes}
        onNewActivityTagChange={setNewActivityTag}
        onAddActivityTag={addActivityTag}
        onRemoveActivityTags={removeActivityTags}
      />

      <EventDescriptionSection
        values={values}
        fieldErrors={fieldErrors}
        onFieldChange={updateField}
      />

      <EventScheduleSection
        values={values}
        fieldErrors={fieldErrors}
        onFieldChange={updateField}
      />

      <EventLocationsSection
        values={values}
        fieldErrors={fieldErrors}
        onFieldChange={updateField}
      />

      <EventDetailsSection values={values} onFieldChange={updateField} />

      <EventSettingsSection
        values={values}
        fieldErrors={fieldErrors}
        isNoLimitEnabled={isNoLimitEnabled}
        canChooseLeaderVisibility={canChooseOfficial}
        onNoLimitChange={setIsNoLimitEnabled}
        onFieldChange={updateField}
      />

      {canManageTags && (publicHostOptions.length || leaderOptions.length) ? (
        <Card>
          <CardHeader>
            <CardTitle>Trip hosts and leaders</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <fieldset>
              <legend className="text-sm font-semibold">
                Public host credits
              </legend>
              <p className="mt-1 text-xs text-muted-foreground">
                Names shown on the public trip page.
              </p>
              <div className="mt-3 grid gap-2">
                {publicHostOptions.map(option => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={publicHostIds.includes(option.id)}
                      onChange={event =>
                        setPublicHostIds(current =>
                          event.target.checked
                            ? [...current, option.id]
                            : current.filter(id => id !== option.id),
                        )
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold">
                Linked account leaders
              </legend>
              <p className="mt-1 text-xs text-muted-foreground">
                These assignments power assigned-only trip permissions.
              </p>
              <div className="mt-3 grid gap-2">
                {leaderOptions.map(option => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={leaderUserIds.includes(option.id)}
                      onChange={event =>
                        setLeaderUserIds(current =>
                          event.target.checked
                            ? [...current, option.id]
                            : current.filter(id => id !== option.id),
                        )
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </CardContent>
        </Card>
      ) : null}

      <EventFloatingActions
        admin={isAdmin}
        isSubmitting={isSubmitting}
        isSavingDraft={isSavingDraft}
        onSaveDraft={handleSaveDraft}
      />
      <div
        className={
          isAdmin
            ? 'hidden items-center justify-between lg:flex'
            : 'hidden items-center justify-between md:flex'
        }
      >
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 md:min-h-0"
          disabled={isSubmitting || isSavingDraft}
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <div className="grid gap-2 sm:grid-cols-2 md:flex md:items-center">
          <Button
            id="trip-save-draft-btn"
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-0"
            disabled={isSubmitting || isSavingDraft}
            onClick={handleSaveDraft}
          >
            {isSavingDraft ? 'Saving draft...' : 'Save as draft'}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isSavingDraft}
            className="min-h-11 md:min-h-0"
          >
            {isSubmitting
              ? 'Saving...'
              : values.isOfficial
                ? 'Create Official Trip'
                : 'Post Meetup'}
          </Button>
        </div>
      </div>
    </form>
  )
}
