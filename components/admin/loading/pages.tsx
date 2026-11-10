import {
  DirectoryList,
  DirectorySection,
  SectionLink,
} from '@/components/admin/pages/directory-parts'
import {
  CodePagesSection,
  NOTICES_INTRO,
  SITE_PAGES_INTRO,
  TRIP_PAGES_INTRO,
} from '@/components/admin/pages/pages-directory'
import { TRIP_LIMIT } from '@/lib/admin/pages-limits'
import { SITE_PAGES } from '@/lib/admin/site-pages'
import { cn } from '@/lib/utils'
import { LoadingValue } from './primitives'

/** Same grid, line heights and action sizes as a loaded DirectoryRow. */
function LoadingRow({
  title,
  path,
  tag = false,
  editWidth,
}: {
  title?: string
  path?: string
  tag?: boolean
  /** Matches the Edit button this row will get. */
  editWidth: string
}) {
  return (
    <li className="grid gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 sm:py-3.5">
      <div className="min-w-0">
        <div className="flex h-6 items-center gap-2.5">
          {title ? (
            <span className="text-[15px] font-semibold leading-6">{title}</span>
          ) : (
            <LoadingValue className="w-44" />
          )}
          {path ? (
            <span className="font-mono text-[13px] text-[#6A5146] dark:text-muted-foreground">
              {path}
            </span>
          ) : null}
          {tag ? <LoadingValue className="h-6 w-14" /> : null}
        </div>
        <div className="mt-0.5 flex h-6 items-center">
          <LoadingValue className="h-3 w-48 max-w-full" />
        </div>
      </div>
      <div className="flex gap-2">
        <LoadingValue className={cn('h-11 sm:h-9', editWidth)} />
        <LoadingValue className="h-11 w-16 sm:h-9 sm:w-24" />
      </div>
    </li>
  )
}

export function PagesLoading() {
  return (
    <div className="mt-10 grid gap-12">
      <DirectorySection
        id="pages-site"
        title="Site pages"
        intro={SITE_PAGES_INTRO}
      >
        <DirectoryList>
          {SITE_PAGES.filter(page => page.editor).map(page => (
            <LoadingRow
              key={page.path}
              title={page.name}
              path={page.path}
              editWidth="w-28 sm:w-[7.5rem]"
            />
          ))}
        </DirectoryList>
      </DirectorySection>

      <DirectorySection
        id="pages-trips"
        title="Trip pages"
        intro={TRIP_PAGES_INTRO}
        footer={<SectionLink href="/admin/trips" label="All trips" />}
      >
        <DirectoryList>
          {Array.from({ length: TRIP_LIMIT }, (_, row) => row).map(row => (
            <LoadingRow key={row} tag editWidth="w-14" />
          ))}
        </DirectoryList>
      </DirectorySection>

      <DirectorySection
        id="pages-notices"
        title="Notices"
        intro={NOTICES_INTRO}
        footer={<SectionLink href="/admin/announcements" label="All notices" />}
      >
        <DirectoryList>
          {[0, 1, 2].map(row => (
            <LoadingRow key={row} tag editWidth="w-14" />
          ))}
        </DirectoryList>
      </DirectorySection>

      <CodePagesSection />
    </div>
  )
}
