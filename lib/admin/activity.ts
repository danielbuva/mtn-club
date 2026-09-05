import 'server-only'

import {
  type ActivitySearchParams,
  activityOwnerName,
  literalSearch,
  parseActivityFilters,
} from '@/lib/admin/activity-filters'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/types'

type ActivityRow = Pick<
  Database['public']['Tables']['admin_activity_events']['Row'],
  'id' | 'summary' | 'action' | 'created_at' | 'actor_user_id'
>

export async function withActivityOwners(rows: ActivityRow[]) {
  const ids = [
    ...new Set(
      rows.flatMap(row => (row.actor_user_id ? [row.actor_user_id] : [])),
    ),
  ]
  const admin = createAdminClient()
  const profiles = ids.length
    ? await admin
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', ids)
    : { data: [], error: null }
  if (profiles.error) throw profiles.error
  const names = new Map(
    (profiles.data ?? []).map(profile => [
      profile.user_id,
      profile.display_name,
    ]),
  )
  return rows.map(row => ({
    id: row.id,
    summary: row.summary,
    action: row.action,
    createdAt: row.created_at,
    owner: activityOwnerName(row.actor_user_id, names),
  }))
}

export async function getActivityHistory(params: ActivitySearchParams) {
  await requireAdminCapability('analytics.read')
  const filters = parseActivityFilters(params)
  if (filters.from && filters.to && filters.from > filters.to) {
    return { error: 'Choose an end date on or after the start date.' } as const
  }
  const admin = createAdminClient()
  let query = admin
    .from('admin_activity_events')
    .select('id, summary, action, created_at, actor_user_id', {
      count: 'exact',
    })
  if (filters.owner) {
    // Page through matches so owner searches are not limited by the API row cap.
    const ids: string[] = []
    for (let offset = 0; ; offset += 500) {
      const profiles = await admin
        .from('profiles')
        .select('user_id')
        .ilike('display_name', `%${literalSearch(filters.owner)}%`)
        .order('user_id')
        .range(offset, offset + 499)
      if (profiles.error) throw profiles.error
      ids.push(...profiles.data.map(profile => profile.user_id))
      if (profiles.data.length < 500) break
    }
    if (!ids.length) return { items: [], count: 0, page: 1, pages: 1 } as const
    query = query.in('actor_user_id', ids)
  }
  if (filters.action)
    query = query.ilike(
      'action',
      `%${literalSearch(filters.action.replaceAll(' ', '_'))}%`,
    )
  if (filters.from)
    query = query.gte('created_at', `${filters.from}T00:00:00.000Z`)
  if (filters.to) {
    const end = new Date(`${filters.to}T00:00:00.000Z`)
    end.setUTCDate(end.getUTCDate() + 1)
    query = query.lt('created_at', end.toISOString())
  }
  if (filters.sort.startsWith('action_')) {
    query = query.order('action', { ascending: filters.sort === 'action_asc' })
  }
  query = query
    .order('created_at', { ascending: filters.sort === 'oldest' })
    .order('id', { ascending: filters.sort === 'oldest' })
  const pageSize = 25
  // Count first to clamp stale or manually entered page numbers.
  const countResult = await query.range(0, 0)
  if (countResult.error) throw countResult.error
  const count = countResult.count ?? 0
  const pages = Math.max(1, Math.ceil(count / pageSize))
  const page = Math.min(filters.page, pages)
  const result = await query.range((page - 1) * pageSize, page * pageSize - 1)
  if (result.error) throw result.error
  return { items: await withActivityOwners(result.data), count, page, pages }
}
