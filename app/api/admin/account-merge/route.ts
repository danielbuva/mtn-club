import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

const mergeRequestSchema = z.object({
  primaryUserId: z.string().uuid(),
  secondaryUserId: z.string().uuid(),
  dryRun: z.boolean().default(true),
})

type MergeRequest = z.infer<typeof mergeRequestSchema>

type CountReport = Record<string, number>

type MergeAudit = {
  primaryUserId: string
  secondaryUserId: string
  dryRun: boolean
  selectedBy: 'request' | 'email_identity' | 'oldest_created_at'
  counts: CountReport
}

type AuthUserSummary = {
  id: string
  createdAt: string | null
  hasEmailIdentity: boolean
}

const getTodayDate = () => new Date().toISOString().slice(0, 10)

const parseAuthUserSummary = (user: {
  id: string
  created_at?: string | null
  identities?: Array<{ provider?: string | null }> | null
}): AuthUserSummary => ({
  id: user.id,
  createdAt: user.created_at ?? null,
  hasEmailIdentity: Boolean(
    user.identities?.some(identity => identity.provider === 'email'),
  ),
})

const assertAdmin = async () => {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false as const, status: 401, error: 'Unauthorized.' }
  }

  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (membershipError) {
    return { ok: false as const, status: 500, error: membershipError.message }
  }

  if (membership?.role !== 'admin') {
    return { ok: false as const, status: 403, error: 'Admin access required.' }
  }

  return { ok: true as const, userId: user.id }
}

const resolvePrimaryAndSecondary = (
  payload: MergeRequest,
  first: AuthUserSummary,
  second: AuthUserSummary,
) => {
  if (payload.primaryUserId) {
    if (payload.primaryUserId === first.id) {
      return {
        primaryUserId: first.id,
        secondaryUserId: second.id,
        selectedBy: 'request' as const,
      }
    }

    if (payload.primaryUserId === second.id) {
      return {
        primaryUserId: second.id,
        secondaryUserId: first.id,
        selectedBy: 'request' as const,
      }
    }

    throw new Error('primaryUserId must match one of the two provided users.')
  }

  if (first.hasEmailIdentity !== second.hasEmailIdentity) {
    return first.hasEmailIdentity
      ? {
          primaryUserId: first.id,
          secondaryUserId: second.id,
          selectedBy: 'email_identity' as const,
        }
      : {
          primaryUserId: second.id,
          secondaryUserId: first.id,
          selectedBy: 'email_identity' as const,
        }
  }

  const firstCreatedAt = first.createdAt
    ? new Date(first.createdAt).getTime()
    : Number.POSITIVE_INFINITY
  const secondCreatedAt = second.createdAt
    ? new Date(second.createdAt).getTime()
    : Number.POSITIVE_INFINITY

  return firstCreatedAt <= secondCreatedAt
    ? {
        primaryUserId: first.id,
        secondaryUserId: second.id,
        selectedBy: 'oldest_created_at' as const,
      }
    : {
        primaryUserId: second.id,
        secondaryUserId: first.id,
        selectedBy: 'oldest_created_at' as const,
      }
}

const buildDryRunCounts = async (
  admin: ReturnType<typeof createAdminClient>,
  primaryUserId: string,
  secondaryUserId: string,
): Promise<CountReport> => {
  const [
    profilesSecondary,
    profilePrivateSecondary,
    membershipsSecondary,
    preferencesSecondary,
    tripsCreatedSecondary,
    tripLeadersSecondary,
    tripRsvpsSecondary,
    tripFavoritesSecondary,
    tripCarpoolsSecondary,
    tripAttendanceSecondary,
    tripCommentsSecondary,
    userWaiversSecondary,
    tripLeadersPrimary,
    tripRsvpsPrimary,
    tripFavoritesPrimary,
    tripAttendancePrimary,
  ] = await Promise.all([
    admin
      .from('profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', secondaryUserId),
    admin
      .from('profile_private')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', secondaryUserId),
    admin
      .from('memberships')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', secondaryUserId),
    admin
      .from('user_preferences')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', secondaryUserId),
    admin
      .from('trips')
      .select('created_by', { count: 'exact', head: true })
      .eq('created_by', secondaryUserId),
    admin
      .from('trip_leaders')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', secondaryUserId),
    admin
      .from('trip_rsvps')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', secondaryUserId),
    admin
      .from('trip_favorites')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', secondaryUserId),
    admin
      .from('trip_carpools')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', secondaryUserId),
    admin
      .from('trip_attendance')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', secondaryUserId),
    admin
      .from('trip_comments')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', secondaryUserId),
    admin
      .from('user_waivers')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', secondaryUserId),
    admin
      .from('trip_leaders')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', primaryUserId),
    admin
      .from('trip_rsvps')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', primaryUserId),
    admin
      .from('trip_favorites')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', primaryUserId),
    admin
      .from('trip_attendance')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', primaryUserId),
  ])

  const responses = [
    profilesSecondary,
    profilePrivateSecondary,
    membershipsSecondary,
    preferencesSecondary,
    tripsCreatedSecondary,
    tripLeadersSecondary,
    tripRsvpsSecondary,
    tripFavoritesSecondary,
    tripCarpoolsSecondary,
    tripAttendanceSecondary,
    tripCommentsSecondary,
    userWaiversSecondary,
    tripLeadersPrimary,
    tripRsvpsPrimary,
    tripFavoritesPrimary,
    tripAttendancePrimary,
  ]

  for (const response of responses) {
    if (response.error) {
      throw response.error
    }
  }

  return {
    secondary_profiles: profilesSecondary.count ?? 0,
    secondary_profile_private: profilePrivateSecondary.count ?? 0,
    secondary_memberships: membershipsSecondary.count ?? 0,
    secondary_user_preferences: preferencesSecondary.count ?? 0,
    secondary_trips_created: tripsCreatedSecondary.count ?? 0,
    secondary_trip_leaders: tripLeadersSecondary.count ?? 0,
    secondary_trip_rsvps: tripRsvpsSecondary.count ?? 0,
    secondary_trip_favorites: tripFavoritesSecondary.count ?? 0,
    secondary_trip_carpools: tripCarpoolsSecondary.count ?? 0,
    secondary_trip_attendance: tripAttendanceSecondary.count ?? 0,
    secondary_trip_comments: tripCommentsSecondary.count ?? 0,
    secondary_user_waivers: userWaiversSecondary.count ?? 0,
    primary_trip_leaders: tripLeadersPrimary.count ?? 0,
    primary_trip_rsvps: tripRsvpsPrimary.count ?? 0,
    primary_trip_favorites: tripFavoritesPrimary.count ?? 0,
    primary_trip_attendance: tripAttendancePrimary.count ?? 0,
  }
}

const applyMerge = async (
  admin: ReturnType<typeof createAdminClient>,
  primaryUserId: string,
  secondaryUserId: string,
) => {
  const [primaryProfileRes, secondaryProfileRes] = await Promise.all([
    admin
      .from('profiles')
      .select('*')
      .eq('user_id', primaryUserId)
      .maybeSingle(),
    admin
      .from('profiles')
      .select('*')
      .eq('user_id', secondaryUserId)
      .maybeSingle(),
  ])
  if (primaryProfileRes.error) throw primaryProfileRes.error
  if (secondaryProfileRes.error) throw secondaryProfileRes.error

  const primaryProfile = primaryProfileRes.data
  const secondaryProfile = secondaryProfileRes.data

  if (primaryProfile || secondaryProfile) {
    const mergedProfile: Database['public']['Tables']['profiles']['Insert'] = {
      user_id: primaryUserId,
      display_name:
        primaryProfile?.display_name ??
        secondaryProfile?.display_name ??
        'Member',
      first_name:
        primaryProfile?.first_name ?? secondaryProfile?.first_name ?? null,
      last_name:
        primaryProfile?.last_name ?? secondaryProfile?.last_name ?? null,
      avatar_url:
        primaryProfile?.avatar_url ?? secondaryProfile?.avatar_url ?? null,
      bio: primaryProfile?.bio ?? secondaryProfile?.bio ?? null,
      pronouns: primaryProfile?.pronouns ?? secondaryProfile?.pronouns ?? null,
      username: primaryProfile?.username ?? secondaryProfile?.username ?? null,
      created_at:
        primaryProfile?.created_at ??
        secondaryProfile?.created_at ??
        new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: profileUpsertError } = await admin
      .from('profiles')
      .upsert(mergedProfile, { onConflict: 'user_id' })

    if (profileUpsertError) throw profileUpsertError
  }

  const { error: profileDeleteError } = await admin
    .from('profiles')
    .delete()
    .eq('user_id', secondaryUserId)

  if (profileDeleteError) throw profileDeleteError

  const [primaryPrivateRes, secondaryPrivateRes] = await Promise.all([
    admin
      .from('profile_private')
      .select('*')
      .eq('user_id', primaryUserId)
      .maybeSingle(),
    admin
      .from('profile_private')
      .select('*')
      .eq('user_id', secondaryUserId)
      .maybeSingle(),
  ])
  if (primaryPrivateRes.error) throw primaryPrivateRes.error
  if (secondaryPrivateRes.error) throw secondaryPrivateRes.error

  const primaryPrivate = primaryPrivateRes.data
  const secondaryPrivate = secondaryPrivateRes.data

  if (primaryPrivate || secondaryPrivate) {
    const mergedPrivate: Database['public']['Tables']['profile_private']['Insert'] =
      {
        user_id: primaryUserId,
        phone: primaryPrivate?.phone ?? secondaryPrivate?.phone ?? null,
        birthday:
          primaryPrivate?.birthday ?? secondaryPrivate?.birthday ?? null,
        emergency_contact:
          primaryPrivate?.emergency_contact ??
          secondaryPrivate?.emergency_contact ??
          null,
        gear_profile:
          primaryPrivate?.gear_profile ??
          secondaryPrivate?.gear_profile ??
          null,
        carpool_profile:
          primaryPrivate?.carpool_profile ??
          secondaryPrivate?.carpool_profile ??
          null,
        general_waiver_signed_at:
          primaryPrivate?.general_waiver_signed_at ??
          secondaryPrivate?.general_waiver_signed_at ??
          null,
        general_waiver_version:
          primaryPrivate?.general_waiver_version ??
          secondaryPrivate?.general_waiver_version ??
          null,
        privacy_settings:
          primaryPrivate?.privacy_settings ??
          secondaryPrivate?.privacy_settings ??
          null,
        travel_profile:
          primaryPrivate?.travel_profile ??
          secondaryPrivate?.travel_profile ??
          null,
        skills_certs:
          primaryPrivate?.skills_certs ??
          secondaryPrivate?.skills_certs ??
          null,
        interests_preferences:
          primaryPrivate?.interests_preferences ??
          secondaryPrivate?.interests_preferences ??
          null,
        notification_settings:
          primaryPrivate?.notification_settings ??
          secondaryPrivate?.notification_settings ??
          null,
        created_at:
          primaryPrivate?.created_at ??
          secondaryPrivate?.created_at ??
          new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

    const { error: privateUpsertError } = await admin
      .from('profile_private')
      .upsert(mergedPrivate, { onConflict: 'user_id' })

    if (privateUpsertError) throw privateUpsertError
  }

  const { error: privateDeleteError } = await admin
    .from('profile_private')
    .delete()
    .eq('user_id', secondaryUserId)

  if (privateDeleteError) throw privateDeleteError

  const [primaryMembershipRes, secondaryMembershipRes] = await Promise.all([
    admin
      .from('memberships')
      .select('*')
      .eq('user_id', primaryUserId)
      .maybeSingle(),
    admin
      .from('memberships')
      .select('*')
      .eq('user_id', secondaryUserId)
      .maybeSingle(),
  ])
  if (primaryMembershipRes.error) throw primaryMembershipRes.error
  if (secondaryMembershipRes.error) throw secondaryMembershipRes.error

  const primaryMembership = primaryMembershipRes.data
  const secondaryMembership = secondaryMembershipRes.data

  if (primaryMembership || secondaryMembership) {
    const mergedMembership: Database['public']['Tables']['memberships']['Insert'] =
      {
        user_id: primaryUserId,
        role: primaryMembership?.role ?? secondaryMembership?.role ?? 'regular',
        status:
          primaryMembership?.status ??
          secondaryMembership?.status ??
          'inactive',
        joined_on:
          primaryMembership?.joined_on ??
          secondaryMembership?.joined_on ??
          getTodayDate(),
        member_since:
          primaryMembership?.member_since ??
          secondaryMembership?.member_since ??
          null,
        created_at:
          primaryMembership?.created_at ??
          secondaryMembership?.created_at ??
          new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

    const { error: membershipUpsertError } = await admin
      .from('memberships')
      .upsert(mergedMembership, { onConflict: 'user_id' })

    if (membershipUpsertError) throw membershipUpsertError
  }

  const { error: membershipDeleteError } = await admin
    .from('memberships')
    .delete()
    .eq('user_id', secondaryUserId)

  if (membershipDeleteError) throw membershipDeleteError

  const [primaryPrefsRes, secondaryPrefsRes] = await Promise.all([
    admin
      .from('user_preferences')
      .select('*')
      .eq('user_id', primaryUserId)
      .maybeSingle(),
    admin
      .from('user_preferences')
      .select('*')
      .eq('user_id', secondaryUserId)
      .maybeSingle(),
  ])
  if (primaryPrefsRes.error) throw primaryPrefsRes.error
  if (secondaryPrefsRes.error) throw secondaryPrefsRes.error

  const primaryPrefs = primaryPrefsRes.data
  const secondaryPrefs = secondaryPrefsRes.data

  if (primaryPrefs || secondaryPrefs) {
    const mergedPrefs: Database['public']['Tables']['user_preferences']['Insert'] =
      {
        user_id: primaryUserId,
        trip_email_notifications:
          primaryPrefs?.trip_email_notifications ??
          secondaryPrefs?.trip_email_notifications ??
          true,
        created_at:
          primaryPrefs?.created_at ??
          secondaryPrefs?.created_at ??
          new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

    const { error: prefsUpsertError } = await admin
      .from('user_preferences')
      .upsert(mergedPrefs, { onConflict: 'user_id' })

    if (prefsUpsertError) throw prefsUpsertError
  }

  const { error: prefsDeleteError } = await admin
    .from('user_preferences')
    .delete()
    .eq('user_id', secondaryUserId)

  if (prefsDeleteError) throw prefsDeleteError

  const simpleUpdates: Array<{
    table: 'trips' | 'trip_comments' | 'trip_carpools' | 'user_waivers'
    column: 'created_by' | 'user_id'
  }> = [
    { table: 'trips', column: 'created_by' },
    { table: 'trip_comments', column: 'user_id' },
    { table: 'trip_carpools', column: 'user_id' },
    { table: 'user_waivers', column: 'user_id' },
  ]

  for (const update of simpleUpdates) {
    const { error } = await admin
      .from(update.table)
      .update({ [update.column]: primaryUserId })
      .eq(update.column, secondaryUserId)

    if (error) throw error
  }

  const mergeTripLeaders = await Promise.all([
    admin.from('trip_leaders').select('*').eq('user_id', primaryUserId),
    admin.from('trip_leaders').select('*').eq('user_id', secondaryUserId),
  ])
  if (mergeTripLeaders[0].error) throw mergeTripLeaders[0].error
  if (mergeTripLeaders[1].error) throw mergeTripLeaders[1].error

  const primaryLeaderTrips = new Set(
    (mergeTripLeaders[0].data ?? []).map(row => row.trip_id),
  )
  const leaderRowsToInsert = (mergeTripLeaders[1].data ?? [])
    .filter(row => !primaryLeaderTrips.has(row.trip_id))
    .map<Database['public']['Tables']['trip_leaders']['Insert']>(row => ({
      trip_id: row.trip_id,
      user_id: primaryUserId,
      created_at: row.created_at,
    }))

  if (leaderRowsToInsert.length) {
    const { error } = await admin
      .from('trip_leaders')
      .insert(leaderRowsToInsert)
    if (error) throw error
  }

  const { error: tripLeadersDeleteError } = await admin
    .from('trip_leaders')
    .delete()
    .eq('user_id', secondaryUserId)
  if (tripLeadersDeleteError) throw tripLeadersDeleteError

  const mergeTripRsvps = await Promise.all([
    admin.from('trip_rsvps').select('*').eq('user_id', primaryUserId),
    admin.from('trip_rsvps').select('*').eq('user_id', secondaryUserId),
  ])
  if (mergeTripRsvps[0].error) throw mergeTripRsvps[0].error
  if (mergeTripRsvps[1].error) throw mergeTripRsvps[1].error

  const primaryRsvpTrips = new Set(
    (mergeTripRsvps[0].data ?? []).map(row => row.trip_id),
  )
  const rsvpRowsToInsert = (mergeTripRsvps[1].data ?? [])
    .filter(row => !primaryRsvpTrips.has(row.trip_id))
    .map<Database['public']['Tables']['trip_rsvps']['Insert']>(row => ({
      trip_id: row.trip_id,
      user_id: primaryUserId,
      status: row.status,
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))

  if (rsvpRowsToInsert.length) {
    const { error } = await admin.from('trip_rsvps').insert(rsvpRowsToInsert)
    if (error) throw error
  }

  const { error: tripRsvpsDeleteError } = await admin
    .from('trip_rsvps')
    .delete()
    .eq('user_id', secondaryUserId)
  if (tripRsvpsDeleteError) throw tripRsvpsDeleteError

  const mergeTripFavorites = await Promise.all([
    admin.from('trip_favorites').select('*').eq('user_id', primaryUserId),
    admin.from('trip_favorites').select('*').eq('user_id', secondaryUserId),
  ])
  if (mergeTripFavorites[0].error) throw mergeTripFavorites[0].error
  if (mergeTripFavorites[1].error) throw mergeTripFavorites[1].error

  const primaryFavoriteTrips = new Set(
    (mergeTripFavorites[0].data ?? []).map(row => row.trip_id),
  )
  const favoriteRowsToInsert = (mergeTripFavorites[1].data ?? [])
    .filter(row => !primaryFavoriteTrips.has(row.trip_id))
    .map<Database['public']['Tables']['trip_favorites']['Insert']>(row => ({
      trip_id: row.trip_id,
      user_id: primaryUserId,
      created_at: row.created_at,
    }))

  if (favoriteRowsToInsert.length) {
    const { error } = await admin
      .from('trip_favorites')
      .insert(favoriteRowsToInsert)
    if (error) throw error
  }

  const { error: tripFavoritesDeleteError } = await admin
    .from('trip_favorites')
    .delete()
    .eq('user_id', secondaryUserId)
  if (tripFavoritesDeleteError) throw tripFavoritesDeleteError

  const mergeTripAttendance = await Promise.all([
    admin.from('trip_attendance').select('*').eq('user_id', primaryUserId),
    admin.from('trip_attendance').select('*').eq('user_id', secondaryUserId),
  ])
  if (mergeTripAttendance[0].error) throw mergeTripAttendance[0].error
  if (mergeTripAttendance[1].error) throw mergeTripAttendance[1].error

  const primaryAttendanceTrips = new Set(
    (mergeTripAttendance[0].data ?? []).map(row => row.trip_id),
  )
  const attendanceRowsToInsert = (mergeTripAttendance[1].data ?? [])
    .filter(row => !primaryAttendanceTrips.has(row.trip_id))
    .map<Database['public']['Tables']['trip_attendance']['Insert']>(row => ({
      trip_id: row.trip_id,
      user_id: primaryUserId,
      attended: row.attended,
      responded_at: row.responded_at,
      feedback: row.feedback,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))

  if (attendanceRowsToInsert.length) {
    const { error } = await admin
      .from('trip_attendance')
      .insert(attendanceRowsToInsert)
    if (error) throw error
  }

  const { error: tripAttendanceDeleteError } = await admin
    .from('trip_attendance')
    .delete()
    .eq('user_id', secondaryUserId)
  if (tripAttendanceDeleteError) throw tripAttendanceDeleteError

  const { error: deleteSecondaryAuthError } = await admin.auth.admin.deleteUser(
    secondaryUserId,
    true,
  )
  if (deleteSecondaryAuthError) throw deleteSecondaryAuthError
}

export async function POST(request: Request) {
  const guard = await assertAdmin()
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const parsed = mergeRequestSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const payload = parsed.data

  if (payload.primaryUserId === payload.secondaryUserId) {
    return NextResponse.json(
      { error: 'Primary and secondary user ids must differ.' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()

  try {
    const [primaryLookup, secondaryLookup] = await Promise.all([
      admin.auth.admin.getUserById(payload.primaryUserId),
      admin.auth.admin.getUserById(payload.secondaryUserId),
    ])

    if (primaryLookup.error || !primaryLookup.data.user) {
      return NextResponse.json(
        { error: 'primaryUserId user not found.' },
        { status: 404 },
      )
    }

    if (secondaryLookup.error || !secondaryLookup.data.user) {
      return NextResponse.json(
        { error: 'secondaryUserId user not found.' },
        { status: 404 },
      )
    }

    const selection = resolvePrimaryAndSecondary(
      payload,
      parseAuthUserSummary(primaryLookup.data.user),
      parseAuthUserSummary(secondaryLookup.data.user),
    )

    const counts = await buildDryRunCounts(
      admin,
      selection.primaryUserId,
      selection.secondaryUserId,
    )

    const audit: MergeAudit = {
      primaryUserId: selection.primaryUserId,
      secondaryUserId: selection.secondaryUserId,
      dryRun: payload.dryRun,
      selectedBy: selection.selectedBy,
      counts,
    }

    console.info('[account-merge]', JSON.stringify(audit))

    if (!payload.dryRun) {
      await applyMerge(
        admin,
        selection.primaryUserId,
        selection.secondaryUserId,
      )
    }

    return NextResponse.json({ audit, applied: !payload.dryRun })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Account merge failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
