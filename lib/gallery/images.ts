const extensions = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
])

export const galleryImageMimeTypes = new Set(extensions.keys())

export function galleryUploadExtension(file: File) {
  return file.size > 0 && file.size <= 10 * 1024 * 1024
    ? extensions.get(file.type)
    : undefined
}

export function galleryImageUrl(photo: { id: string; storage_path: string }) {
  return photo.storage_path.startsWith('https://')
    ? photo.storage_path
    : `/api/gallery/${photo.id}`
}
