'use client'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import {
  deleteAnnouncement,
  saveAnnouncement,
} from '@/app/(admin)/admin/announcements/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { schedulesOverlap } from '@/lib/announcements/schedule'
import type { AnnouncementActionState } from '@/lib/announcements/schema'
import {
  ANNOUNCEMENT_TIME_ZONE,
  type Announcement,
} from '@/lib/announcements/types'
import { eventDateTimeToIso, eventLocalDateTime } from '@/lib/events/date-time'
import { AnnouncementPreview } from './announcement-preview'

export function AnnouncementEditor({
  announcement,
  published,
  canManage,
  now,
  authorName,
}: {
  announcement?: Announcement
  published: Announcement[]
  canManage: boolean
  now: string
  authorName: string
}) {
  const [values, setValues] = useState({
    title: announcement?.title ?? '',
    slug: announcement?.slug ?? '',
    subtitle: announcement?.subtitle ?? '',
    description: announcement?.description ?? '',
    content: announcement?.content ?? '',
    status: announcement?.status ?? 'draft',
    starts_at: eventLocalDateTime(
      announcement?.starts_at ?? now,
      ANNOUNCEMENT_TIME_ZONE,
    ),
    ends_at: eventLocalDateTime(
      announcement?.ends_at ??
        new Date(Date.parse(now) + 86400000 * 7).toISOString(),
      ANNOUNCEMENT_TIME_ZONE,
    ),
  })
  const [state, action, pending] = useActionState(
    saveAnnouncement,
    {} as AnnouncementActionState,
  )
  const [deleteState, remove, deleting] = useActionState(
    deleteAnnouncement,
    {} as AnnouncementActionState,
  )
  const starts = eventDateTimeToIso(values.starts_at, ANNOUNCEMENT_TIME_ZONE)
  const ends = eventDateTimeToIso(values.ends_at, ANNOUNCEMENT_TIME_ZONE)
  const overlaps =
    values.status === 'published' && starts && ends
      ? published.filter(
          item =>
            item.id !== announcement?.id &&
            schedulesOverlap(
              { status: values.status, starts_at: starts, ends_at: ends },
              item,
            ),
        )
      : []
  const update = (key: keyof typeof values, value: string) =>
    setValues(current => ({ ...current, [key]: value }))
  return (
    <div className="space-y-8">
      <Link
        href="/admin/announcements"
        className="font-brand underline underline-offset-4"
      >
        ← All announcements
      </Link>
      <form action={action} className="space-y-6">
        <input type="hidden" name="id" value={announcement?.id ?? ''} />
        <fieldset disabled={!canManage || pending} className="space-y-6">
          <legend className="mb-4 font-brand text-2xl uppercase">
            Homepage notice
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            {(['title', 'slug'] as const).map(key => (
              <label htmlFor={key} key={key} className="space-y-2 text-sm">
                <span className="capitalize">
                  {key === 'slug' ? 'URL slug' : key}
                </span>
                <Input
                  required
                  id={key}
                  name={key}
                  maxLength={key === 'title' ? 80 : 100}
                  value={values[key]}
                  onChange={event => update(key, event.target.value)}
                />
              </label>
            ))}
          </div>
          <label htmlFor="subtitle" className="block space-y-2 text-sm">
            <span>Subtitle · date, time, or location (optional)</span>
            <Textarea
              id="subtitle"
              name="subtitle"
              maxLength={120}
              rows={2}
              value={values.subtitle}
              onChange={event => update('subtitle', event.target.value)}
            />
          </label>
          <label htmlFor="description" className="block space-y-2 text-sm">
            <span>Short description (optional, up to 180 characters)</span>
            <Textarea
              id="description"
              name="description"
              maxLength={180}
              rows={2}
              value={values.description}
              onChange={event => update('description', event.target.value)}
            />
          </label>
          <label htmlFor="content" className="block space-y-2 text-sm">
            <span>Full announcement</span>
            <Textarea
              id="content"
              name="content"
              maxLength={30000}
              rows={12}
              value={values.content}
              onChange={event => update('content', event.target.value)}
            />
            <span className="block text-muted-foreground">
              Separate paragraphs with blank lines. Use ## Heading, - list
              items, and [link text](https://…). HTML displays as plain text.
            </span>
          </label>
          <div className="border-t border-border pt-6">
            <h2 className="font-brand text-2xl uppercase">
              Publication & schedule
            </h2>
            <p className="my-3 text-sm text-muted-foreground">
              All times: America/Los_Angeles (Pacific time). Repeated fall-back
              times use the first occurrence. Published notices become public
              when their appearance time arrives.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              {(['starts_at', 'ends_at'] as const).map(key => (
                <label htmlFor={key} key={key} className="space-y-2 text-sm">
                  <span>{key === 'starts_at' ? 'Appears' : 'Disappears'}</span>
                  <Input
                    type="datetime-local"
                    required
                    id={key}
                    name={key}
                    value={values[key]}
                    onChange={event => update(key, event.target.value)}
                  />
                </label>
              ))}
            </div>
            <label className="mt-5 block space-y-2 text-sm">
              <span>Publication status</span>
              <select
                name="status"
                value={values.status}
                onChange={event => update('status', event.target.value)}
                className="block min-h-11 w-full border border-input bg-background px-3"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
          {overlaps.length > 0 && (
            <output className="border border-foreground/25 bg-secondary p-4 text-sm">
              This announcement overlaps another published announcement:{' '}
              {overlaps.map(item => item.title).join(', ')}. Only one
              announcement can appear on the homepage at a time. The latest
              appearance time wins; ties use creation time, then ID.
            </output>
          )}
          {canManage && (
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save announcement'}
            </Button>
          )}
        </fieldset>
        {state.error && (
          <p role="alert" className="text-destructive">
            {state.error}
          </p>
        )}
        {state.saved && <output>Announcement saved.</output>}
      </form>
      <AnnouncementPreview
        announcement={{
          ...values,
          author_name: announcement?.author_name ?? authorName,
        }}
      />
      {announcement && canManage && (
        <form action={remove} className="space-y-4 border-t border-border pt-6">
          <input type="hidden" name="id" value={announcement.id} />
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="confirmed" value="yes" required />
            Permanently delete this announcement and its public page
          </label>
          <Button variant="destructive" disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete announcement'}
          </Button>
          {deleteState.error && <p role="alert">{deleteState.error}</p>}
        </form>
      )}
    </div>
  )
}
