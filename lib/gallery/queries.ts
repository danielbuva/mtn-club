import { galleryImageUrl } from '@/lib/gallery/images'
import { createPublicClient } from '@/lib/supabase/public'
import type { Database } from '@/lib/supabase/types'

export type GalleryPhotoRow =
  Database['public']['Tables']['gallery_photos']['Row']

export type PublicGalleryPhoto = Pick<
  GalleryPhotoRow,
  'id' | 'title' | 'alt_text' | 'caption' | 'taken_on' | 'trip_id'
> & {
  imageUrl: string
  unoptimized?: boolean
}

const publicGallerySelect =
  'id, title, alt_text, caption, taken_on, trip_id, storage_path'

export type PublishedGalleryResult =
  | { status: 'ok'; photos: PublicGalleryPhoto[] }
  | { status: 'error' }

export async function fetchPublishedGalleryPhotos(): Promise<PublishedGalleryResult> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('gallery_photos')
      .select(publicGallerySelect)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('taken_on', { ascending: false, nullsFirst: false })

    if (error) return { status: 'error' }

    return {
      status: 'ok',
      photos: (data ?? []).map(photo => ({
        id: photo.id,
        title: photo.title,
        alt_text: photo.alt_text,
        caption: photo.caption,
        taken_on: photo.taken_on,
        trip_id: photo.trip_id,
        imageUrl: galleryImageUrl(photo),
        unoptimized: true,
      })),
    }
  } catch {
    return { status: 'error' }
  }
}
