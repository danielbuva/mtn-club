import { notFound } from 'next/navigation'
import { TripAttendeesPreview } from '@/components/trips/detail/TripAttendeesPreview'
import { TripDescription } from '@/components/trips/detail/TripDescription'
import { TripDetailEditor } from '@/components/trips/detail/TripDetailEditor'
import { TripHero } from '@/components/trips/detail/TripHero'
import { TripLogistics } from '@/components/trips/detail/TripLogistics'
import { TripQuickFacts } from '@/components/trips/detail/TripQuickFacts'
import { TripRequirements } from '@/components/trips/detail/TripRequirements'
import { TripStats } from '@/components/trips/detail/TripStats'
import { TripStickyRsvpBar } from '@/components/trips/detail/TripStickyRsvpBar'
import { Card, CardContent } from '@/components/ui/card'
import { fetchPublicHostsByTrip } from '@/lib/events/queries'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type {
  TripActivityType,
  TripDetail,
  TripStatus,
} from '@/lib/trips/types'

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

const resolveStatus = (
  visibility: 'public' | 'members' | 'minimal',
  capacity: number | null,
  rsvpCount: number,
  waitlistEnabled: boolean,
): TripStatus => {
  if (visibility === 'members') {
    return 'members_only'
  }

  if (typeof capacity === 'number' && rsvpCount >= capacity) {
    return waitlistEnabled ? 'waitlist' : 'full'
  }

  return 'open'
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

  const [
    privateRes,
    leaderRes,
    goingRsvpsRes,
    allRsvpsRes,
    viewerRes,
    hostsByTrip,
  ] = await Promise.all([
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
    supabase
      .from('trip_rsvps')
      .select('user_id,status')
      .eq('trip_id', trip.id)
      .eq('status', 'going'),
    supabase.from('trip_rsvps').select('user_id,status').eq('trip_id', trip.id),
    supabase.auth.getUser(),
    fetchPublicHostsByTrip(supabase, [trip.id]),
  ])

  const leaderProfileRes = leaderRes.data?.user_id
    ? await supabase
        .from('profiles')
        .select('user_id,display_name,avatar_url')
        .eq('user_id', leaderRes.data.user_id)
        .maybeSingle()
    : { data: null, error: null }

  const attendeeIds = (goingRsvpsRes.data ?? []).map(row => row.user_id)
  const attendeeProfilesRes = attendeeIds.length
    ? await supabase
        .from('profiles')
        .select('user_id,display_name,avatar_url')
        .in('user_id', attendeeIds)
    : { data: [], error: null }

  const rsvpCount = goingRsvpsRes.data?.length ?? 0
  const viewerId = viewerRes.data.user?.id ?? null
  const viewerMembershipRes = viewerId
    ? await supabase
        .from('memberships')
        .select('user_id,status')
        .eq('user_id', viewerId)
        .eq('status', 'active')
        .maybeSingle()
    : { data: null, error: null }

  const viewerIsMember = Boolean(viewerMembershipRes.data)
  const viewerRsvpStatusRaw = allRsvpsRes.data?.find(
    row => row.user_id === viewerId,
  )?.status

  const viewerRsvpStatus =
    viewerRsvpStatusRaw === 'removed'
      ? null
      : viewerRsvpStatusRaw === 'waitlisted'
        ? 'waitlisted'
        : viewerRsvpStatusRaw === 'going'
          ? 'going'
          : viewerRsvpStatusRaw === 'not_going'
            ? 'not_going'
            : null

  const activityTags = trip.activity_tags ?? []
  const activityType = resolveActivityType(activityTags)
  const publicHostName = hostsByTrip
    .get(trip.id)
    ?.map(host => host.name)
    .join(', ')

  const attendeeProfileByUserId = new Map(
    (attendeeProfilesRes.data ?? []).map(profile => [profile.user_id, profile]),
  )
  const attendees = attendeeIds.map(userId => {
    const profile = attendeeProfileByUserId.get(userId)
    return {
      userId,
      name: profile?.display_name ?? 'Member',
      avatarUrl: profile?.avatar_url ?? undefined,
    }
  })

  const requirements = privateRes.data?.required_gear ?? []
  const gearList = privateRes.data?.recommended_gear ?? []

  const status = resolveStatus(
    trip.visibility,
    trip.capacity,
    rsvpCount,
    trip.waitlist_enabled,
  )

  return {
    id: trip.id,
    title: trip.title,
    activityType,
    activityTags,
    heroImageUrl: trip.cover_image_path ?? undefined,
    locationName: trip.location_public ?? 'TBD',
    locationNotes: privateRes.data?.meetup_point ?? undefined,
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
      viewerIsMember ? 'Member ready' : 'Open to all',
    ].slice(0, 3),
    attendees,
    viewerRsvpStatus,
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
  searchParams: Promise<{ edit?: string }>
}) {
  const { tripId } = await params
  const { edit } = await searchParams
  const isEditMode = edit === '1'

  const trip = await getTripDetail(tripId)

  if (!trip) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [membership, editPermission] = user
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
      ])
    : [{ data: null }, { data: false }]

  const viewer = {
    isAuthenticated: Boolean(user),
    isMember: Boolean(membership.data),
  }
  const canEditTrip = editPermission.data ?? false

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
        availableActivityTags={availableActivityTags}
        publicHostOptions={assignmentData?.publicHostOptions}
        leaderOptions={assignmentData?.leaderOptions}
        initialPublicHostIds={assignmentData?.initialPublicHostIds}
        initialLeaderIds={assignmentData?.initialLeaderIds}
      />
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 pb-32 md:space-y-5 md:pb-8">
      <TripHero trip={trip} canEdit={canEditTrip} editHref={editHref} />
      <TripQuickFacts trip={trip} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-4">
          <TripDescription trip={trip} />
          <TripStats trip={trip} />
          <TripLogistics trip={trip} />
          <TripRequirements trip={trip} />
          <TripAttendeesPreview attendees={trip.attendees ?? []} />

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
