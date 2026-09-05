import { involvementCenterGalleryPhotos } from '@/lib/gallery/involvement-center-photos'

function galleryPhoto(documentId: string) {
  const photo = involvementCenterGalleryPhotos.find(
    item => item.id === `involvement-center-${documentId}`,
  )
  if (!photo) throw new Error(`Missing About gallery photo: ${documentId}`)
  return photo
}

// These archive photos are distinct from the home covers and welcome sunset.
export const aboutPhotos = {
  hero: galleryPhoto('abbac296-47d8-4776-d29f-08d9cf59c26c'),
  story: galleryPhoto('f9e6f79d-8fef-4762-d29e-08d9cf59c26c'),
  hikes: galleryPhoto('fe66e3b1-67c4-4f60-d2a7-08d9cf59c26c'),
  climbing: galleryPhoto('4f394f1d-db1f-472f-d2a2-08d9cf59c26c'),
  snow: galleryPhoto('737be852-bfa8-4354-9ceb-08d9cf59c4ce'),
  workshops: galleryPhoto('13898c4d-eba6-468d-9cea-08d9cf59c4ce'),
}
