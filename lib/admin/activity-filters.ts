export type ActivitySearchParams = Record<string, string | string[] | undefined>

export const activitySorts = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  action_asc: 'Action A–Z',
  action_desc: 'Action Z–A',
} as const

export type ActivitySort = keyof typeof activitySorts

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? ''

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value)
    ? value
    : ''
}

export function parseActivityFilters(params: ActivitySearchParams) {
  const rawSort = first(params.historySort)
  const sort: ActivitySort =
    rawSort === 'oldest' ||
    rawSort === 'action_asc' ||
    rawSort === 'action_desc'
      ? rawSort
      : 'newest'
  const rawPage = Number(first(params.historyPage))
  return {
    owner: first(params.owner).trim().slice(0, 100),
    action: first(params.action).trim().slice(0, 100),
    from: validDate(first(params.from)),
    to: validDate(first(params.to)),
    sort,
    page: Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  }
}

export function activityHistoryHref(
  params: ActivitySearchParams,
  page: number,
) {
  const query = new URLSearchParams()
  for (const key of ['range', 'owner', 'action', 'from', 'to', 'historySort']) {
    const value = first(params[key])
    if (value) query.set(key, value)
  }
  query.set('historyPage', String(page))
  return `/admin/analytics?${query}#activity-history`
}

export function activityOwnerName(
  actorId: string | null,
  names: ReadonlyMap<string, string | null>,
) {
  if (!actorId) return 'System / unavailable'
  return names.get(actorId)?.trim() || `User ${actorId}`
}

export function literalSearch(value: string) {
  return value.replace(/[\\%_]/g, character => `\\${character}`)
}
