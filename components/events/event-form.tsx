'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { eventFormSchema, type EventFormValues } from '@/lib/events/schema'
import { createEvent } from '@/lib/events/queries'
import { EventBasicsSection } from '@/components/events/sections/event-basics-section'
import { EventScheduleSection } from '@/components/events/sections/event-schedule-section'
import { EventLocationsSection } from '@/components/events/sections/event-locations-section'
import { EventSettingsSection } from '@/components/events/sections/event-settings-section'

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
  visibility: 'members',
  status: isOfficial ? 'draft' : 'published',
  maxParticipants: '',
  difficulty: undefined,
  isOfficial,
})

type EventFormProps = {
  clubId: string
  membershipId: string
  canChooseOfficial: boolean
  initialIsOfficial: boolean
}

export function EventForm({ clubId, membershipId, canChooseOfficial, initialIsOfficial }: EventFormProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [values, setValues] = useState<EventFormValues>(() => emptyValues(initialIsOfficial))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setValues((prev) => ({
      ...prev,
      isOfficial: canChooseOfficial ? prev.isOfficial : false,
      status: canChooseOfficial ? prev.status : 'published',
    }))
  }, [canChooseOfficial])

  const updateField = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const toggleActivity = (activity: string) => {
    setValues((prev) => {
      const next = new Set(prev.activityTypes ?? [])
      if (next.has(activity)) {
        next.delete(activity)
      } else {
        next.add(activity)
      }
      return { ...prev, activityTypes: Array.from(next) }
    })
  }

  const setOfficial = (next: boolean) => {
    updateField('isOfficial', next)
    updateField('status', next ? values.status : 'published')
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
    let maxParticipants: number | null = null

    if (maxParticipantsRaw) {
      const parsedMax = Number.parseInt(maxParticipantsRaw, 10)
      if (!Number.isFinite(parsedMax) || parsedMax <= 0) {
        setFieldErrors((prev) => ({
          ...prev,
          maxParticipants: 'Enter a valid participant limit',
        }))
        return
      }
      maxParticipants = parsedMax
    }

    setIsSubmitting(true)
    try {
      const payload = {
        club_id: clubId,
        created_by_membership_id: membershipId,
        title: parsed.data.title,
        short_summary: parsed.data.shortSummary?.trim() || null,
        kind: parsed.data.kind,
        activity_types: parsed.data.activityTypes ?? [],
        start_at: new Date(parsed.data.startAt).toISOString(),
        end_at: new Date(parsed.data.endAt).toISOString(),
        timezone: parsed.data.timezone,
        primary_location_name: parsed.data.primaryLocationName,
        meeting_location_name: parsed.data.meetingLocationName?.trim() || null,
        visibility: parsed.data.visibility,
        status: parsed.data.isOfficial ? parsed.data.status : 'published',
        capacity: maxParticipants,
        difficulty: parsed.data.difficulty ?? null,
        is_official: parsed.data.isOfficial,
        last_updated_at: new Date().toISOString(),
      }

      await createEvent(supabase, payload)
      router.push('/calendar')
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Unable to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {formError && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">{formError}</CardContent>
        </Card>
      )}

      <EventBasicsSection
        values={values}
        fieldErrors={fieldErrors}
        canChooseOfficial={canChooseOfficial}
        onOfficialChange={setOfficial}
        onFieldChange={updateField}
        onToggleActivity={toggleActivity}
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

      <EventSettingsSection
        values={values}
        fieldErrors={fieldErrors}
        onFieldChange={updateField}
      />

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push('/calendar')}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-xl">
          {isSubmitting ? 'Saving...' : values.isOfficial ? 'Create Official Trip' : 'Post Meetup'}
        </Button>
      </div>
    </form>
  )
}
