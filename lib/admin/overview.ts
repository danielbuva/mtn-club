import 'server-only'

import { withActivityOwners } from '@/lib/admin/activity'
import { overviewTotalsSchema } from '@/lib/admin/aggregate-schemas'
import { requireAdminCapability } from '@/lib/admin/auth'
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
  owner: string
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
  await requireAdminCapability('overview.read')
  const supabase = await createClient()
  const [totalsResult, activityResult] = await Promise.all([
    supabase.rpc('get_admin_overview_totals'),
    supabase
      .from('admin_activity_events')
      .select('id, summary, action, created_at, actor_user_id')
      .order('created_at', { ascending: false })
      .limit(8),
  ])
  if (totalsResult.error) throw totalsResult.error
  if (activityResult.error) throw activityResult.error
  const totals = overviewTotalsSchema.parse(totalsResult.data)

  const pendingBreakdown = [
    {
      label: 'Zelle payments to review',
      count: totals.pendingPayments,
      href: '/admin/membership',
    },
    {
      label: 'Guardian consents',
      count: totals.pendingGuardians,
      href: '/admin/membership',
    },
    {
      label: 'Schedule reviews',
      count: totals.pendingSchedule,
      href: '/admin/trips?filter=attention',
    },
    {
      label: 'Trips with inactive hosts',
      count: totals.inactiveHostTrips,
      href: '/admin/trips?filter=attention',
    },
    {
      label: 'Incomplete upcoming trips',
      count: totals.incompleteTrips,
      href: '/admin/trips?filter=attention',
    },
    {
      label: 'Account deletion retries',
      count: totals.pendingDeletions,
      href: '/admin/accounts?filter=attention',
    },
  ].filter(item => item.count > 0)

  return {
    activeMembers: totals.activeMembers,
    newMembers: totals.newMembers,
    paidMembers: totals.paidMembers,
    upcomingTrips: totals.upcomingTrips,
    pendingActions: pendingBreakdown.reduce((sum, item) => sum + item.count, 0),
    pendingBreakdown,
    nextTrip: totals.nextTrip,
    recentActivity: await withActivityOwners(activityResult.data ?? []),
    termName: totals.termName,
  }
}
