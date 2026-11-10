import 'server-only'

import { requireAdminCapability } from '@/lib/admin/auth'
import { getLedTripIds, pageEditAccess } from '@/lib/admin/page-access'
import { TRIP_LIMIT } from '@/lib/admin/pages-limits'
import type { PageEditAccess, PageEditor } from '@/lib/admin/site-pages'
import { announcementStatus } from '@/lib/announcements/schedule'
import { createClient } from '@/lib/supabase/server'

/** `hidden` means the admin's role cannot read that part of the dashboard. */
export type Loaded<T> =
  | { status: 'ready'; value: T }
  | { status: 'error' }
  | { status: 'hidden' }

export type DirectoryTrip = {
  id: string
  title: string
  startsAt: string
  isAllDay: boolean
  isOfficial: boolean
  isCanceled: boolean
  /** The viewer leads this trip (only tracked for trip-leader roles). */
  isLed: boolean
  canEdit: boolean
}

export const NOTICE_STATES = [
  'Live',
  'Scheduled',
  'Draft',
  'Expired',
  'Archived',
] as const
export type NoticeState = (typeof NOTICE_STATES)[number]

export type DirectoryNotice = {
  id: string
  slug: string
  title: string
  startsAt: string
  endsAt: string
  state: NoticeState
}

export type PagesDirectoryData = {
  access: PageEditAccess
  canCreateTrip: boolean
  /** One line about what each editor currently feeds its pages. */
  facts: Record<PageEditor, Loaded<string>>
  /** What the home page is showing from the noticeboard right now. */
  homeFact: Loaded<string>
  trips: Loaded<{ items: DirectoryTrip[]; total: number }>
  notices: Loaded<{ items: DirectoryNotice[]; total: number }>
}

/** Trip leaders get a wider window so the trips they lead can sort first. */
const LEADER_TRIP_WINDOW = 60
const NOTICE_LIMIT = 5
const hidden = { status: 'hidden' } as const
const failed = { status: 'error' } as const
const ready = <T>(value: T): Loaded<T> => ({ status: 'ready', value })

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`

const isNoticeState = (value: string): value is NoticeState =>
  NOTICE_STATES.some(state => state === value)

export async function getPagesDirectoryData(): Promise<PagesDirectoryData> {
  const context = await requireAdminCapability('overview.read')
  const access = pageEditAccess(context)
  const supabase = await createClient()
  const now = new Date()
  const ledTripIds = new Set(
    access.trips === 'assigned' ? await getLedTripIds(context.userId) : [],
  )

  const [trips, notices, published, drafts, roster] = await Promise.all([
    access.trips === 'none'
      ? null
      : supabase
          .from('trips')
          .select(
            'id, title, starts_at, is_all_day, is_official, lifecycle_status',
            { count: 'exact' },
          )
          .gte('starts_at', now.toISOString())
          .neq('lifecycle_status', 'archived')
          .order('starts_at')
          .limit(access.trips === 'assigned' ? LEADER_TRIP_WINDOW : TRIP_LIMIT),
    access.notices === 'none'
      ? null
      : supabase
          .from('announcements')
          .select('id, slug, title, status, starts_at, ends_at')
          .order('starts_at', { ascending: false }),
    access.gallery === 'none'
      ? null
      : supabase
          .from('gallery_photos')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true),
    access.gallery === 'none'
      ? null
      : supabase
          .from('gallery_photos')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', false),
    access.roster === 'none'
      ? null
      : supabase
          .from('club_hosts')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
  ])

  const tripList: PagesDirectoryData['trips'] = !trips
    ? hidden
    : trips.error
      ? failed
      : ready({
          total: trips.count ?? trips.data.length,
          items: trips.data
            .map(trip => ({
              id: trip.id,
              title: trip.title,
              startsAt: trip.starts_at,
              isAllDay: trip.is_all_day,
              isOfficial: trip.is_official,
              isCanceled: trip.lifecycle_status === 'canceled',
              isLed: ledTripIds.has(trip.id),
              canEdit: access.trips === 'edit' || ledTripIds.has(trip.id),
            }))
            // Stable sort: led trips first, each group still by start time.
            .sort((a, b) => Number(b.isLed) - Number(a.isLed))
            .slice(0, TRIP_LIMIT),
        })

  const allNotices = notices?.data?.flatMap(item => {
    const state = announcementStatus(item, now.getTime())
    if (!isNoticeState(state)) return []
    return [
      {
        id: item.id,
        slug: item.slug,
        title: item.title,
        startsAt: item.starts_at,
        endsAt: item.ends_at,
        state,
      },
    ]
  })
  const currentNotices = allNotices?.filter(
    item => item.state !== 'Archived' && item.state !== 'Expired',
  )
  const noticeList: PagesDirectoryData['notices'] = !notices
    ? hidden
    : !currentNotices
      ? failed
      : ready({
          total: currentNotices.length,
          items: currentNotices.slice(0, NOTICE_LIMIT),
        })

  const noticeCount = (state: NoticeState) =>
    currentNotices?.filter(item => item.state === state).length ?? 0
  const liveNotice = currentNotices?.find(item => item.state === 'Live')

  return {
    access,
    canCreateTrip: Boolean(context.permissions['trips.create']),
    trips: tripList,
    notices: noticeList,
    homeFact: !notices
      ? hidden
      : !currentNotices
        ? failed
        : ready(
            liveNotice
              ? `Showing the notice “${liveNotice.title}”. Next trips come from Trips.`
              : 'No notice showing right now. Next trips come from Trips.',
          ),
    facts: {
      trips:
        tripList.status === 'ready'
          ? ready(
              tripList.value.total
                ? `${plural(tripList.value.total, 'upcoming trip')}.`
                : 'No upcoming trips.',
            )
          : tripList,
      notices:
        noticeList.status === 'ready'
          ? ready(
              noticeList.value.total
                ? `${noticeCount('Live')} live, ${noticeCount('Scheduled')} scheduled, ${plural(noticeCount('Draft'), 'draft')}.`
                : 'The noticeboard is empty.',
            )
          : noticeList,
      gallery:
        !published || !drafts
          ? hidden
          : published.error || drafts.error
            ? failed
            : ready(
                published.count || drafts.count
                  ? `${plural(published.count ?? 0, 'photo')} published, ${drafts.count ?? 0} not yet public.`
                  : 'No photos yet.',
              ),
      roster: !roster
        ? hidden
        : roster.error
          ? failed
          : ready(
              roster.count
                ? `${plural(roster.count, 'leader')} on the roster.`
                : 'No one on the roster yet.',
            ),
    },
  }
}
