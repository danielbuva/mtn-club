import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { GalleryAdminClient } from '@/components/gallery/gallery-admin-client'
import { requireAdminCapability } from '@/lib/admin/auth'
import {
  type GalleryPhotoRow,
  getGalleryPublicUrl,
} from '@/lib/gallery/queries'
import { createClient } from '@/lib/supabase/server'

export default async function AdminGalleryPage() {
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
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
      <AdminPageHeader
        title="Club gallery"
        description="Upload club photographs, write accessible descriptions, and publish the records ready for the public gallery."
      />
      <GalleryAdminClient
        userId={context.userId}
        schemaReady={!photosResult.error}
        initialPhotos={photos}
        trips={tripsResult.data ?? []}
        canCreate={Boolean(context.permissions['gallery.create'])}
        canUpdate={Boolean(context.permissions['gallery.update'])}
        canDelete={Boolean(context.permissions['gallery.delete'])}
      />
    </div>
  )
}
