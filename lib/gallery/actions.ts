'use server'

import { z } from 'zod'
import { getAdminContext } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function discardGalleryUpload(path: string) {
  const context = await getAdminContext()
  if (
    !context?.permissions['gallery.create'] ||
    typeof path !== 'string' ||
    path.length > 80
  )
    return
  const [folder, file, ...rest] = path.split('/')
  const [stem, extension, ...suffix] = (file ?? '').split('.')
  if (
    folder !== context.userId ||
    rest.length ||
    suffix.length ||
    !z.uuid().safeParse(stem).success ||
    !z.enum(['jpg', 'png', 'webp', 'avif']).safeParse(extension).success
  )
    return

  const admin = createAdminClient()
  const reference = await admin
    .from('gallery_photos')
    .select('id')
    .eq('storage_path', path)
    .maybeSingle()
  if (!reference.error && !reference.data)
    await admin.storage.from('club_gallery').remove([path])
}

export async function removeGalleryPhoto(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const context = await getAdminContext()
  const failure = 'Could not remove the photo. Refresh and try again.'
  if (
    !context?.permissions['gallery.delete'] ||
    !z.uuid().safeParse(id).success
  )
    return { ok: false, message: failure }

  const db = await createClient()
  const photo = await db
    .from('gallery_photos')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle()
  if (photo.error || !photo.data) return { ok: false, message: failure }

  const path = photo.data.storage_path
  if (!path.startsWith('https://')) {
    const removed = await createAdminClient()
      .storage.from('club_gallery')
      .remove([path])
    if (removed.error) return { ok: false, message: failure }
  }
  const removed = await db.from('gallery_photos').delete().eq('id', id)
  return removed.error ? { ok: false, message: failure } : { ok: true }
}
