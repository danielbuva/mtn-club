import { Eye, Pencil } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { AdminPanelFallback } from '@/components/admin/admin-panel-fallback'
import { AdminViewFrame } from '@/components/admin/admin-view-frame'
import { TripCancellationNotice } from '@/components/trips/trip-cancellation-notice'
import { CopyTripLinkButton } from '@/components/trips/copy-trip-link-button'
import { TripLifecycleControls } from '@/components/trips/trip-lifecycle-controls'
import { TripTitleText } from '@/components/trips/trip-title-text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import { purgeTestTripAction, setTripOfficialAction } from './actions'

const formatDate = (value: string, isAllDay: boolean) => {
  const date = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'America/Los_Angeles',
  }).format(new Date(value))
  if (isAllDay) return `${date} · Time TBA`
  const time = new Intl.DateTimeFormat('en-US', {
    timeStyle: 'short',
    timeZone: 'America/Los_Angeles',
  }).format(new Date(value))
  return `${date}, ${time}`
}

async function AdminTripsPageContent({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    timing?: string
    kind?: string
    lifecycle?: string
    filter?: string
  }>
}) {
  const context = await requireAdminCapability('trips.read')
  const filters = await searchParams
  const returnQuery = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === 'string') returnQuery.set(key, value)
  }
  const returnTo = `/admin/trips${returnQuery.size ? `?${returnQuery}` : ''}`
  const supabase = await createClient()
  let query = supabase
    .from('trips')
    .select(
      'id, title, starts_at, location_public, description_public, capacity, is_all_day, is_official, activity_tags, lifecycle_status, cancellation_reason, visibility',
    )
    .order('starts_at', { ascending: filters.timing !== 'past' })
    .limit(250)

  const now = new Date().toISOString()
  if (filters.timing === 'past') query = query.lt('starts_at', now)
  else if (filters.timing !== 'all') query = query.gte('starts_at', now)
  if (
    filters.lifecycle &&
    ['published', 'canceled', 'archived'].includes(filters.lifecycle)
  ) {
    query = query.eq(
      'lifecycle_status',
      filters.lifecycle as 'published' | 'canceled' | 'archived',
    )
  } else if (!filters.lifecycle || filters.lifecycle === 'active') {
    query = query.neq('lifecycle_status', 'archived')
  }
  if (filters.kind === 'official') query = query.eq('is_official', true)
  if (filters.kind === 'unofficial') query = query.eq('is_official', false)
  if (filters.q?.trim()) query = query.ilike('title', `%${filters.q.trim()}%`)

  const [{ data: trips, error }, credits, hosts, leaders] = await Promise.all([
    query,
    supabase.from('trip_hosts').select('trip_id, host_id'),
    supabase.from('club_hosts').select('id, is_active'),
    supabase.from('trip_leaders').select('trip_id, user_id'),
  ])
  const loadError =
    error ?? credits.error ?? hosts.error ?? leaders.error ?? null
  const assignedTripIds = new Set(
    (leaders.data ?? [])
      .filter(leader => leader.user_id === context.userId)
      .map(leader => leader.trip_id),
  )
  const canManageTrip = (
    capability: 'trips.update' | 'trips.delete' | 'trips.official',
    tripId: string,
  ) =>
    context.permissions[capability] === 'all' ||
    (context.permissions[capability] === 'assigned' &&
      assignedTripIds.has(tripId))
  const inactiveHostIds = new Set(
    (hosts.data ?? []).filter(host => !host.is_active).map(host => host.id),
  )
  const creditedTripIds = new Set(
    (credits.data ?? []).map(credit => credit.trip_id),
  )
  const attentionTripIds = new Set(
    (trips ?? [])
      .filter(
        trip =>
          !trip.location_public?.trim() ||
          !trip.description_public?.trim() ||
          !creditedTripIds.has(trip.id) ||
          (credits.data ?? []).some(
            credit =>
              credit.trip_id === trip.id && inactiveHostIds.has(credit.host_id),
          ),
      )
      .map(trip => trip.id),
  )
  const visibleTrips =
    filters.filter === 'attention'
      ? (trips ?? []).filter(trip => attentionTripIds.has(trip.id))
      : (trips ?? [])
  const filteredTrips = visibleTrips.filter(trip => {
    const meetup = (trip.activity_tags ?? []).some(
      (tag: string) => tag.toLowerCase() === 'meetup',
    )
    if (filters.kind === 'meetup') return meetup
    if (filters.kind === 'trip') return !meetup
    return true
  })

  return (
    <>
      {loadError ? (
        <p
          role="alert"
          className="mt-6 border border-destructive/30 bg-destructive/10 p-4 text-sm"
        >
          Trips could not be loaded. Confirm that the admin migration has been
          deployed.
        </p>
      ) : null}
      {!loadError && !filteredTrips.length ? (
        <div className="mt-6 border border-dashed border-[#211D18]/20 p-12 text-center text-sm text-[#6A5146] dark:border-border dark:text-muted-foreground">
          No trips match these filters.
        </div>
      ) : null}

      {!loadError ? (
        <section className="mt-6 grid gap-3">
          {filteredTrips.map(trip => (
            <article
              key={trip.id}
              className="grid gap-4 border border-[#211D18]/15 bg-white/45 p-5 dark:border-border dark:bg-card lg:grid-cols-[1fr_auto] lg:items-center"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  <TripTitleText
                    title={trip.title}
                    canceled={trip.lifecycle_status === 'canceled'}
                  />
                </h2>
                {trip.lifecycle_status === 'canceled' && (
                  <TripCancellationNotice reason={trip.cancellation_reason} />
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={trip.is_official ? 'default' : 'secondary'}>
                    {trip.is_official ? 'Official' : 'Community trip'}
                  </Badge>
                  <Badge variant="outline">{trip.lifecycle_status}</Badge>
                  <Badge variant="outline">{trip.visibility}</Badge>
                </div>
                <p className="mt-3 text-sm text-[#6A5146] dark:text-muted-foreground">
                  {formatDate(trip.starts_at, trip.is_all_day)} ·{' '}
                  {trip.location_public ?? 'Location needed'} ·{' '}
                  {trip.capacity ? `${trip.capacity} spots` : 'No limit'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CopyTripLinkButton tripId={trip.id} />
                <Button asChild size="sm" variant="outline">
                  <Link href={`/trips/${trip.id}`}>
                    <Eye className="size-4" /> View
                  </Link>
                </Button>
                {canManageTrip('trips.update', trip.id) ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/trips/${trip.id}/registrations`}>
                      Registration
                    </Link>
                  </Button>
                ) : null}
                {canManageTrip('trips.update', trip.id) ? (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={`/trips/${trip.id}?edit=1&returnTo=${encodeURIComponent(returnTo)}`}
                    >
                      <Pencil className="size-4" /> Edit
                    </Link>
                  </Button>
                ) : null}
                {canManageTrip('trips.official', trip.id) ? (
                  <form action={setTripOfficialAction}>
                    <input type="hidden" name="tripId" value={trip.id} />
                    <input
                      type="hidden"
                      name="isOfficial"
                      value={trip.is_official ? 'false' : 'true'}
                    />
                    <Button size="sm" variant="ghost">
                      Make {trip.is_official ? 'unofficial' : 'official'}
                    </Button>
                  </form>
                ) : null}
                {canManageTrip('trips.delete', trip.id) ? (
                  <TripLifecycleControls
                    tripId={trip.id}
                    title={trip.title}
                    lifecycle={trip.lifecycle_status}
                    reason={trip.cancellation_reason}
                  />
                ) : null}
                {context.isSuperAdmin &&
                trip.lifecycle_status !== 'published' &&
                /test/i.test(trip.title) ? (
                  <form action={purgeTestTripAction}>
                    <input type="hidden" name="tripId" value={trip.id} />
                    <Button size="sm" variant="destructive">
                      Purge test
                    </Button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </>
  )
}

export default function AdminTripsPage(
  props: Parameters<typeof AdminTripsPageContent>[0],
) {
  return (
    <AdminViewFrame view="trips">
      <Suspense fallback={<AdminPanelFallback view="trips" />}>
        <AdminTripsPageContent {...props} />
      </Suspense>
    </AdminViewFrame>
  )
}
