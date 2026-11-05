'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { normalizeActivityTags } from '@/lib/events/activity-tags'
import { eventDateTimeToIso } from '@/lib/events/date-time'
import {
  toDraftRowInput,
  toEventFormValuesFromDraft,
} from '@/lib/events/drafts'
import { type EventFormValues, eventFormSchema } from '@/lib/events/schema'
import { mapVisibilityToTrip } from '@/lib/events/visibility'
import { riskStatements } from '@/lib/registration/risk-activities'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

const tripDraftIdSchema = z.string().uuid()
const publishFieldLabels: Partial<Record<keyof EventFormValues, string>> = {
  title: 'Title',
  startAt: 'When (start)',
  endAt: 'When (end)',
  timezone: 'Timezone',
  primaryLocationName: 'Where',
}

const mapDifficultyToTrip = (
  difficulty: EventFormValues['difficulty'],
): Database['public']['Enums']['trip_difficulty'] | null => {
  if (!difficulty) {
    return null
  }
  if (difficulty === 'Moderate') {
    return 'intermediate'
  }
  if (difficulty === 'Challenging') {
    return 'hard'
  }
  if (difficulty === 'Expert') {
    return 'expert'
  }
  return 'beginner'
}

const resolveAllowedVisibility = (
  visibility: EventFormValues['visibility'],
  canChooseOfficial: boolean,
): EventFormValues['visibility'] => {
  if (!canChooseOfficial && visibility === 'leaders_only') {
    throw new Error(
      'Trip administration permission is required for leaders-only visibility.',
    )
  }
  return visibility
}

const getViewerContext = async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }
  if (!user) {
    throw new Error('Sign in required.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }
  if (!profile) {
    throw new Error('A profile is required to manage drafts.')
  }

  const { data: isActiveMember, error: membershipError } = await supabase.rpc(
    'is_active_member',
    { p_uid: user.id },
  )

  if (membershipError) {
    throw membershipError
  }

  const [createScopeResult, officialScopeResult, updateScopeResult] =
    await Promise.all([
      supabase.rpc('admin_capability_scope', {
        p_uid: user.id,
        p_capability_key: 'trips.create',
      }),
      supabase.rpc('admin_capability_scope', {
        p_uid: user.id,
        p_capability_key: 'trips.official',
      }),
      supabase.rpc('admin_capability_scope', {
        p_uid: user.id,
        p_capability_key: 'trips.update',
      }),
    ])

  const canCreateAsAdmin = Boolean(createScopeResult.data)
  if (!isActiveMember && !canCreateAsAdmin) {
    throw new Error('Active membership or trip administration access required.')
  }

  return {
    supabase,
    userId: user.id,
    canChooseOfficial: Boolean(officialScopeResult.data),
    canManageTags: Boolean(updateScopeResult.data),
  }
}

export async function saveTripDraftAction(
  payload: {
    values: EventFormValues
    isNoLimitEnabled: boolean
    publicHostIds?: string[]
    leaderUserIds?: string[]
  },
  draftId?: string | null,
) {
  const { supabase, userId, canChooseOfficial, canManageTags } =
    await getViewerContext()
  const draftInput = toDraftRowInput({
    values: payload.values,
    isNoLimitEnabled: payload.isNoLimitEnabled,
    createdBy: userId,
    canChooseOfficial,
  })

  if (canManageTags) {
    draftInput.public_host_ids = z
      .array(z.string().uuid())
      .max(20)
      .parse(payload.publicHostIds ?? [])
    draftInput.leader_user_ids = z
      .array(z.string().uuid())
      .max(20)
      .parse(payload.leaderUserIds ?? [])
  }

  if (draftId) {
    const parsedDraftId = tripDraftIdSchema.safeParse(draftId)
    if (!parsedDraftId.success) {
      throw new Error('Invalid draft id.')
    }

    const { data, error } = await supabase
      .from('trip_drafts')
      .update(draftInput)
      .eq('id', parsedDraftId.data)
      .select('id')
      .single()

    if (error) {
      throw error
    }

    revalidatePath('/trips/new')
    revalidatePath('/trips/drafts')
    return { id: data.id }
  }

  const { data, error } = await supabase
    .from('trip_drafts')
    .insert(draftInput)
    .select('id')
    .single()

  if (error) {
    throw error
  }

  revalidatePath('/trips/new')
  revalidatePath('/trips/drafts')
  return { id: data.id }
}

export async function getUserDraftsAction() {
  const { supabase, userId } = await getViewerContext()
  const { data, error } = await supabase
    .from('trip_drafts')
    .select('*')
    .eq('created_by', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function deleteTripDraftAction(draftId: string) {
  const { supabase } = await getViewerContext()
  const parsedDraftId = tripDraftIdSchema.safeParse(draftId)
  if (!parsedDraftId.success) {
    throw new Error('Invalid draft id.')
  }

  const { error } = await supabase
    .from('trip_drafts')
    .delete()
    .eq('id', parsedDraftId.data)

  if (error) {
    throw error
  }

  revalidatePath('/trips/new')
  revalidatePath('/trips/drafts')
  return { ok: true }
}

export async function publishTripFormAction(payload: {
  values: EventFormValues
  isNoLimitEnabled: boolean
  sourceDraftId: string
  publicHostIds?: string[]
  leaderUserIds?: string[]
}) {
  const { supabase, canChooseOfficial, canManageTags } =
    await getViewerContext()
  const sourceDraftId = tripDraftIdSchema.parse(payload.sourceDraftId)
  const { data: publishedTripId, error: publicationError } = await supabase.rpc(
    'get_published_trip_for_draft',
    { p_draft_id: sourceDraftId },
  )
  if (publicationError) throw publicationError
  if (publishedTripId) {
    return {
      tripId: publishedTripId,
      configurationPending: false,
      informedRisksPending: false,
    }
  }

  const parsed = eventFormSchema.safeParse(payload.values)
  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors
    const details = Object.entries(flattened)
      .map(([field, messages]) => {
        if (!messages?.length) {
          return null
        }
        const label =
          publishFieldLabels[field as keyof EventFormValues] ?? field
        return `${label}: ${messages[0]}`
      })
      .filter(Boolean)
    throw new Error(
      details.length
        ? `Draft is incomplete. ${details.join(' | ')}`
        : 'Please complete required fields.',
    )
  }

  const maxParticipantsRaw = parsed.data.maxParticipants?.trim()
  let maxParticipants: number | null = null

  if (!payload.isNoLimitEnabled) {
    const parsedMax = Number(maxParticipantsRaw)
    if (!Number.isInteger(parsedMax) || parsedMax < 1 || parsedMax > 100000) {
      throw new Error('Enter a valid participant limit.')
    }
    maxParticipants = parsedMax
  }

  const isOfficial = canChooseOfficial ? parsed.data.isOfficial : false
  const visibility = resolveAllowedVisibility(
    parsed.data.visibility,
    canChooseOfficial,
  )
  const normalizedTags = normalizeActivityTags(parsed.data.activityTypes ?? [])

  const publicHostIds = z
    .array(z.string().uuid())
    .max(20)
    .parse(payload.publicHostIds ?? [])
  const leaderUserIds = z
    .array(z.string().uuid())
    .max(20)
    .parse(payload.leaderUserIds ?? [])
  if ((publicHostIds.length || leaderUserIds.length) && !canManageTags) {
    throw new Error('Trip management permission is required to assign hosts.')
  }

  const startsAt = eventDateTimeToIso(parsed.data.startAt, parsed.data.timezone)
  const endsAt = parsed.data.noEndTime
    ? null
    : eventDateTimeToIso(parsed.data.endAt, parsed.data.timezone)
  if (!startsAt || (!parsed.data.noEndTime && !endsAt))
    throw new Error('Enter valid trip dates.')

  const tripInsert = {
    title: parsed.data.title.trim(),
    event_kind: parsed.data.kind,
    registration_opens_at: eventDateTimeToIso(
      parsed.data.registrationOpensAt ?? '',
      parsed.data.timezone,
    ),
    rsvp_deadline: eventDateTimeToIso(
      parsed.data.registrationClosesAt ?? '',
      parsed.data.timezone,
    ),
    waitlist_enabled: parsed.data.waitlistEnabled ?? false,
    elevation_ft: parsed.data.elevationFt?.trim()
      ? Number(parsed.data.elevationFt)
      : null,
    starts_at: startsAt,
    ends_at: endsAt,
    time_zone: parsed.data.timezone,
    activity_tags: normalizedTags,
    visibility: mapVisibilityToTrip(visibility),
    difficulty: mapDifficultyToTrip(parsed.data.difficulty),
    location_public: parsed.data.primaryLocationName.trim(),
    description_public: parsed.data.shortSummary?.trim() || null,
    overview_what: parsed.data.overviewWhat?.trim() || null,
    overview_where:
      [
        parsed.data.meetingLocationName?.trim()
          ? `Meeting point: ${parsed.data.meetingLocationName.trim()}`
          : '',
        parsed.data.overviewWhere?.trim(),
      ]
        .filter(Boolean)
        .join('\n\n') || null,
    overview_weather: parsed.data.overviewWeather?.trim() || null,
    overview_equipment: parsed.data.overviewEquipment?.trim() || null,
    overview_carpool_need_gear:
      parsed.data.overviewCarpoolNeedGear?.trim() || null,
    capacity: maxParticipants,
    is_official: isOfficial,
    is_all_day: false,
  } satisfies Database['public']['Tables']['trips']['Insert']

  const { data: tripId, error: publishError } = await supabase.rpc(
    'publish_trip_draft',
    {
      p_draft_id: sourceDraftId,
      p_data: tripInsert,
      p_meetup_point: parsed.data.locationNotes?.trim() || null,
      p_public_host_ids: publicHostIds,
      p_leader_user_ids: leaderUserIds,
      p_risk_statements: riskStatements(
        parsed.data.waiverActivities ?? [],
        parsed.data.informedRisks,
      ),
      p_waiver_activities: parsed.data.waiverActivities ?? [],
      p_registration_enabled: parsed.data.registrationEnabled ?? false,
      p_collect_transportation: parsed.data.collectTransportation,
    },
  )
  if (publishError) throw publishError

  revalidatePath('/schedule')
  revalidatePath('/calendar')
  revalidatePath('/trips')
  revalidatePath('/trips/new')
  revalidatePath('/trips/drafts')
  revalidatePath(`/trips/${tripId}`)
  return { tripId, configurationPending: false, informedRisksPending: false }
}

export async function publishTripDraftAction(draftId: string) {
  const { supabase, canChooseOfficial } = await getViewerContext()
  const parsedDraftId = tripDraftIdSchema.safeParse(draftId)
  if (!parsedDraftId.success) {
    throw new Error('Invalid draft id.')
  }

  const { data: publishedTripId, error: publicationError } = await supabase.rpc(
    'get_published_trip_for_draft',
    { p_draft_id: parsedDraftId.data },
  )
  if (publicationError) throw publicationError
  if (publishedTripId) {
    return {
      tripId: publishedTripId,
      configurationPending: false,
      informedRisksPending: false,
    }
  }

  const { data: draft, error: draftError } = await supabase
    .from('trip_drafts')
    .select('*')
    .eq('id', parsedDraftId.data)
    .single()

  if (draftError) {
    // A simultaneous publisher may have consumed the draft after our first read.
    const { data: tripId, error } = await supabase.rpc(
      'get_published_trip_for_draft',
      { p_draft_id: parsedDraftId.data },
    )
    if (error) throw error
    if (tripId) {
      return {
        tripId,
        configurationPending: false,
        informedRisksPending: false,
      }
    }
    throw draftError
  }

  const mapped = toEventFormValuesFromDraft({
    draft,
    canChooseOfficial,
    timezoneFallback: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  return publishTripFormAction({
    values: mapped.values,
    isNoLimitEnabled: mapped.isNoLimitEnabled,
    sourceDraftId: draft.id,
    publicHostIds: draft.public_host_ids,
    leaderUserIds: draft.leader_user_ids,
  })
}

export async function configureTripTransportationAction(
  tripId: string,
  enabled: boolean,
) {
  const { supabase } = await getViewerContext()
  const { error } = await supabase.rpc('set_trip_transportation_collection', {
    p_trip_id: z.string().uuid().parse(tripId),
    p_enabled: z.boolean().parse(enabled),
  })
  if (error)
    throw new Error(
      'Your trip is published, but transportation settings could not be saved. Retry to finish configuration; no duplicate trip will be created.',
    )
  revalidatePath(`/trips/${tripId}`)
  revalidatePath(`/trips/${tripId}/rsvp`)
}
