import type { Metadata, Viewport } from 'next'
import { connection } from 'next/server'
import { Suspense } from 'react'
import {
  GalleryPage,
  GalleryPhotoCollection,
} from '@/components/landing/gallery-page'
import { involvementCenterGalleryPhotos } from '@/lib/gallery/involvement-center-photos'
import { fetchPublishedGalleryPhotos } from '@/lib/gallery/queries'

export const metadata: Metadata = {
  title: 'Gallery | UNLV Mountain Club',
  description:
    'Photographs from UNLV Mountain Club climbing, hiking, camping, backpacking, and snow trips.',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#F8F1DF',
}

async function PublishedGalleryPhotos() {
  await connection()
  const photos = await fetchPublishedGalleryPhotos()
  return (
    <GalleryPhotoCollection
      photos={[...involvementCenterGalleryPhotos, ...photos]}
    />
  )
}

export default function Page() {
  return (
    <GalleryPage>
      <Suspense
        fallback={
          <GalleryPhotoCollection photos={involvementCenterGalleryPhotos} />
        }
      >
        <PublishedGalleryPhotos />
      </Suspense>
    </GalleryPage>
  )
}
