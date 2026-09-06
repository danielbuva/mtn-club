'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { normalizeActivityTags } from '@/lib/events/activity-tags'
import { eventDateTimeToIso } from '@/lib/events/date-time'
import {
  toDraftRowInput,
  toEventFormValuesFromDraft,
} from '@/lib/events/drafts'
import { buildHostAssignments } from '@/lib/events/host-assignments'
import { type EventFormValues, eventFormSchema } from '@/lib/events/schema'
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

const mapVisibilityToTrip = (
  visibility: EventFormValues['visibility'],
): Database['public']['Enums']['trip_visibility'] => {
  if (visibility === 'public') {
    return 'public'
  }
  if (visibility === 'members') {
    return 'members'
  }
  return 'minimal'
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
    return 'members'
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

  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('role,status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

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

  const isActiveMember = membership?.status === 'active'
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
  sourceDraftId?: string | null
  publicHostIds?: string[]
  leaderUserIds?: string[]
}) {
  const { supabase, userId, canChooseOfficial, canManageTags } =
    await getViewerContext()

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
  const endsAt = eventDateTimeToIso(parsed.data.endAt, parsed.data.timezone)
  if (!startsAt || !endsAt) throw new Error('Enter valid trip dates.')

  // Avoid INSERT ... RETURNING: row-based visibility helpers cannot see the
  // new trip during the insertion statement. Authorization still uses INSERT RLS.
  const createdTrip = { id: crypto.randomUUID() }
  const hostAssignments = await buildHostAssignments(
    supabase,
    createdTrip.id,
    publicHostIds,
  )
  const tripInsert: Database['public']['Tables']['trips']['Insert'] = {
    id: createdTrip.id,
    created_by: userId,
    title: parsed.data.title.trim(),
    event_kind: parsed.data.kind,
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
    updated_at: new Date().toISOString(),
  }

  const { error: tripError } = await supabase.from('trips').insert(tripInsert)

  if (tripError) {
    throw tripError
  }

  if (canManageTags && normalizedTags.length) {
    const { error: tagOptionsError } = await supabase
      .from('trip_tag_options')
      .upsert(
        normalizedTags.map(tag => ({ tag })),
        { onConflict: 'tag' },
      )

    if (tagOptionsError) {
      throw tagOptionsError
    }
  }

  const meetupPoint = parsed.data.locationNotes?.trim() || null
  if (meetupPoint) {
    const { error: privateError } = await supabase.from('trip_private').upsert(
      {
        trip_id: createdTrip.id,
        meetup_point: meetupPoint,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'trip_id' },
    )

    if (privateError) {
      throw privateError
    }
  }

  const assignmentResults = await Promise.all([
    publicHostIds.length
      ? supabase.from('trip_hosts').insert(hostAssignments)
      : Promise.resolve({ error: null }),
    leaderUserIds.length
      ? supabase.from('trip_leaders').insert(
          leaderUserIds.map(leaderUserId => ({
            trip_id: createdTrip.id,
            user_id: leaderUserId,
          })),
        )
      : Promise.resolve({ error: null }),
  ])
  const assignmentError = assignmentResults.find(result => result.error)?.error
  if (assignmentError) throw assignmentError

  if (payload.sourceDraftId) {
    const parsedDraftId = tripDraftIdSchema.safeParse(payload.sourceDraftId)
    if (!parsedDraftId.success) {
      throw new Error('Invalid draft id.')
    }

    const { error: deleteError } = await supabase
      .from('trip_drafts')
      .delete()
      .eq('id', parsedDraftId.data)

    if (deleteError) {
      throw deleteError
    }
  }

  revalidatePath('/trips')
  revalidatePath('/trips/new')
  revalidatePath('/trips/drafts')
  revalidatePath(`/trips/${createdTrip.id}`)

  let configurationPending = false
  let informedRisksPending = false
  if (parsed.data.collectTransportation) {
    const { error } = await supabase.rpc('set_trip_transportation_collection', {
      p_trip_id: createdTrip.id,
      p_enabled: true,
    })
    configurationPending = Boolean(error)
  }
  if (
    parsed.data.informedRisks?.trim() &&
    parsed.data.waiverActivities?.length
  ) {
    const { error } = await supabase.rpc('save_trip_informed_risks', {
      p_trip: createdTrip.id,
      p_revision: 0,
      p_statements: parsed.data.informedRisks
        .split('\n')
        .map(value => value.trim())
        .filter(Boolean),
      p_activities: parsed.data.waiverActivities,
    })
    informedRisksPending = Boolean(error)
  } else informedRisksPending = true
  return { tripId: createdTrip.id, configurationPending, informedRisksPending }
}

export async function publishTripDraftAction(draftId: string) {
  const { supabase, canChooseOfficial } = await getViewerContext()
  const parsedDraftId = tripDraftIdSchema.safeParse(draftId)
  if (!parsedDraftId.success) {
    throw new Error('Invalid draft id.')
  }

  const { data: draft, error: draftError } = await supabase
    .from('trip_drafts')
    .select('*')
    .eq('id', parsedDraftId.data)
    .single()

  if (draftError) {
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
