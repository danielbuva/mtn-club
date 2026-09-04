'use client'
import type { FormEventHandler } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
export function GalleryDraftForm({
  trips = [],
  onSubmit,
  isBusy = false,
  disabled = false,
  message,
}: {
  trips?: { id: string; title: string }[]
  onSubmit?: FormEventHandler<HTMLFormElement>
  isBusy?: boolean
  disabled?: boolean
  message?: string | null
}) {
  return (
    <form onSubmit={onSubmit} className="border border-border bg-card p-5">
      <fieldset disabled={disabled} className="min-w-0">
        <div>
          <h2 className="text-xl font-semibold">Add a draft</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Save a direct HTTPS image link and its gallery details. New photos
            stay unpublished until an officer chooses Publish.
          </p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Direct image link" htmlFor="gallery-image-url">
            <Input
              id="gallery-image-url"
              name="imageUrl"
              type="url"
              inputMode="url"
              maxLength={2048}
              placeholder="https://example.com/photo.jpg"
              required
            />
          </Field>
          <Field label="Title" htmlFor="gallery-title">
            <Input id="gallery-title" name="title" required maxLength={120} />
          </Field>
          <Field label="Trip (optional)" htmlFor="gallery-trip">
            <select
              id="gallery-trip"
              name="tripId"
              className="flex h-10 w-full border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Not linked to a trip</option>
              {trips.map(trip => (
                <option key={trip.id} value={trip.id}>
                  {trip.title}
                </option>
              ))}
            </select>
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
          <Field label="Date taken (optional)" htmlFor="gallery-date">
            <Input id="gallery-date" name="takenOn" type="date" />
          </Field>
        </div>
        <Button type="submit" disabled={isBusy} className="mt-5">
          {isBusy ? 'Working…' : 'Add unpublished draft'}
        </Button>
        {message && (
          <output className="block text-sm leading-6 text-muted-foreground">
            {message}
          </output>
        )}
      </fieldset>
    </form>
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
