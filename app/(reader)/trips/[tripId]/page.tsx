import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ScheduledTripDetail } from '@/components/trips/detail/scheduled-trip-detail'
import { TripAttendeesPreview } from '@/components/trips/detail/TripAttendeesPreview'
import { TripDescription } from '@/components/trips/detail/TripDescription'
import { TripDetailEditor } from '@/components/trips/detail/TripDetailEditor'
import { TripHero } from '@/components/trips/detail/TripHero'
import { TripLogistics } from '@/components/trips/detail/TripLogistics'
import { TripQuickFacts } from '@/components/trips/detail/TripQuickFacts'
import { TripRequirements } from '@/components/trips/detail/TripRequirements'
import { TripStats } from '@/components/trips/detail/TripStats'
import { TripStickyRsvpBar } from '@/components/trips/detail/TripStickyRsvpBar'
import { TripCancellationNotice } from '@/components/trips/trip-cancellation-notice'
import { Card, CardContent } from '@/components/ui/card'
import { FALL_2026_TRIPS, getFallTripScheduleKey } from '@/lib/club-content'
import { fetchPublicHostsByTrip } from '@/lib/events/queries'
import {
  legacyRsvpChoice,
  registrationTripStatus,
} from '@/lib/registration/presentation'
import { getRegistration } from '@/lib/registration/server'
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
    startAt: new Date(trip.starts_at),
    endAt: trip.ends_at ? new Date(trip.ends_at) : undefined,
    isAllDay: trip.is_all_day,
    isOfficial: trip.is_official,
    difficulty: resolveDifficulty(trip.difficulty),
    status,
    capacity: trip.capacity ?? undefined,
    rsvpCount,
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
    canViewAttendees:
      registration.canManage || registration.state === 'confirmed',
    viewerRsvpStatus,
    registrationState: registration.state,
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

  const scheduled = FALL_2026_TRIPS.find(
    item => getFallTripScheduleKey(item) === tripId,
  )
  if (scheduled) {
    const client = await createClient()
    const { data, error } = await client
      .from('trips')
      .select('id')
      .eq('schedule_key', tripId)
      .maybeSingle()
    if (error)
      throw new Error('Trip details could not be loaded. Please try again.')
    if (data) redirect(`/trips/${data.id}`)
    if (scheduled.lifecycleStatus === 'archived') notFound()
    return <ScheduledTripDetail scheduled={scheduled} />
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
        supabase
          .from('memberships')
          .select('user_id,status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle(),
        supabase.rpc('has_trip_admin_capability', {
          p_uid: user.id,
          p_capability_key: 'trips.update',
          p_trip_id: trip.id,
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
        canManageLifecycle={lifecyclePermission.data ?? false}
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
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 pb-32 md:space-y-5">
      <TripHero trip={trip} canEdit={canEditTrip} editHref={editHref} />
      {trip.canManageRegistration ? (
        <Link
          href={`/trips/${trip.id}/registrations`}
          className="inline-flex min-h-10 items-center text-sm font-medium underline underline-offset-4"
        >
          Manage registration · View incomplete signups and roster
        </Link>
      ) : null}
      {trip.status === 'cancelled' && (
        <TripCancellationNotice reason={trip.cancellationReason} />
      )}
      <TripQuickFacts trip={trip} />

      <div className="space-y-4">
        <div className="space-y-4">
          <TripDescription trip={trip} />
          <TripStats trip={trip} />
          <TripLogistics trip={trip} />
          <TripRequirements trip={trip} />
          <TripAttendeesPreview
            attendees={trip.attendees ?? []}
            totalCount={trip.rsvpCount ?? 0}
            canView={trip.canViewAttendees ?? false}
          />

          <Card className="border-border/70">
            <CardContent className="p-4 text-sm text-muted-foreground md:p-5">
              Comments & Q&A coming soon.
            </CardContent>
          </Card>
        </div>

        <TripStickyRsvpBar trip={trip} viewer={viewer} />
      </div>
    </main>
  )
}
