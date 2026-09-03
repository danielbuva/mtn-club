import 'server-only'

import {
  buildMembershipAccessSnapshot,
  countFirstActivationsInRange,
} from '@/lib/admin/membership-access'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type OverviewTrip = {
  id: string
  title: string
  startsAt: string
  endsAt: string | null
  location: string | null
  capacity: number | null
  isAllDay: boolean
  hosts: string[]
}

export type OverviewActivity = {
  id: string
  summary: string
  action: string
  createdAt: string
}

export type AdminOverviewData = {
  activeMembers: number
  newMembers: number
  paidMembers: number
  upcomingTrips: number
  pendingActions: number
  pendingBreakdown: Array<{ label: string; count: number; href: string }>
  nextTrip: OverviewTrip | null
  recentActivity: OverviewActivity[]
  termName: string
}

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  const admin = createAdminClient()
  const supabase = await createClient()
  const now = new Date().toISOString()

  const [
    termResult,
    entitlementsResult,
    overridesResult,
    restrictionsResult,
    applicationsResult,
    paymentsResult,
    scheduleResult,
    deletionsResult,
    tripsResult,
    hostsResult,
    creditsResult,
    activityResult,
  ] = await Promise.all([
    admin
      .from('club_terms')
      .select('name, starts_on, ends_on')
      .eq('is_active', true)
      .maybeSingle(),
    admin
      .from('membership_entitlements')
      .select(
        'user_id, starts_at, ends_at, revoked_at, payment_id, zelle_payment_id',
      ),
    admin
      .from('membership_access_overrides')
      .select('user_id, starts_at, ends_at, revoked_at'),
    admin
      .from('membership_account_restrictions')
      .select('user_id, restriction'),
    admin
      .from('membership_applications')
      .select('user_id, guardian_consent, status')
      .eq('status', 'submitted'),
    admin
      .from('membership_zelle_payments')
      .select('id')
      .eq('status', 'claimed'),
    admin.from('schedule_review_items').select('id').eq('status', 'pending'),
    admin
      .from('account_deletion_jobs')
      .select('id')
      .in('status', ['pending', 'auth_deleted', 'failed']),
    supabase
      .from('trips')
      .select(
        'id, title, starts_at, ends_at, location_public, description_public, capacity, activity_tags, is_all_day, is_official, lifecycle_status',
      )
      .gte('starts_at', now)
      .eq('lifecycle_status', 'published')
      .order('starts_at', { ascending: true })
      .limit(100),
    supabase.from('club_hosts').select('id, public_name, is_active'),
    supabase.from('trip_hosts').select('trip_id, host_id, sort_order'),
    supabase
      .from('admin_activity_events')
      .select('id, summary, action, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const queryError = [
    termResult,
    entitlementsResult,
    overridesResult,
    restrictionsResult,
    applicationsResult,
    paymentsResult,
    scheduleResult,
    deletionsResult,
    tripsResult,
    hostsResult,
    creditsResult,
    activityResult,
  ].find(result => result.error)?.error
  if (queryError) throw queryError

  const term = termResult.data
  const access = buildMembershipAccessSnapshot({
    entitlements: entitlementsResult.data ?? [],
    overrides: overridesResult.data ?? [],
    restrictions: restrictionsResult.data ?? [],
    now,
  })
  const newMembers = term
    ? countFirstActivationsInRange(
        access.firstActivationByUser,
        term.starts_on,
        term.ends_on,
      )
    : 0

  const upcoming = tripsResult.data ?? []
  const nextTripRow = upcoming.find(
    trip =>
      trip.is_official &&
      !(trip.activity_tags ?? []).some(
        (tag: string) => tag.toLowerCase() === 'meetup',
      ),
  )
  const hostsById = new Map(
    (hostsResult.data ?? []).map(host => [host.id, host]),
  )
  const credits = creditsResult.data ?? []
  const nextTripHosts = nextTripRow
    ? credits
        .filter(credit => credit.trip_id === nextTripRow.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(credit => hostsById.get(credit.host_id)?.public_name)
        .filter((name): name is string => Boolean(name))
    : []

  const upcomingIds = new Set(upcoming.map(trip => trip.id))
  const inactiveHostTripCount = new Set(
    credits
      .filter(credit => {
        const host = hostsById.get(credit.host_id)
        return upcomingIds.has(credit.trip_id) && host && !host.is_active
      })
      .map(credit => credit.trip_id),
  ).size
  const hostedTripIds = new Set(credits.map(credit => credit.trip_id))
  const incompleteTripCount = upcoming.filter(
    trip =>
      !trip.location_public?.trim() ||
      !trip.description_public?.trim() ||
      !hostedTripIds.has(trip.id),
  ).length

  const guardianCount = (applicationsResult.data ?? []).filter(
    application => application.guardian_consent === 'pending',
  ).length
  const pendingBreakdown = [
    {
      label: 'Zelle payments to review',
      count: paymentsResult.data?.length ?? 0,
      href: '/admin/membership',
    },
    {
      label: 'Guardian consents',
      count: guardianCount,
      href: '/admin/membership',
    },
    {
      label: 'Schedule reviews',
      count: scheduleResult.data?.length ?? 0,
      href: '/admin/trips?filter=attention',
    },
    {
      label: 'Trips with inactive hosts',
      count: inactiveHostTripCount,
      href: '/admin/trips?filter=attention',
    },
    {
      label: 'Incomplete upcoming trips',
      count: incompleteTripCount,
      href: '/admin/trips?filter=attention',
    },
    {
      label: 'Account deletion retries',
      count: deletionsResult.data?.length ?? 0,
      href: '/admin/accounts?filter=attention',
    },
  ].filter(item => item.count > 0)

  return {
    activeMembers: access.activeUserIds.size,
    newMembers,
    paidMembers: access.paidUserIds.size,
    upcomingTrips: upcoming.length,
    pendingActions: pendingBreakdown.reduce((sum, item) => sum + item.count, 0),
    pendingBreakdown,
    nextTrip: nextTripRow
      ? {
          id: nextTripRow.id,
          title: nextTripRow.title,
          startsAt: nextTripRow.starts_at,
          endsAt: nextTripRow.ends_at,
          location: nextTripRow.location_public,
          capacity: nextTripRow.capacity,
          isAllDay: nextTripRow.is_all_day,
          hosts: nextTripHosts,
        }
      : null,
    recentActivity: (activityResult.data ?? []).map(item => ({
      id: item.id,
      summary: item.summary,
      action: item.action,
      createdAt: item.created_at,
    })),
    termName: term?.name ?? 'Current term',
  }
}
