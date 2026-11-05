import {
  CalendarRange,
  CircleDollarSign,
  MailCheck,
  Mountain,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { ActivityHistory } from '@/components/admin/activity-history'
import { AdminPanelFallback } from '@/components/admin/admin-panel-fallback'
import { AdminViewFrame } from '@/components/admin/admin-view-frame'
import { ActivityHistoryLoading } from '@/components/admin/loading/activity-history'
import { Badge } from '@/components/ui/badge'
import type { ActivitySearchParams } from '@/lib/admin/activity-filters'
import { analyticsTotalsSchema } from '@/lib/admin/aggregate-schemas'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const ranges = ['term', '30', '90', 'all'] as const
type AnalyticsRange = (typeof ranges)[number]

const isRange = (value: string | undefined): value is AnalyticsRange =>
  ranges.some(range => range === value)

function getRangeStart(
  range: AnalyticsRange,
  termStart: string | null,
): string | null {
  if (range === 'all') return null
  if (range === 'term') return termStart
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - Number(range))
  return date.toISOString()
}

async function AdminAnalyticsPageContent({
  searchParams,
}: {
  searchParams: Promise<ActivitySearchParams>
}) {
  await requireAdminCapability('analytics.read')
  const params = await searchParams
  const rawRange = typeof params.range === 'string' ? params.range : undefined
  const range = isRange(rawRange) ? rawRange : 'term'
  const supabase = await createClient()
  const activeTerm = await createAdminClient()
    .from('club_terms')
    .select('name, starts_on, ends_on')
    .eq('is_active', true)
    .maybeSingle()
  if (activeTerm.error) throw activeTerm.error
  const rangeStart = getRangeStart(range, activeTerm.data?.starts_on ?? null)

  const { data, error } = await supabase.rpc('get_admin_analytics_totals', {
    p_range_start: rangeStart ?? undefined,
  })
  if (error) throw error
  const totals = analyticsTotalsSchema.parse(data)
  const tripStates = [
    ['Published', totals.publishedTrips],
    ['Canceled', totals.canceledTrips],
    ['Archived', totals.archivedTrips],
  ] as const
  const tripActivities = totals.tripActivities
  const mailingOptOuts = totals.mailingOptOuts
  const stats = [
    {
      label: 'Accounts',
      value: totals.accounts,
      note: 'Current login identities',
      icon: Users,
    },
    {
      label: 'Applications',
      value: totals.applications,
      note: 'Submitted in this range',
      icon: UserRoundPlus,
    },
    {
      label: 'Confirmed dues',
      value: totals.confirmedDues,
      note: (totals.confirmedRevenue / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
      icon: CircleDollarSign,
    },
    {
      label: 'Active members',
      value: totals.activeMembers,
      note: `${totals.paidMembers} payment-backed`,
      icon: Users,
    },
    {
      label: 'Trips',
      value: totals.trips,
      note: `${totals.publishedTrips} published`,
      icon: Mountain,
    },
    {
      label: 'Mailing opt-ins',
      value: totals.mailingOptIns,
      note: `${mailingOptOuts} opt-out${mailingOptOuts === 1 ? '' : 's'} in range`,
      icon: MailCheck,
    },
  ]

  return (
    <>
      <nav
        aria-label="Analytics date range"
        className="mt-6 flex flex-wrap gap-1"
      >
        {ranges.map(option => (
          <Link
            key={option}
            href={`/admin/analytics?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === 'string')), range: option })}`}
            aria-current={range === option ? 'page' : undefined}
            className={`px-3 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring ${range === option ? 'bg-[#211D18] text-[#FFECA2]' : 'bg-white/55 hover:bg-white dark:bg-card'}`}
          >
            {option === 'term'
              ? (activeTerm.data?.name ?? 'Active term')
              : option === 'all'
                ? 'All time'
                : `${option} days`}
          </Link>
        ))}
      </nav>

      <section
        aria-label="Operational metrics"
        className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {stats.map(stat => (
          <article
            key={stat.label}
            className="border border-[#211D18]/15 bg-white/45 p-5 dark:border-border dark:bg-card"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-[#6A5146] dark:text-muted-foreground">
                {stat.label}
              </p>
              <stat.icon className="size-5 text-[#6A5146]" aria-hidden="true" />
            </div>
            <p className="mt-4 font-brand text-5xl">{stat.value}</p>
            <p className="mt-1 text-xs text-[#6A5146] dark:text-muted-foreground">
              {stat.note}
            </p>
          </article>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="border border-[#211D18]/15 bg-white/45 p-6 dark:border-border dark:bg-card">
          <h2 className="flex items-center gap-2 font-brand text-2xl uppercase">
            <CalendarRange className="size-5" /> Trip lifecycle
          </h2>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {tripStates.map(([label, count]) => (
              <div
                key={label}
                className="bg-[#E9DDC3]/70 p-4 dark:bg-secondary"
              >
                <p className="font-brand text-3xl">{count}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-[#211D18]/15 bg-white/45 p-6 dark:border-border dark:bg-card">
          <h2 className="font-brand text-2xl uppercase">Trip activity mix</h2>
          {tripActivities.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {tripActivities.map(item => (
                <li key={item.activity}>
                  <Badge variant="secondary" className="capitalize">
                    {item.activity.replaceAll('_', ' ')} · {item.count}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              No trips fall inside this range.
            </p>
          )}
        </section>
      </div>
    </>
  )
}

export default function AdminAnalyticsPage(
  props: Parameters<typeof AdminAnalyticsPageContent>[0],
) {
  return (
    <AdminViewFrame view="analytics">
      <Suspense fallback={<AdminPanelFallback view="analytics" />}>
        <AdminAnalyticsPageContent {...props} />
      </Suspense>
      <Suspense fallback={<ActivityHistoryLoading />}>
        <ActivityHistory searchParams={props.searchParams} />
      </Suspense>
    </AdminViewFrame>
  )
}
