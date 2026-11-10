import type {
  DirectoryNotice,
  DirectoryTrip,
  Loaded,
  NoticeState,
  PagesDirectoryData,
} from '@/lib/admin/pages'
import {
  PAGE_EDITORS,
  SITE_PAGES,
  type SitePage,
  withReturnTo,
} from '@/lib/admin/site-pages'
import { cn } from '@/lib/utils'
import {
  DirectoryList,
  DirectoryRow,
  DirectorySection,
  EditAction,
  EmptyNote,
  LoadErrorNote,
  NotPublicNote,
  ReadOnlyNote,
  SectionLink,
  StatusUnavailable,
  ViewAction,
} from './directory-parts'
import { PageStatusTag, type PageStatusTone } from './page-status-tag'
import { mutedText } from './styles'

const DIRECTORY_PATH = '/admin/pages'

export const SITE_PAGES_INTRO =
  'Fed by the dashboard. Edit opens the part that feeds the page.'
export const TRIP_PAGES_INTRO =
  'Each trip has its own page. Editing opens the page itself, so you see what members see.'
export const NOTICES_INTRO =
  'The live notice shows on the home page and has its own page.'
const TIME_ZONE = 'America/Los_Angeles'

const dayFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  timeZone: TIME_ZONE,
})
const timeFormat = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: TIME_ZONE,
})
const shortDayFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: TIME_ZONE,
})

const tripWhen = (trip: DirectoryTrip) => {
  const start = new Date(trip.startsAt)
  const day = dayFormat.format(start)
  return trip.isAllDay
    ? `${day}, time to be announced`
    : `${day}, ${timeFormat.format(start)}`
}

const noticeTone: Record<NoticeState, PageStatusTone> = {
  Live: 'live',
  Scheduled: 'scheduled',
  Draft: 'draft',
  Expired: 'ended',
  Archived: 'ended',
}

const noticeWhen = (notice: DirectoryNotice) => {
  const start = shortDayFormat.format(new Date(notice.startsAt))
  const end = shortDayFormat.format(new Date(notice.endsAt))
  if (notice.state === 'Live') return `Showing until ${end}`
  if (notice.state === 'Scheduled') return `Goes live ${start}, ends ${end}`
  return `Planned for ${start} to ${end}`
}

type EditablePage = SitePage & { editor: NonNullable<SitePage['editor']> }

const pageFact = (
  page: EditablePage,
  data: PagesDirectoryData,
): Loaded<string> =>
  page.path === '/' ? data.homeFact : data.facts[page.editor]

function SitePageRow({
  page,
  data,
  quietErrors,
}: {
  page: EditablePage
  data: PagesDirectoryData
  /** A note above the list already explains the failure. */
  quietErrors: boolean
}) {
  const editor = PAGE_EDITORS[page.editor]
  const level = data.access[page.editor]
  const fact = pageFact(page, data)
  const canOpenEditor = level === 'edit' || level === 'assigned'
  return (
    <DirectoryRow
      title={page.name}
      path={page.path}
      compact={!canOpenEditor}
      detail={
        <>
          {fact.status === 'ready' ? (
            fact.value
          ) : fact.status === 'error' && !quietErrors ? (
            <StatusUnavailable />
          ) : (
            page.summary
          )}
          {canOpenEditor ? null : (
            <span className="block">
              <ReadOnlyNote>Your role can’t edit this page.</ReadOnlyNote>
            </span>
          )}
        </>
      }
      actions={
        <>
          {canOpenEditor ? (
            <EditAction
              href={withReturnTo(editor.href, DIRECTORY_PATH)}
              label={level === 'assigned' ? 'Open trips' : editor.action}
              className="sm:min-w-[7.5rem]"
            />
          ) : null}
          <ViewAction href={page.path} name={page.name} />
        </>
      }
    />
  )
}

function SitePageRows({ data }: { data: PagesDirectoryData }) {
  const editable = SITE_PAGES.flatMap((page): EditablePage[] =>
    page.editor ? [{ ...page, editor: page.editor }] : [],
  )
  const failures = editable.filter(
    page => pageFact(page, data).status === 'error',
  ).length
  const quietErrors = failures > 2
  return (
    <DirectorySection
      id="pages-site"
      title="Site pages"
      intro={SITE_PAGES_INTRO}
    >
      {quietErrors ? (
        <div className="mb-3">
          <LoadErrorNote>
            We couldn’t load what some of these pages are showing right now.
            Editing still works. Reload the page to try again.
          </LoadErrorNote>
        </div>
      ) : null}
      <DirectoryList>
        {editable.map(page => (
          <SitePageRow
            key={page.path}
            page={page}
            data={data}
            quietErrors={quietErrors}
          />
        ))}
      </DirectoryList>
    </DirectorySection>
  )
}

const tripsIntro = (data: PagesDirectoryData) =>
  data.access.trips === 'assigned'
    ? 'Each trip has its own page. The trips you lead come first, and those are the ones you can edit.'
    : TRIP_PAGES_INTRO

function TripRow({ trip }: { trip: DirectoryTrip }) {
  return (
    <DirectoryRow
      title={trip.title}
      compact={!trip.canEdit}
      tag={
        <>
          {trip.isCanceled ? (
            <PageStatusTag tone="canceled">Canceled</PageStatusTag>
          ) : (
            <PageStatusTag tone="live">Live</PageStatusTag>
          )}
          {trip.isLed ? (
            <PageStatusTag tone="led">You lead</PageStatusTag>
          ) : null}
        </>
      }
      detail={`${tripWhen(trip)} · ${trip.isOfficial ? 'Official trip' : 'Community trip'}`}
      actions={
        <>
          {trip.canEdit ? (
            <EditAction
              href={withReturnTo(`/trips/${trip.id}?edit=1`, DIRECTORY_PATH)}
              label="Edit"
            />
          ) : null}
          <ViewAction href={`/trips/${trip.id}`} name={trip.title} />
        </>
      }
    />
  )
}

function TripRows({ data }: { data: PagesDirectoryData }) {
  if (data.trips.status === 'hidden') return null
  return (
    <DirectorySection
      id="pages-trips"
      title="Trip pages"
      intro={
        <>
          {tripsIntro(data)}
          {data.trips.status === 'ready' &&
          data.trips.value.total > data.trips.value.items.length ? (
            <span className="sm:hidden">
              {' '}
              Showing {data.trips.value.items.length} of{' '}
              {data.trips.value.total} upcoming.
            </span>
          ) : null}
        </>
      }
      footer={
        <span className="flex flex-wrap items-baseline gap-x-4">
          {data.trips.status === 'ready' &&
          data.trips.value.total > data.trips.value.items.length ? (
            <span className={cn('hidden text-sm sm:inline', mutedText)}>
              Showing {data.trips.value.items.length} of{' '}
              {data.trips.value.total} upcoming
            </span>
          ) : null}
          {data.trips.status === 'error' ? null : (
            <SectionLink href="/admin/trips" label="All trips" />
          )}
        </span>
      }
    >
      {data.trips.status === 'error' ? (
        <LoadErrorNote action={{ href: '/admin/trips', label: 'Open Trips' }}>
          We couldn’t load the trips. Reload the page, or find them in Trips.
        </LoadErrorNote>
      ) : data.trips.value.items.length ? (
        <DirectoryList>
          {data.trips.value.items.map(trip => (
            <TripRow key={trip.id} trip={trip} />
          ))}
        </DirectoryList>
      ) : (
        <EmptyNote
          action={
            data.canCreateTrip
              ? { href: '/admin/trips/new', label: 'Create a trip' }
              : undefined
          }
        >
          {data.canCreateTrip
            ? 'Nothing on the schedule yet.'
            : 'Nothing on the schedule yet. Trips appear here once they’re published.'}
        </EmptyNote>
      )}
    </DirectorySection>
  )
}

function NoticeRows({ data }: { data: PagesDirectoryData }) {
  if (data.notices.status === 'hidden') return null
  const canEdit = data.access.notices === 'edit'
  return (
    <DirectorySection
      id="pages-notices"
      title="Notices"
      intro={
        canEdit
          ? NOTICES_INTRO
          : 'Your role can’t edit notices. You can view the live one.'
      }
      footer={
        data.notices.status === 'error' ? undefined : (
          <SectionLink href="/admin/announcements" label="All notices" />
        )
      }
    >
      {data.notices.status === 'error' ? (
        <LoadErrorNote
          action={{ href: '/admin/announcements', label: 'Open Announcements' }}
        >
          We couldn’t load the notices. Reload the page, or find them in
          Announcements.
        </LoadErrorNote>
      ) : data.notices.value.items.length ? (
        <DirectoryList>
          {data.notices.value.items.map(notice => (
            <DirectoryRow
              key={notice.id}
              title={notice.title}
              compact={!canEdit}
              tag={
                <PageStatusTag tone={noticeTone[notice.state]}>
                  {notice.state}
                </PageStatusTag>
              }
              detail={noticeWhen(notice)}
              actions={
                <>
                  {canEdit ? (
                    <EditAction
                      href={`/admin/announcements/${notice.id}`}
                      label="Edit"
                    />
                  ) : null}
                  {notice.state === 'Live' ? (
                    <ViewAction
                      href={`/announcements/${notice.slug}`}
                      name={notice.title}
                    />
                  ) : (
                    <NotPublicNote />
                  )}
                </>
              }
            />
          ))}
        </DirectoryList>
      ) : (
        <EmptyNote
          action={
            canEdit
              ? { href: '/admin/announcements/new', label: 'Write a notice' }
              : undefined
          }
        >
          No notice is live, scheduled, or in draft.
        </EmptyNote>
      )}
    </DirectorySection>
  )
}

/** Nothing here loads, so the skeleton renders this section as-is. */
export function CodePagesSection() {
  return (
    <DirectorySection
      id="pages-code"
      title="Written in code"
      intro="The wording on these pages lives in the site’s code, so it can’t be changed from the dashboard. Send edits to whoever maintains the website."
    >
      <DirectoryList>
        {SITE_PAGES.filter(page => !page.editor).map(page => (
          <DirectoryRow
            key={page.path}
            title={page.name}
            path={page.path}
            detail={page.summary}
            compact
            actions={<ViewAction href={page.path} name={page.name} />}
          />
        ))}
      </DirectoryList>
    </DirectorySection>
  )
}

export function PagesDirectory({ data }: { data: PagesDirectoryData }) {
  return (
    <div className="mt-10 grid gap-12">
      <SitePageRows data={data} />
      <TripRows data={data} />
      <NoticeRows data={data} />
      <CodePagesSection />
    </div>
  )
}
