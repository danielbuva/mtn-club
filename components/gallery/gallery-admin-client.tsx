'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { GalleryPhotoRow } from '@/lib/gallery/queries'
import { createClient } from '@/lib/supabase/client'
import { GalleryDraftForm } from './gallery-draft-form'

type AdminGalleryPhoto = GalleryPhotoRow & { imageUrl: string }
type GalleryTripOption = { id: string; title: string; starts_at: string }

type GalleryAdminClientProps = {
  userId: string
  schemaReady: boolean
  initialPhotos: AdminGalleryPhoto[]
  trips: GalleryTripOption[]
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export function GalleryAdminClient({
  userId,
  schemaReady,
  initialPhotos,
  trips,
  canCreate,
  canUpdate,
  canDelete,
}: GalleryAdminClientProps) {
  const router = useRouter()
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const title = String(formData.get('title') ?? '').trim()
    const altText = String(formData.get('altText') ?? '').trim()
    const caption = String(formData.get('caption') ?? '').trim()
    const tripId = String(formData.get('tripId') ?? '').trim()
    const takenOn = String(formData.get('takenOn') ?? '').trim()
    const imageUrl = String(formData.get('imageUrl') ?? '').trim()

    try {
      const parsedUrl = new URL(imageUrl)
      if (
        parsedUrl.protocol !== 'https:' ||
        parsedUrl.username ||
        parsedUrl.password ||
        imageUrl.length > 2048
      ) {
        throw new Error('Invalid image URL')
      }
    } catch {
      setMessage('Enter a valid HTTPS image link.')
      return
    }
    if (!title || !altText) {
      setMessage('Title and alternative text are required.')
      return
    }

    setIsBusy(true)
    setMessage(null)
    const supabase = createClient()

    const metadata = await supabase.from('gallery_photos').insert({
      storage_path: imageUrl,
      title,
      alt_text: altText,
      caption: caption || null,
      trip_id: tripId || null,
      taken_on: takenOn || null,
      sort_order: initialPhotos.length,
      is_published: false,
      uploaded_by: userId,
    })

    if (metadata.error) {
      setMessage(metadata.error.message)
      setIsBusy(false)
      return
    }

    form.reset()
    setMessage('Image link saved as an unpublished draft.')
    setIsBusy(false)
    router.refresh()
  }

  const updatePublished = async (photo: AdminGalleryPhoto) => {
    setIsBusy(true)
    setMessage(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('gallery_photos')
      .update({ is_published: !photo.is_published })
      .eq('id', photo.id)
    setIsBusy(false)
    if (error) {
      setMessage(error.message)
      return
    }
    router.refresh()
  }

  const movePhoto = async (photoIndex: number, direction: -1 | 1) => {
    const swapIndex = photoIndex + direction
    const current = initialPhotos[photoIndex]
    const swap = initialPhotos[swapIndex]
    if (!current || !swap) return

    setIsBusy(true)
    setMessage(null)
    const supabase = createClient()
    const [currentResult, swapResult] = await Promise.all([
      supabase
        .from('gallery_photos')
        .update({ sort_order: swap.sort_order })
        .eq('id', current.id),
      supabase
        .from('gallery_photos')
        .update({ sort_order: current.sort_order })
        .eq('id', swap.id),
    ])
    setIsBusy(false)
    const error = currentResult.error ?? swapResult.error
    if (error) {
      setMessage(error.message)
      return
    }
    router.refresh()
  }

  const removePhoto = async (photo: AdminGalleryPhoto) => {
    if (!window.confirm(`Remove “${photo.title}” from the gallery?`)) return
    setIsBusy(true)
    setMessage(null)
    const supabase = createClient()
    if (!photo.storage_path.startsWith('https://')) {
      const storageResult = await supabase.storage
        .from('club_gallery')
        .remove([photo.storage_path])
      if (storageResult.error) {
        setMessage(storageResult.error.message)
        setIsBusy(false)
        return
      }
    }
    const metadataResult = await supabase
      .from('gallery_photos')
      .delete()
      .eq('id', photo.id)
    setIsBusy(false)
    if (metadataResult.error) {
      setMessage(metadataResult.error.message)
      return
    }
    router.refresh()
  }

  if (!schemaReady) {
    return (
      <div className="mt-10 border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6">
        The gallery migration has not been applied to this Supabase environment
        yet. New gallery entries remain safely unavailable.
      </div>
    )
  }

  return (
    <div className="mt-10 space-y-10">
      {canCreate ? (
        <GalleryDraftForm
          trips={trips}
          onSubmit={handleAdd}
          isBusy={isBusy}
          message={message}
        />
      ) : null}

      <section aria-labelledby="gallery-library-title">
        <div className="flex items-center justify-between gap-4">
          <h2 id="gallery-library-title" className="text-2xl font-semibold">
            Photo library
          </h2>
          <span className="text-sm text-muted-foreground">
            {initialPhotos.length} total
          </span>
        </div>
        {initialPhotos.length === 0 ? (
          <div className="mt-4 border border-dashed border-border p-10 text-center text-muted-foreground">
            No photos have been uploaded.
          </div>
        ) : (
          <div className="mt-4 grid gap-5 xl:grid-cols-2">
            {initialPhotos.map((photo, index) => (
              <GalleryPhotoEditor
                key={photo.id}
                photo={photo}
                index={index}
                count={initialPhotos.length}
                trips={trips}
                isBusy={isBusy}
                onMove={movePhoto}
                onPublish={updatePublished}
                onRemove={removePhoto}
                onBusyChange={setIsBusy}
                onMessage={setMessage}
                onSaved={() => router.refresh()}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function GalleryPhotoEditor({
  photo,
  index,
  count,
  trips,
  isBusy,
  onMove,
  onPublish,
  onRemove,
  onBusyChange,
  onMessage,
  onSaved,
  canUpdate,
  canDelete,
}: {
  photo: AdminGalleryPhoto
  index: number
  count: number
  trips: GalleryTripOption[]
  isBusy: boolean
  onMove: (index: number, direction: -1 | 1) => Promise<void>
  onPublish: (photo: AdminGalleryPhoto) => Promise<void>
  onRemove: (photo: AdminGalleryPhoto) => Promise<void>
  onBusyChange: (value: boolean) => void
  onMessage: (value: string | null) => void
  onSaved: () => void
  canUpdate: boolean
  canDelete: boolean
}) {
  const saveMetadata = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const title = String(formData.get('title') ?? '').trim()
    const altText = String(formData.get('altText') ?? '').trim()
    const caption = String(formData.get('caption') ?? '').trim()
    const tripId = String(formData.get('tripId') ?? '').trim()
    const takenOn = String(formData.get('takenOn') ?? '').trim()
    if (!title || !altText) {
      onMessage('Title and alternative text are required.')
      return
    }

    onBusyChange(true)
    onMessage(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('gallery_photos')
      .update({
        title,
        alt_text: altText,
        caption: caption || null,
        trip_id: tripId || null,
        taken_on: takenOn || null,
      })
      .eq('id', photo.id)
    onBusyChange(false)
    if (error) {
      onMessage(error.message)
      return
    }
    onMessage('Photo metadata saved.')
    onSaved()
  }

  return (
    <article className="overflow-hidden border border-border bg-card">
      <div>
        <div className="relative aspect-[16/9] bg-muted">
          <Image
            src={photo.imageUrl}
            alt=""
            fill
            unoptimized={photo.storage_path.startsWith('https://')}
            sizes="(min-width: 1280px) 40vw, 90vw"
            className="object-cover"
          />
        </div>
        <form onSubmit={saveMetadata} className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
              {photo.is_published ? 'Published' : 'Draft'}
            </span>
            {canUpdate ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isBusy || index === 0}
                  onClick={() => onMove(index, -1)}
                >
                  Move up
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isBusy || index === count - 1}
                  onClick={() => onMove(index, 1)}
                >
                  Move down
                </Button>
              </div>
            ) : null}
          </div>
          <Field label="Title" htmlFor={`title-${photo.id}`}>
            <Input
              id={`title-${photo.id}`}
              name="title"
              defaultValue={photo.title}
              required
              disabled={!canUpdate}
            />
          </Field>
          <Field label="Alternative text" htmlFor={`alt-${photo.id}`}>
            <Textarea
              id={`alt-${photo.id}`}
              name="altText"
              defaultValue={photo.alt_text}
              required
              disabled={!canUpdate}
            />
          </Field>
          <Field label="Caption" htmlFor={`caption-${photo.id}`}>
            <Textarea
              id={`caption-${photo.id}`}
              name="caption"
              defaultValue={photo.caption ?? ''}
              disabled={!canUpdate}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Trip" htmlFor={`trip-${photo.id}`}>
              <select
                id={`trip-${photo.id}`}
                name="tripId"
                defaultValue={photo.trip_id ?? ''}
                className="flex h-10 w-full border border-input bg-background px-3 py-2 text-sm"
                disabled={!canUpdate}
              >
                <option value="">Not linked</option>
                {trips.map(trip => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date taken" htmlFor={`date-${photo.id}`}>
              <Input
                id={`date-${photo.id}`}
                name="takenOn"
                type="date"
                defaultValue={photo.taken_on ?? ''}
                disabled={!canUpdate}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {canUpdate ? (
              <Button type="submit" size="sm" disabled={isBusy}>
                Save metadata
              </Button>
            ) : null}
            {canUpdate ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => onPublish(photo)}
              >
                {photo.is_published ? 'Unpublish' : 'Publish'}
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isBusy}
                onClick={() => onRemove(photo)}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </article>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
