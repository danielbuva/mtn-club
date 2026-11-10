import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { GuardianTripNotice } from '@/components/guardian/guardian-trip-notice'
import { TripDetailEditor } from '@/components/trips/detail/TripDetailEditor'
import { TripDetailView } from '@/components/trips/detail/trip-detail-view'
import {
  TripOrganizerRoster,
  TripOrganizerRosterFallback,
} from '@/components/trips/detail/trip-organizer-roster'
import { fetchPublicHostsByTrip } from '@/lib/events/queries'
import {
  legacyRsvpChoice,
  registrationTripStatus,
} from '@/lib/registration/presentation'
import { getRegistration, getRoster } from '@/lib/registration/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { TripActivityType, TripDetail } from '@/lib/trips/types'

const resolveActivityType = (activityTags: string[]): TripActivityType => {
  const normalizedTags = activityTags.map(tag => tag.toLowerCase())

  if (
    normalizedTags.some(tag => tag.includes('climb') || tag.includes('boulder'))
  ) {
    return 'climbing'
  }

  if (normalizedTags.some(tag => tag.includes('backpack'))) {
    return 'backpacking'
  }

  if (normalizedTags.some(tag => tag.includes('camp'))) {
    return 'camping'
  }

  if (normalizedTags.some(tag => tag.includes('hike'))) {
    return 'hiking'
  }

  return 'other'
}

const resolveDifficulty = (difficulty: string | null) => {
  if (!difficulty) return undefined
  if (difficulty === 'beginner') return 'beginner' as const
  if (difficulty === 'intermediate') return 'intermediate' as const
  if (difficulty === 'hard') return 'advanced' as const
  if (difficulty === 'expert') return 'expert' as const
  return undefined
}

async function getTripDetail(tripId: string): Promise<TripDetail | null> {
  const supabase = await createClient()

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .maybeSingle()

  if (tripError || !trip) {
    return null
  }

  const [privateRes, leaderRes, registration, hostsByTrip] = await Promise.all([
    supabase
      .from('trip_private')
      .select(
        'meetup_point,required_gear,recommended_gear,weather_notes,description_private',
      )
      .eq('trip_id', trip.id)
      .maybeSingle(),
    supabase
      .from('trip_leaders')
      .select('user_id')
      .eq('trip_id', trip.id)
      .limit(1)
      .maybeSingle(),
    getRegistration(trip.id),
    fetchPublicHostsByTrip(supabase, [trip.id]),
  ])

  const leaderProfileRes = leaderRes.data?.user_id
    ? await supabase
        .from('profiles')
        .select('user_id,display_name,avatar_url')
        .eq('user_id', leaderRes.data.user_id)
        .maybeSingle()
    : { data: null, error: null }

  const rsvpCount = registration.confirmedCount
  const viewerRsvpStatus = legacyRsvpChoice(registration.state)

  const activityTags = trip.activity_tags ?? []
  const activityType = resolveActivityType(activityTags)
  const publicHostName = hostsByTrip
    .get(trip.id)
    ?.map(host => host.name)
    .join(', ')

  const attendees = registration.attendees.map(person => ({
    ...person,
    avatarUrl: person.avatarUrl ?? undefined,
  }))

  const requirements = privateRes.data?.required_gear ?? []
  const gearList = privateRes.data?.recommended_gear ?? []

  const status =
    trip.lifecycle_status === 'canceled'
      ? 'cancelled'
      : registrationTripStatus(registration.availability)

  return {
    id: trip.id,
    scheduleKey: trip.schedule_key,
    lifecycleStatus: trip.lifecycle_status,
    cancellationReason: trip.cancellation_reason,
    title: trip.title,
    activityType,
    activityTags,
    heroImageUrl: trip.cover_image_path ?? undefined,
    locationName: trip.location_public ?? 'TBD',
    locationNotes: privateRes.data?.meetup_point ?? undefined,
    timeZone: trip.time_zone,
    eventKind: trip.event_kind,
    registrationOpensAt: trip.registration_opens_at,
    registrationClosesAt: trip.rsvp_deadline,
    elevationFt: trip.elevation_ft ?? undefined,
    startAt: new Date(trip.starts_at),
    endAt: trip.ends_at ? new Date(trip.ends_at) : undefined,
    isAllDay: trip.is_all_day,
    isOfficial: trip.is_official,
    difficulty: resolveDifficulty(trip.difficulty),
    status,
    capacity: trip.capacity ?? undefined,
    rsvpCount,
    waitlistCount: registration.waitlistCount,
    leaderName:
      publicHostName ?? leaderProfileRes.data?.display_name ?? undefined,
    leaderAvatarUrl: leaderProfileRes.data?.avatar_url ?? undefined,
    summary: trip.description_public ?? undefined,
    description:
      privateRes.data?.description_private ??
      trip.description_public ??
      undefined,
    overviewWhat: trip.overview_what ?? undefined,
    overviewWhere: trip.overview_where ?? undefined,
    overviewWeather: trip.overview_weather ?? undefined,
    overviewEquipment: trip.overview_equipment ?? undefined,
    overviewCarpoolNeedGear: trip.overview_carpool_need_gear ?? undefined,
    gearList: gearList.length ? gearList : undefined,
    requirements: requirements.length ? requirements : undefined,
    tags: [
      trip.is_official ? 'Official club trip' : 'Community-created trip',
      registration.eligibility === 'members'
        ? 'Active members'
        : 'Open to signed-in accounts',
    ].slice(0, 3),
    attendees,
    canViewAttendees: registration.attendeesVisible,
    viewerRsvpStatus,
    registrationState: registration.state,
    registrationReadOnly: new Date(trip.starts_at).getTime() <= Date.now(),
    registrationActionRequired: registration.requirements.length > 0,
    canManageRegistration: registration.canManage,
    visibility: trip.visibility,
    waitlistEnabled: trip.waitlist_enabled,
  }
}

async function getTripAssignmentEditorData(tripId: string) {
  const admin = createAdminClient()
  const [hosts, credits, assignments, profiles, leaders] = await Promise.all([
    admin
      .from('club_hosts')
      .select('id, public_name, club_title')
      .eq('is_active', true)
      .order('display_order'),
    admin.from('trip_hosts').select('host_id').eq('trip_id', tripId),
    admin.from('admin_user_roles').select('user_id'),
    admin.from('profiles').select('user_id, display_name'),
    admin.from('trip_leaders').select('user_id').eq('trip_id', tripId),
  ])
  for (const result of [hosts, credits, assignments, profiles, leaders]) {
    if (result.error) throw result.error
  }
  const leadershipIds = new Set(
    (assignments.data ?? []).map(item => item.user_id),
  )
  return {
    publicHostOptions: (hosts.data ?? []).map(host => ({
      id: host.id,
      label: `${host.public_name} — ${host.club_title}`,
    })),
    leaderOptions: (profiles.data ?? [])
      .filter(profile => leadershipIds.has(profile.user_id))
      .map(profile => ({ id: profile.user_id, label: profile.display_name })),
    initialPublicHostIds: (credits.data ?? []).map(item => item.host_id),
    initialLeaderIds: (leaders.data ?? []).map(item => item.user_id),
  }
}

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>
  searchParams: Promise<{ edit?: string; returnTo?: string }>
}) {
  const { tripId } = await params
  const { edit, returnTo } = await searchParams
  const isEditMode = edit === '1'

  // Keep existing schedule URLs tied to a live event, including after renames.
  if (tripId.startsWith('fall-2026-')) {
    const client = await createClient()
    const { data, error } = await client
      .from('trips')
      .select('id')
      .eq('schedule_key', tripId)
      .in('lifecycle_status', ['published', 'canceled'])
      .maybeSingle()
    if (error)
      throw new Error('Trip details could not be loaded. Please try again.')
    if (!data) notFound()
    redirect(`/trips/${data.id}`)
  }

  const trip = await getTripDetail(tripId)

  if (!trip) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [membership, editPermission, lifecyclePermission] = user
    ? await Promise.all([
        supabase.rpc('is_active_member', { p_uid: user.id }),
        // Trip admins, or the member who created this unofficial trip.
        supabase.rpc('can_manage_trip', {
          p_trip_id: trip.id,
          p_uid: user.id,
        }),
        supabase.rpc('has_trip_admin_capability', {
          p_uid: user.id,
          p_capability_key: 'trips.delete',
          p_trip_id: trip.id,
        }),
      ])
    : [{ data: null }, { data: false }, { data: false }]

  const viewer = {
    isAuthenticated: Boolean(user),
    isMember: Boolean(membership.data),
  }
  const canEditTrip = editPermission.data ?? false
  if (
    trip.lifecycleStatus === 'archived' &&
    !canEditTrip &&
    !lifecyclePermission.data
  )
    notFound()

  const assignmentScope = user
    ? await supabase.rpc('admin_capability_scope', {
        p_uid: user.id,
        p_capability_key: 'trips.update',
      })
    : { data: null }
  const canManageAssignments = assignmentScope.data === 'all'

  const tagOptionsRes = canEditTrip
    ? await supabase.from('trip_tag_options').select('tag').order('tag')
    : { data: [] }

  const availableActivityTags = (tagOptionsRes.data ?? []).map(row => row.tag)
  const assignmentData = canManageAssignments
    ? await getTripAssignmentEditorData(trip.id)
    : null
  const editHref = `/trips/${trip.id}?edit=1`

  if (isEditMode && canEditTrip) {
    return (
      <TripDetailEditor
        trip={trip}
        registrationRoster={
          trip.canManageRegistration ? await getRoster(trip.id) : undefined
        }
        canManageLifecycle={lifecyclePermission.data ?? false}
        canCreateTags={assignmentScope.data != null}
        returnTo={returnTo}
        availableActivityTags={availableActivityTags}
        publicHostOptions={assignmentData?.publicHostOptions}
        leaderOptions={assignmentData?.leaderOptions}
        initialPublicHostIds={assignmentData?.initialPublicHostIds}
        initialLeaderIds={assignmentData?.initialLeaderIds}
      />
    )
  }

  return (
    <TripDetailView
      trip={trip}
      viewer={viewer}
      canEdit={canEditTrip}
      editHref={editHref}
      guardianNotice={
        user &&
        trip.lifecycleStatus === 'published' &&
        trip.startAt > new Date() ? (
          // Most viewers are adults and see nothing here, so the fallback is empty.
          <Suspense fallback={null}>
            <GuardianTripNotice tripId={trip.id} />
          </Suspense>
        ) : undefined
      }
      organizerRoster={
        trip.canManageRegistration ? (
          <Suspense fallback={<TripOrganizerRosterFallback />}>
            <TripOrganizerRoster tripId={trip.id} />
          </Suspense>
        ) : undefined
      }
    />
  )
}
