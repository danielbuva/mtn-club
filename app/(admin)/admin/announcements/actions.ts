'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdminCapability } from '@/lib/admin/auth'
import {
  type AnnouncementActionState,
  announcementSchema,
} from '@/lib/announcements/schema'
import { createClient } from '@/lib/supabase/server'

export async function saveAnnouncement(
  _previous: AnnouncementActionState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  const context = await requireAdminCapability('announcements.manage')
  const parsed = announcementSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success)
    return { error: parsed.error.issues.map(issue => issue.message).join(' ') }
  const { id, starts_at, ends_at, ...fields } = parsed.data
  if (!starts_at || !ends_at) return { error: 'Enter valid schedule dates.' }
  const client = await createClient()
  const values = { ...fields, starts_at, ends_at, updated_by: context.userId }
  const result = id
    ? await client
        .from('announcements')
        .update(values)
        .eq('id', id)
        .select('id')
        .single()
    : await client
        .from('announcements')
        .insert({
          ...values,
          created_by: context.userId,
          author_name: context.displayName.trim().slice(0, 120),
        })
        .select('id')
        .single()
  if (result.error)
    return {
      error:
        result.error.code === '23505'
          ? 'That URL slug is already in use. Choose another.'
          : 'The announcement could not be saved. Check your access and try again.',
    }
  revalidatePath('/')
  revalidatePath('/announcements', 'layout')
  revalidatePath('/admin/announcements', 'layout')
  if (!id) redirect(`/admin/announcements/${result.data.id}`)
  return { saved: true }
}
export async function deleteAnnouncement(
  _previous: AnnouncementActionState,
  formData: FormData,
): Promise<AnnouncementActionState> {
  await requireAdminCapability('announcements.manage')
  const id = z.string().uuid().safeParse(formData.get('id'))
  if (!id.success || formData.get('confirmed') !== 'yes')
    return { error: 'Confirm deletion before continuing.' }
  const client = await createClient()
  const { error } = await client
    .from('announcements')
    .delete()
    .eq('id', id.data)
    .select('id')
    .single()
  if (error)
    return { error: 'The announcement could not be deleted. Try again.' }
  revalidatePath('/')
  revalidatePath('/announcements', 'layout')
  revalidatePath('/admin/announcements', 'layout')
  redirect('/admin/announcements')
}
