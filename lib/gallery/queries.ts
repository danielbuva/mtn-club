import type { SupabaseClient } from '@supabase/supabase-js'
import { createPublicClient } from '@/lib/supabase/public'
import type { Database } from '@/lib/supabase/types'

export type GalleryPhotoRow =
  Database['public']['Tables']['gallery_photos']['Row']

export type PublicGalleryPhoto = Pick<
  GalleryPhotoRow,
  'id' | 'title' | 'alt_text' | 'caption' | 'taken_on' | 'trip_id'
> & {
  imageUrl: string
}

const publicGallerySelect =
  'id, title, alt_text, caption, taken_on, trip_id, storage_path'

export async function fetchPublishedGalleryPhotos(): Promise<
  PublicGalleryPhoto[]
> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('gallery_photos')
      .select(publicGallerySelect)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('taken_on', { ascending: false, nullsFirst: false })

    if (error) return []

    return (data ?? []).map(photo => ({
      id: photo.id,
      title: photo.title,
      alt_text: photo.alt_text,
      caption: photo.caption,
      taken_on: photo.taken_on,
      trip_id: photo.trip_id,
      imageUrl: getGalleryPublicUrl(supabase, photo.storage_path),
    }))
  } catch {
    return []
  }
}

export function getGalleryPublicUrl(
  client: SupabaseClient<Database>,
  storagePath: string,
): string {
  return client.storage.from('club_gallery').getPublicUrl(storagePath).data
    .publicUrl
}
