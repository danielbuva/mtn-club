'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

const tripIdSchema = z.string().uuid()
const resolveTripId = (formData: FormData) =>
  tripIdSchema.parse(formData.get('tripId'))

const tripDifficultySchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'expert',
])

const parseStringField = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const parseDateField = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }
  const asDate = new Date(value)
  if (Number.isNaN(asDate.getTime())) {
    throw new Error('Invalid date value.')
  }
  return asDate.toISOString()
}

const parseActivityTags = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') {
    return [] as string[]
  }

  let parsed: unknown = []
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error('Invalid activity tags payload.')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Invalid activity tags payload.')
  }

  const normalized = parsed
    .map(tag => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
    .filter(Boolean)

  return Array.from(new Set(normalized))
}

const parseUuidList = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return null
  const parsed: unknown = JSON.parse(value)
  return z.array(z.string().uuid()).max(20).parse(parsed)
}

const assertTagManager = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Sign in required.')
  }

  const permission = await supabase.rpc('has_admin_capability', {
    p_uid: user.id,
    p_capability_key: 'trips.update',
  })
  if (permission.error) throw permission.error
  if (!permission.data) {
    throw new Error('Trip management permission is required.')
  }
}

export async function saveTripDetailEditsAction(formData: FormData) {
  const tripId = resolveTripId(formData)
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(
      `/auth/login?returnTo=${encodeURIComponent(`/trips/${tripId}?edit=1`)}`,
    )
  }

  const { data: canEdit } = await supabase.rpc('has_trip_admin_capability', {
    p_uid: user.id,
    p_capability_key: 'trips.update',
    p_trip_id: tripId,
  })
  if (!canEdit) {
    throw new Error('Trip update permission required.')
  }

  const rawDifficulty = formData.get('difficulty')
  const parsedDifficulty = tripDifficultySchema.safeParse(rawDifficulty)
  const difficulty = parsedDifficulty.success ? parsedDifficulty.data : null
  const dbDifficulty =
    difficulty === 'advanced'
      ? ('hard' as Database['public']['Enums']['trip_difficulty'])
      : difficulty

  const activityTags = parseActivityTags(formData.get('activityTags'))
  const startsAt = parseDateField(formData.get('startAt'))
  const endsAt = parseDateField(formData.get('endAt'))

  const tripUpdate: Database['public']['Tables']['trips']['Update'] = {
    title: parseStringField(formData.get('title')) ?? 'Untitled Trip',
    description_public: parseStringField(formData.get('summary')),
    location_public: parseStringField(formData.get('locationName')),
    overview_what: parseStringField(formData.get('overviewWhat')),
    overview_where: parseStringField(formData.get('overviewWhere')),
    overview_weather: parseStringField(formData.get('overviewWeather')),
    overview_equipment: parseStringField(formData.get('overviewEquipment')),
    overview_carpool_need_gear: parseStringField(
      formData.get('overviewCarpoolNeedGear'),
    ),
    difficulty: dbDifficulty ?? undefined,
    activity_tags: activityTags,
    starts_at: startsAt ?? undefined,
    ends_at: endsAt ?? undefined,
    updated_at: new Date().toISOString(),
  }

  const { error: tripError } = await supabase
    .from('trips')
    .update(tripUpdate)
    .eq('id', tripId)

  if (tripError) {
    throw tripError
  }

  const meetupPoint = parseStringField(formData.get('locationNotes'))
  const { error: privateError } = await supabase.from('trip_private').upsert(
    {
      trip_id: tripId,
      meetup_point: meetupPoint,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'trip_id' },
  )

  if (privateError) {
    throw privateError
  }

  if (activityTags.length) {
    const { error: tagOptionsError } = await supabase
      .from('trip_tag_options')
      .upsert(
        activityTags.map(tag => ({ tag })),
        { onConflict: 'tag' },
      )

    if (tagOptionsError) {
      throw tagOptionsError
    }
  }

  const publicHostIds = parseUuidList(formData.get('publicHostIds'))
  const leaderIds = parseUuidList(formData.get('leaderIds'))
  if (publicHostIds || leaderIds) {
    const scope = await supabase.rpc('admin_capability_scope', {
      p_uid: user.id,
      p_capability_key: 'trips.update',
    })
    if (scope.error) throw scope.error
    if (scope.data !== 'all') {
      throw new Error('All-trip permission is required to reassign leaders.')
    }
    const deletionResults = await Promise.all([
      supabase.from('trip_hosts').delete().eq('trip_id', tripId),
      supabase.from('trip_leaders').delete().eq('trip_id', tripId),
    ])
    const deletionError = deletionResults.find(result => result.error)?.error
    if (deletionError) throw deletionError
    const insertionResults = await Promise.all([
      publicHostIds?.length
        ? supabase.from('trip_hosts').insert(
            publicHostIds.map((hostId, index) => ({
              trip_id: tripId,
              host_id: hostId,
              sort_order: index,
            })),
          )
        : Promise.resolve({ error: null }),
      leaderIds?.length
        ? supabase.from('trip_leaders').insert(
            leaderIds.map(leaderId => ({
              trip_id: tripId,
              user_id: leaderId,
            })),
          )
        : Promise.resolve({ error: null }),
    ])
    const insertionError = insertionResults.find(result => result.error)?.error
    if (insertionError) throw insertionError
  }

  revalidatePath('/trips')
  revalidatePath(`/trips/${tripId}`)
  revalidatePath('/calendar')
  return { ok: true }
}

export async function addTripTagOptionAction(rawTag: string) {
  const normalizedTag = rawTag.trim().toLowerCase()
  if (!normalizedTag) {
    throw new Error('Tag cannot be empty.')
  }

  const supabase = await createClient()
  await assertTagManager(supabase)

  const { error } = await supabase
    .from('trip_tag_options')
    .upsert({ tag: normalizedTag }, { onConflict: 'tag' })

  if (error) {
    throw error
  }

  revalidatePath('/trips/new')
  revalidatePath('/trips')
  return { tag: normalizedTag }
}

export async function removeTripTagOptionsAction(rawTags: string[]) {
  const normalizedTags = Array.from(
    new Set(rawTags.map(tag => tag.trim().toLowerCase()).filter(Boolean)),
  )

  if (!normalizedTags.length) {
    return { removed: 0 }
  }

  const supabase = await createClient()
  await assertTagManager(supabase)

  const { error } = await supabase
    .from('trip_tag_options')
    .delete()
    .in('tag', normalizedTags)

  if (error) {
    throw error
  }

  revalidatePath('/trips/new')
  revalidatePath('/trips')
  return { removed: normalizedTags.length }
}
