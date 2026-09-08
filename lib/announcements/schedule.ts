import type { Announcement } from './types'

type Schedule = Pick<Announcement, 'status' | 'starts_at' | 'ends_at'>
export function announcementStatus(item: Schedule, now: number): string {
  if (item.status === 'draft') return 'Draft'
  if (item.status === 'archived') return 'Archived'
  if (Date.parse(item.starts_at) > now) return 'Scheduled'
  return Date.parse(item.ends_at) > now ? 'Live' : 'Expired'
}
export function schedulesOverlap(a: Schedule, b: Schedule): boolean {
  return (
    b.status === 'published' &&
    Date.parse(a.starts_at) < Date.parse(b.ends_at) &&
    Date.parse(a.ends_at) > Date.parse(b.starts_at)
  )
}
