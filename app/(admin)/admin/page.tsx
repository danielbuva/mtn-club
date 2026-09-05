import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { AdminPanelFallback } from '@/components/admin/admin-panel-fallback'
import { AdminViewFrame } from '@/components/admin/admin-view-frame'
import { CopyTripLinkButton } from '@/components/trips/copy-trip-link-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { requireAdminCapability } from '@/lib/admin/auth'
import { getAdminOverviewData } from '@/lib/admin/overview'

const formatTripDate = (
  startsAt: string,
  endsAt: string | null,
  isAllDay: boolean,
) => {
  const start = new Date(startsAt)
  const end = endsAt ? new Date(endsAt) : null
  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  }).format(start)
  if (isAllDay) return `${date} · Time TBA`
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  }).format(start)
  if (!end) return `${date} · ${time}`
  return `${date} · ${time}`
}

const formatRelative = (value: string) => {
  const date = new Date(value)
  const minutes = Math.round((date.getTime() - Date.now()) / 60_000)
  const formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  return formatter.format(Math.round(hours / 24), 'day')
}

async function AdminOverviewPageContent() {
  const admin = await requireAdminCapability('overview.read')
  const data = await getAdminOverviewData()
  const metrics = [
    {
      label: 'Active members',
      value: data.activeMembers,
      note: `${data.newMembers} new in ${data.termName} · ${data.paidMembers} payment-backed`,
      icon: Users,
    },
    {
      label: 'Upcoming trips',
      value: data.upcomingTrips,
      note: 'Published events ahead',
      icon: CalendarDays,
    },
  ]

  return (
    <>
      <section
        aria-label="Club snapshot"
        className="mt-8 grid gap-4 sm:grid-cols-2"
      >
        {metrics.map(metric => (
          <article
            key={metric.label}
            className="border border-[#211D18]/15 bg-white/45 p-5 dark:border-border dark:bg-card"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-[#6A5146] dark:text-muted-foreground">
                {metric.label}
              </p>
              <metric.icon
                className="size-5 text-[#6A5146]"
                aria-hidden="true"
              />
            </div>
            <p className="mt-4 font-brand text-5xl">{metric.value}</p>
            <p className="mt-1 text-xs text-[#6A5146] dark:text-muted-foreground">
              {metric.note}
            </p>
          </article>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <section className="overflow-hidden bg-[#211D18] text-[#F8F1DF] shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <p className="font-brand text-sm uppercase tracking-[0.2em] text-[#FFECA2]">
                Next trip
              </p>
              <Sparkles className="size-5 text-[#FFECA2]" aria-hidden="true" />
            </div>
            {data.nextTrip ? (
              <>
                <div className="mt-7 flex items-start gap-3">
                  <h2 className="min-w-0 flex-1 max-w-2xl font-brand text-5xl uppercase leading-[0.9] sm:text-6xl">
                    {data.nextTrip.title}
                  </h2>
                  <CopyTripLinkButton
                    tripId={data.nextTrip.id}
                    className="text-[#F8F1DF] hover:bg-[#F8F1DF]/10 hover:text-[#F8F1DF]"
                  />
                </div>
                <div className="mt-7 grid gap-3 text-sm text-[#F8F1DF]/75 sm:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-[#FFECA2]" />
                    {formatTripDate(
                      data.nextTrip.startsAt,
                      data.nextTrip.endsAt,
                      data.nextTrip.isAllDay,
                    )}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 text-[#FFECA2]" />
                    {data.nextTrip.location ?? 'Location to be confirmed'}
                  </p>
                  <p>
                    {data.nextTrip.capacity
                      ? `Capacity ${data.nextTrip.capacity}`
                      : 'No participant limit set'}
                  </p>
                  <p>
                    {data.nextTrip.hosts.length
                      ? `Led by ${data.nextTrip.hosts.join(', ')}`
                      : 'Leader assignment needed'}
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  {admin.permissions['trips.update'] ? (
                    <Button
                      asChild
                      className="bg-[#FFECA2] text-[#211D18] hover:bg-[#f6dc76]"
                    >
                      <Link
                        href={`/trips/${data.nextTrip.id}?edit=1&returnTo=%2Fadmin`}
                      >
                        Manage trip
                      </Link>
                    </Button>
                  ) : null}
                  <Button
                    asChild
                    variant="outline"
                    className="border-[#F8F1DF]/35 bg-transparent text-[#F8F1DF] hover:bg-[#F8F1DF]/10 hover:text-[#F8F1DF]"
                  >
                    <Link href={`/trips/${data.nextTrip.id}`}>
                      View public page
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-12 py-12 text-center text-[#F8F1DF]/70">
                No upcoming official trips.
              </div>
            )}
          </div>
        </section>

        <section className="border border-[#211D18]/15 bg-white/45 p-6 dark:border-border dark:bg-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-brand text-sm uppercase tracking-[0.15em] text-[#6A5146] dark:text-muted-foreground">
                Needs attention
              </p>
              <p className="mt-2 font-brand text-4xl">{data.pendingActions}</p>
            </div>
            <AlertCircle className="size-7 text-amber-700" aria-hidden="true" />
          </div>
          {data.pendingBreakdown.length ? (
            <ul className="mt-5 divide-y divide-[#211D18]/10 dark:divide-border">
              {data.pendingBreakdown.map(item => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex min-h-12 items-center justify-between gap-3 py-2 text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.label}
                    <Badge variant="secondary">{item.count}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 border border-dashed border-[#211D18]/20 p-6 text-center text-sm text-[#6A5146] dark:text-muted-foreground">
              Nothing needs attention right now.
            </p>
          )}
        </section>
      </div>

      <section className="mt-6 border border-[#211D18]/15 bg-white/45 p-6 dark:border-border dark:bg-card">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-brand text-2xl uppercase">Recent activity</h2>
          <Link
            href="/admin/analytics#activity-history"
            className="flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            View full history <ArrowRight className="size-4" />
          </Link>
        </div>
        {data.recentActivity.length ? (
          <ol className="mt-4 divide-y divide-[#211D18]/10 dark:divide-border">
            {data.recentActivity.map(item => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-5 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{item.summary}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-[#6A5146] dark:text-muted-foreground">
                    {item.action.replaceAll('_', ' ')}
                  </p>
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    By {item.owner}
                  </p>
                </div>
                <time
                  className="shrink-0 text-xs text-[#6A5146] dark:text-muted-foreground"
                  dateTime={item.createdAt}
                >
                  {formatRelative(item.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-5 border border-dashed border-[#211D18]/20 p-8 text-center text-sm text-[#6A5146] dark:text-muted-foreground">
            Activity will appear as officers review payments and manage trips.
          </p>
        )}
      </section>
    </>
  )
}

export default function AdminOverviewPage() {
  return (
    <AdminViewFrame view="overview">
      <Suspense fallback={<AdminPanelFallback view="overview" />}>
        <AdminOverviewPageContent />
      </Suspense>
    </AdminViewFrame>
  )
}
