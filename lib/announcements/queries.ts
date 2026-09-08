import 'server-only'
import { connection } from 'next/server'
import { cache } from 'react'
import { createPublicClient } from '@/lib/supabase/public'

export const getActiveAnnouncement = cache(async () => {
  await connection()
  const { data, error } = await createPublicClient().rpc(
    'get_active_announcement',
  )
  if (error) {
    console.error('Unable to load homepage announcement:', error.code)
    return null
  }
  return data?.[0] ?? null
})
export const getPublishedAnnouncements = cache(async () => {
  await connection()
  const { data, error } = await createPublicClient()
    .from('announcements')
    .select('*')
    .eq('status', 'published')
    .order('starts_at', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
  if (error)
    throw new Error('Announcements could not be loaded. Please try again.')
  return data
})
export const getAnnouncementBySlug = cache(async (slug: string) => {
  await connection()
  const { data, error } = await createPublicClient()
    .from('announcements')
    .select('*')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle()
  if (error)
    throw new Error('This announcement could not be loaded. Please try again.')
  return data
})
