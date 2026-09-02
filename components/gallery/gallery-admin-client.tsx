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

type AdminGalleryPhoto = GalleryPhotoRow & { imageUrl: string }
type GalleryTripOption = { id: string; title: string; starts_at: string }

type GalleryAdminClientProps = {
  userId: string
  schemaReady: boolean
  initialPhotos: AdminGalleryPhoto[]
  trips: GalleryTripOption[]
}

const allowedFileTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
])

export function GalleryAdminClient({
  userId,
  schemaReady,
  initialPhotos,
  trips,
}: GalleryAdminClientProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const title = String(formData.get('title') ?? '').trim()
    const altText = String(formData.get('altText') ?? '').trim()
    const caption = String(formData.get('caption') ?? '').trim()
    const tripId = String(formData.get('tripId') ?? '').trim()
    const takenOn = String(formData.get('takenOn') ?? '').trim()
    const extension = file ? allowedFileTypes.get(file.type) : undefined

    if (!file || !extension) {
      setMessage('Choose a JPG, PNG, WebP, or AVIF image.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage('The image must be 10 MB or smaller.')
      return
    }
    if (!title || !altText) {
      setMessage('Title and alternative text are required.')
      return
    }

    setIsBusy(true)
    setMessage(null)
    const supabase = createClient()
    const storagePath = `uploads/${crypto.randomUUID()}.${extension}`
    const upload = await supabase.storage
      .from('club_gallery')
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (upload.error) {
      setMessage(upload.error.message)
      setIsBusy(false)
      return
    }

    const metadata = await supabase.from('gallery_photos').insert({
      storage_path: storagePath,
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
      await supabase.storage.from('club_gallery').remove([storagePath])
      setMessage(metadata.error.message)
      setIsBusy(false)
      return
    }

    form.reset()
    setFile(null)
    setMessage('Photo uploaded as an unpublished draft.')
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
    const storageResult = await supabase.storage
      .from('club_gallery')
      .remove([photo.storage_path])
    if (storageResult.error) {
      setMessage(storageResult.error.message)
      setIsBusy(false)
      return
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
      <div className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6">
        The gallery migration has not been applied to this Supabase environment
        yet. Uploads remain safely unavailable.
      </div>
    )
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,24rem)_1fr]">
      <form
        onSubmit={handleUpload}
        className="h-fit space-y-5 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24"
      >
        <div>
          <h2 className="text-xl font-semibold">Upload a draft</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            New uploads stay unpublished until an officer chooses Publish.
          </p>
        </div>
        <Field label="Image" htmlFor="gallery-file">
          <Input
            id="gallery-file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            required
            onChange={event => setFile(event.target.files?.[0] ?? null)}
          />
        </Field>
        <Field label="Title" htmlFor="gallery-title">
          <Input id="gallery-title" name="title" required maxLength={120} />
        </Field>
        <Field label="Alternative text" htmlFor="gallery-alt">
          <Textarea
            id="gallery-alt"
            name="altText"
            required
            maxLength={300}
            placeholder="Describe what is visible for someone who cannot see the photo."
          />
        </Field>
        <Field label="Caption (optional)" htmlFor="gallery-caption">
          <Textarea id="gallery-caption" name="caption" maxLength={600} />
        </Field>
        <Field label="Trip (optional)" htmlFor="gallery-trip">
          <select
            id="gallery-trip"
            name="tripId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Not linked to a trip</option>
            {trips.map(trip => (
              <option key={trip.id} value={trip.id}>
                {trip.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date taken (optional)" htmlFor="gallery-date">
          <Input id="gallery-date" name="takenOn" type="date" />
        </Field>
        <Button type="submit" disabled={isBusy} className="w-full">
          {isBusy ? 'Working…' : 'Upload unpublished draft'}
        </Button>
        {message && (
          <output className="block text-sm leading-6 text-muted-foreground">
            {message}
          </output>
        )}
      </form>

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
          <div className="mt-4 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No photos have been uploaded.
          </div>
        ) : (
          <div className="mt-4 space-y-5">
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
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid sm:grid-cols-[11rem_1fr]">
        <div className="relative min-h-48 bg-muted sm:min-h-full">
          <Image
            src={photo.imageUrl}
            alt=""
            fill
            sizes="176px"
            className="object-cover"
          />
        </div>
        <form onSubmit={saveMetadata} className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
              {photo.is_published ? 'Published' : 'Draft'}
            </span>
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
          </div>
          <Field label="Title" htmlFor={`title-${photo.id}`}>
            <Input
              id={`title-${photo.id}`}
              name="title"
              defaultValue={photo.title}
              required
            />
          </Field>
          <Field label="Alternative text" htmlFor={`alt-${photo.id}`}>
            <Textarea
              id={`alt-${photo.id}`}
              name="altText"
              defaultValue={photo.alt_text}
              required
            />
          </Field>
          <Field label="Caption" htmlFor={`caption-${photo.id}`}>
            <Textarea
              id={`caption-${photo.id}`}
              name="caption"
              defaultValue={photo.caption ?? ''}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Trip" htmlFor={`trip-${photo.id}`}>
              <select
                id={`trip-${photo.id}`}
                name="tripId"
                defaultValue={photo.trip_id ?? ''}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button type="submit" size="sm" disabled={isBusy}>
              Save metadata
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isBusy}
              onClick={() => onPublish(photo)}
            >
              {photo.is_published ? 'Unpublish' : 'Publish'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isBusy}
              onClick={() => onRemove(photo)}
            >
              Remove
            </Button>
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
