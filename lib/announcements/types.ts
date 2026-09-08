import type { Database } from '@/lib/supabase/types'

export type Announcement = Database['public']['Tables']['announcements']['Row']
export type AnnouncementSummary = Pick<
  Announcement,
  'slug' | 'title' | 'subtitle' | 'description' | 'author_name'
>
export const ANNOUNCEMENT_TIME_ZONE = 'America/Los_Angeles'
