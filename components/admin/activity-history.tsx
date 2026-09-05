import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getActivityHistory } from '@/lib/admin/activity'
import {
  type ActivitySearchParams,
  activityHistoryHref,
  activitySorts,
  parseActivityFilters,
} from '@/lib/admin/activity-filters'
import { requireAdminCapability } from '@/lib/admin/auth'

const fieldClass =
  'mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring'

export async function ActivityHistory({
  searchParams,
}: {
  searchParams: Promise<ActivitySearchParams>
}) {
  await requireAdminCapability('analytics.read')
  const params = await searchParams
  const filters = parseActivityFilters(params)
  const range = typeof params.range === 'string' ? params.range : 'term'
  const history = await getActivityHistory(params).catch(() => ({
    error:
      'Activity history could not be loaded. Try applying the filters again.',
  }))

  return (
    <section
      id="activity-history"
      className="mt-6 scroll-mt-6 border border-[#211D18]/15 bg-white/45 p-6 dark:border-border dark:bg-card"
    >
      <h2 className="font-brand text-2xl uppercase">Activity history</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        All recorded activity. These filters apply independently of the metrics
        above. Dates are in UTC.
      </p>
      <form
        key={JSON.stringify(filters)}
        action="/admin/analytics#activity-history"
        className="mt-5"
      >
        <input type="hidden" name="range" value={range} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <label className="text-sm font-semibold">
            By
            <input
              name="owner"
              defaultValue={filters.owner}
              placeholder="Search names"
              maxLength={100}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-semibold">
            Action
            <input
              name="action"
              defaultValue={filters.action}
              placeholder="e.g. trip updated"
              maxLength={100}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-semibold">
            From
            <input
              name="from"
              type="date"
              defaultValue={filters.from}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-semibold">
            Through
            <input
              name="to"
              type="date"
              defaultValue={filters.to}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-semibold">
            Sort by
            <select
              name="historySort"
              defaultValue={filters.sort}
              className={fieldClass}
            >
              {Object.entries(activitySorts).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex gap-3">
          <Button type="submit">Apply filters</Button>
          <Button asChild variant="outline">
            <Link
              href={`/admin/analytics?range=${encodeURIComponent(range)}#activity-history`}
            >
              Clear filters
            </Link>
          </Button>
        </div>
      </form>
      {'error' in history ? (
        <p role="alert" className="mt-5 text-sm text-destructive">
          {history.error}
        </p>
      ) : (
        <>
          <p className="mt-5 text-sm text-muted-foreground">
            {history.count.toLocaleString()} matching{' '}
            {history.count === 1 ? 'entry' : 'entries'}
          </p>
          {history.items.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Complete admin activity history showing who performed each
                  action and timestamps
                </caption>
                <thead className="bg-[#E9DDC3]/70 text-xs uppercase tracking-wide dark:bg-secondary">
                  <tr>
                    {['Activity', 'By', 'Action', 'Date (UTC)'].map(label => (
                      <th key={label} scope="col" className="px-4 py-3">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#211D18]/10 dark:divide-border">
                  {history.items.map(item => (
                    <tr key={item.id}>
                      <td className="min-w-48 px-4 py-4 font-medium">
                        {item.summary}
                      </td>
                      <td className="max-w-64 break-words px-4 py-4">
                        {item.owner}
                      </td>
                      <td className="px-4 py-4">
                        {item.action.replaceAll('_', ' ')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <time dateTime={item.createdAt}>
                          {new Intl.DateTimeFormat('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            timeZone: 'UTC',
                          }).format(new Date(item.createdAt))}
                        </time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No activity matches these filters. Try a different name, action,
              or date range.
            </p>
          )}
          <nav
            aria-label="Activity history pages"
            className="mt-5 flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-sm text-muted-foreground">
              Page {history.page} of {history.pages}
            </p>
            <div className="flex gap-3">
              {history.page > 1 ? (
                <Button asChild variant="outline">
                  <Link href={activityHistoryHref(params, history.page - 1)}>
                    Previous
                  </Link>
                </Button>
              ) : null}
              {history.page < history.pages ? (
                <Button asChild variant="outline">
                  <Link href={activityHistoryHref(params, history.page + 1)}>
                    Next
                  </Link>
                </Button>
              ) : null}
            </div>
          </nav>
        </>
      )}
    </section>
  )
}
