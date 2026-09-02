import { notFound, redirect } from 'next/navigation'
import { GalleryAdminClient } from '@/components/gallery/gallery-admin-client'
import { getViewer } from '@/lib/auth/viewer'
import {
  type GalleryPhotoRow,
  getGalleryPublicUrl,
} from '@/lib/gallery/queries'
import { isLeaderRole } from '@/lib/memberships/types'
import { createClient } from '@/lib/supabase/server'

export default async function AdminGalleryPage() {
  const viewer = await getViewer()
  if (!viewer.isAuthenticated || !viewer.userId) {
    redirect('/auth/login?returnTo=/admin/gallery')
  }
  if (!isLeaderRole(viewer.member?.role)) {
    notFound()
  }

  const supabase = await createClient()
  const [photosResult, tripsResult] = await Promise.all([
    supabase
      .from('gallery_photos')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('trips')
      .select('id, title, starts_at')
      .order('starts_at', { ascending: false })
      .limit(100),
  ])

  const photos = (photosResult.data ?? []).map((photo: GalleryPhotoRow) => ({
    ...photo,
    imageUrl: getGalleryPublicUrl(supabase, photo.storage_path),
  }))

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Officer tools
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Club gallery
        </h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Upload real club photographs, write useful alternative text, and
          deliberately publish only the records ready for the public gallery.
        </p>
      </div>

      <GalleryAdminClient
        userId={viewer.userId}
        schemaReady={!photosResult.error}
        initialPhotos={photos}
        trips={tripsResult.data ?? []}
      />
    </main>
  )
}
