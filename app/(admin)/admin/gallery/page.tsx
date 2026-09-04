import { Suspense } from 'react'
import { AdminPanelFallback } from '@/components/admin/admin-panel-fallback'
import { AdminViewFrame } from '@/components/admin/admin-view-frame'
import { GalleryAdminClient } from '@/components/gallery/gallery-admin-client'
import { requireAdminCapability } from '@/lib/admin/auth'
import {
  type GalleryPhotoRow,
  getGalleryPublicUrl,
} from '@/lib/gallery/queries'
import { createClient } from '@/lib/supabase/server'

async function AdminGalleryPageContent() {
  const context = await requireAdminCapability('gallery.read')
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
    <GalleryAdminClient
      userId={context.userId}
      schemaReady={!photosResult.error}
      initialPhotos={photos}
      trips={tripsResult.data ?? []}
      canCreate={Boolean(context.permissions['gallery.create'])}
      canUpdate={Boolean(context.permissions['gallery.update'])}
      canDelete={Boolean(context.permissions['gallery.delete'])}
    />
  )
}

export default function AdminGalleryPage() {
  return (
    <AdminViewFrame view="gallery">
      <Suspense fallback={<AdminPanelFallback view="gallery" />}>
        <AdminGalleryPageContent />
      </Suspense>
    </AdminViewFrame>
  )
}
