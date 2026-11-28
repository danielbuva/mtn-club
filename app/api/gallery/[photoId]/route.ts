import { z } from 'zod'
import { galleryImageMimeTypes } from '@/lib/gallery/images'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const headers = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> },
) {
  const { photoId } = await params
  if (!z.uuid().safeParse(photoId).success)
    return new Response(null, { status: 404, headers })

  const db = await createClient()
  const photo = await db
    .from('gallery_photos')
    .select('storage_path')
    .eq('id', photoId)
    .maybeSingle()
  if (photo.error) return new Response(null, { status: 503, headers })
  const path = photo.data?.storage_path
  if (!path || path.startsWith('https://'))
    return new Response(null, { status: 404, headers })

  const image = await createAdminClient()
    .storage.from('club_gallery')
    .download(path)
  if (image.error || !galleryImageMimeTypes.has(image.data.type))
    return new Response(null, { status: 404, headers })

  return new Response(image.data.stream(), {
    headers: {
      ...headers,
      'Content-Type': image.data.type,
      'Content-Length': String(image.data.size),
    },
  })
}
