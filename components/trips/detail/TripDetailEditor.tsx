'use client'

import { CalendarDays, Clock3, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { saveTripDetailEditsAction } from '@/app/(reader)/trips/actions'
import {
  type TripAssignmentOption,
  TripAssignmentsEditor,
} from '@/components/trips/detail/trip-assignments-editor'
import { TripCTA } from '@/components/trips/TripCTA'
import { TripStatusBadge } from '@/components/trips/TripStatusBadge'
import { TripLifecycleControls } from '@/components/trips/trip-lifecycle-controls'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useIsMobile } from '@/hooks/use-mobile'
import { sanitizeReturnTo } from '@/lib/auth/return-to'
import { formatTripDate } from '@/lib/trips/format'
import type { TripDetail, TripDifficulty } from '@/lib/trips/types'

type TripDetailEditorProps = {
  canManageLifecycle?: boolean
  trip: TripDetail
  returnTo?: string
  availableActivityTags: string[]
  publicHostOptions?: TripAssignmentOption[]
  leaderOptions?: TripAssignmentOption[]
  initialPublicHostIds?: string[]
  initialLeaderIds?: string[]
}

type TripDraft = {
  title: string
  activityTags: string[]
  difficulty: TripDifficulty
  summary: string
  locationName: string
  locationNotes: string
  startAt: string
  endAt: string
  overviewWhat: string
  overviewWhere: string
  overviewWeather: string
  overviewEquipment: string
  overviewCarpoolNeedGear: string
}

const difficultyOptions: TripDifficulty[] = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
]

const difficultyLabel: Record<TripDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
}

const difficultyClass: Record<TripDifficulty, string> = {
  beginner: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  intermediate: 'border-blue-500/30 bg-blue-500/10 text-blue-700',
  advanced: 'border-orange-500/30 bg-orange-500/10 text-orange-700',
  expert: 'border-red-500/30 bg-red-500/10 text-red-700',
}

const toDatetimeLocal = (date: Date | undefined) => {
  if (!date) {
    return ''
  }
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

const getPrimaryTagLabel = (activityTags: string[]) => {
  if (!activityTags.length) {
    return 'OUTDOOR'
  }
  return activityTags[0].toUpperCase()
}

const parseDateInput = (value: string) => {
  if (!value) {
    return undefined
  }
  const asDate = new Date(value)
  if (Number.isNaN(asDate.getTime())) {
    return undefined
  }
  return asDate
}

export function TripDetailEditor({
  returnTo,
  canManageLifecycle = false,
  trip,
  availableActivityTags,
  publicHostOptions = [],
  leaderOptions = [],
  initialPublicHostIds = [],
  initialLeaderIds = [],
}: TripDetailEditorProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [isPending, startTransition] = useTransition()
  const [newTag, setNewTag] = useState('')
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [publicHostIds, setPublicHostIds] = useState(initialPublicHostIds)
  const [leaderIds, setLeaderIds] = useState(initialLeaderIds)

  const [draft, setDraft] = useState<TripDraft>({
    title: trip.title,
    activityTags: trip.activityTags,
    difficulty: trip.difficulty ?? 'beginner',
    summary: trip.summary ?? '',
    locationName: trip.locationName,
    locationNotes: trip.locationNotes ?? '',
    startAt: toDatetimeLocal(trip.startAt),
    endAt: toDatetimeLocal(trip.endAt),
    overviewWhat: trip.overviewWhat ?? '',
    overviewWhere: trip.overviewWhere ?? '',
    overviewWeather: trip.overviewWeather ?? '',
    overviewEquipment: trip.overviewEquipment ?? '',
    overviewCarpoolNeedGear: trip.overviewCarpoolNeedGear ?? '',
  })

  const tagOptions = useMemo(() => {
    const merged = new Set<string>([
      ...availableActivityTags.map(tag => tag.toLowerCase()),
      ...draft.activityTags.map(tag => tag.toLowerCase()),
    ])
    return Array.from(merged).sort((a, b) => a.localeCompare(b))
  }, [availableActivityTags, draft.activityTags])

  const toggleTag = (tag: string) => {
    setDraft(current => {
      const exists = current.activityTags.includes(tag)
      if (exists) {
        return {
          ...current,
          activityTags: current.activityTags.filter(item => item !== tag),
        }
      }
      return {
        ...current,
        activityTags: [...current.activityTags, tag],
      }
    })
  }

  const addCustomTag = () => {
    const cleaned = newTag.trim().toLowerCase()
    if (!cleaned) {
      return
    }

    setDraft(current => {
      if (current.activityTags.includes(cleaned)) {
        return current
      }
      return {
        ...current,
        activityTags: [...current.activityTags, cleaned],
      }
    })
    setNewTag('')
  }

  const onSave = () => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('tripId', trip.id)
        formData.set('title', draft.title)
        formData.set('activityTags', JSON.stringify(draft.activityTags))
        formData.set('difficulty', draft.difficulty)
        formData.set('summary', draft.summary)
        formData.set('locationName', draft.locationName)
        formData.set('locationNotes', draft.locationNotes)
        formData.set('startAt', draft.startAt)
        formData.set('endAt', draft.endAt)
        formData.set('overviewWhat', draft.overviewWhat)
        formData.set('overviewWhere', draft.overviewWhere)
        formData.set('overviewWeather', draft.overviewWeather)
        formData.set('overviewEquipment', draft.overviewEquipment)
        formData.set('overviewCarpoolNeedGear', draft.overviewCarpoolNeedGear)
        if (publicHostOptions.length || leaderOptions.length) {
          formData.set('publicHostIds', JSON.stringify(publicHostIds))
          formData.set('leaderIds', JSON.stringify(leaderIds))
        }

        await saveTripDetailEditsAction(formData)
        toast.success('Trip changes saved')
        router.push(`/trips/${trip.id}`)
      } catch {
        toast.error('Could not save trip changes')
      }
    })
  }

  const startAt = parseDateInput(draft.startAt) ?? trip.startAt
  const endAt = parseDateInput(draft.endAt)

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 pb-32 md:space-y-5 md:pb-8">
      <Link
        className="inline-block rounded border px-4 py-3 text-sm font-medium underline"
        href={`/trips/${trip.id}/informed-risks`}
      >
        Edit informed risks & activity scope
      </Link>
      {publicHostOptions.length || leaderOptions.length ? (
        <TripAssignmentsEditor
          publicHosts={publicHostOptions}
          leaders={leaderOptions}
          selectedPublicHostIds={publicHostIds}
          selectedLeaderIds={leaderIds}
          onPublicHostsChange={setPublicHostIds}
          onLeadersChange={setLeaderIds}
        />
      ) : null}
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        {trip.heroImageUrl ? (
          <div className="relative aspect-[16/9] bg-muted">
            <Image
              src={trip.heroImageUrl}
              alt={trip.title}
              fill
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            <div className="absolute left-4 top-4 z-10 space-y-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="border border-white/25 bg-black/50 text-white hover:bg-black/60"
                onClick={() => setTagPickerOpen(current => !current)}
              >
                {getPrimaryTagLabel(draft.activityTags)}
              </Button>
              {tagPickerOpen ? (
                <div className="w-64 space-y-2 rounded-xl border border-white/20 bg-black/70 p-3 text-white backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-white/70">
                    Activity tags
                  </p>
                  <div className="flex max-h-36 flex-wrap gap-1 overflow-y-auto">
                    {tagOptions.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`rounded-md border px-2 py-1 text-xs ${
                          draft.activityTags.includes(tag)
                            ? 'border-white/60 bg-white/20 text-white'
                            : 'border-white/30 bg-transparent text-white/85'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={event => setNewTag(event.target.value)}
                      placeholder="Add tag"
                      className="h-8 border-white/30 bg-black/20 text-xs text-white placeholder:text-white/60"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 border-white/30 bg-black/20 text-white"
                      onClick={addCustomTag}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="absolute left-4 right-4 top-16 z-10 flex flex-wrap items-center gap-2 sm:left-auto sm:top-4 sm:justify-end">
              <Button
                asChild
                type="button"
                size="sm"
                variant="secondary"
                className="border border-white/25 bg-black/50 text-white hover:bg-black/60"
              >
                <Link
                  href={
                    sanitizeReturnTo(returnTo ?? null) ?? `/trips/${trip.id}`
                  }
                >
                  Cancel
                </Link>
              </Button>
              <select
                value={draft.difficulty}
                onChange={event =>
                  setDraft(current => ({
                    ...current,
                    difficulty: event.target.value as TripDifficulty,
                  }))
                }
                className={`h-8 rounded-md border px-2 text-xs ${difficultyClass[draft.difficulty]}`}
              >
                {difficultyOptions.map(option => (
                  <option key={option} value={option}>
                    {difficultyLabel[option]}
                  </option>
                ))}
              </select>
              {trip.status !== 'open' ? (
                <TripStatusBadge status={trip.status} />
              ) : null}
            </div>

            <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
              <Input
                value={draft.title}
                onChange={event =>
                  setDraft(current => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="h-11 border-white/25 bg-black/50 text-xl font-semibold text-white placeholder:text-white/70 md:h-14 md:text-3xl"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setTagPickerOpen(current => !current)}
                >
                  {getPrimaryTagLabel(draft.activityTags)}
                </Button>
                <select
                  value={draft.difficulty}
                  onChange={event =>
                    setDraft(current => ({
                      ...current,
                      difficulty: event.target.value as TripDifficulty,
                    }))
                  }
                  className={`h-8 rounded-md border px-2 text-xs ${difficultyClass[draft.difficulty]}`}
                >
                  {difficultyOptions.map(option => (
                    <option key={option} value={option}>
                      {difficultyLabel[option]}
                    </option>
                  ))}
                </select>
                {trip.status !== 'open' ? (
                  <TripStatusBadge status={trip.status} />
                ) : null}
              </div>

              <Button asChild type="button" size="sm" variant="outline">
                <Link
                  href={
                    sanitizeReturnTo(returnTo ?? null) ?? `/trips/${trip.id}`
                  }
                >
                  Cancel
                </Link>
              </Button>
            </div>

            {tagPickerOpen ? (
              <div className="space-y-2 rounded-xl border border-border/70 bg-muted/50 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Activity tags
                </p>
                <div className="flex flex-wrap gap-1">
                  {tagOptions.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-md border px-2 py-1 text-xs ${
                        draft.activityTags.includes(tag)
                          ? 'border-primary/50 bg-primary/10 text-foreground'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={event => setNewTag(event.target.value)}
                    placeholder="Add tag"
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={addCustomTag}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ) : null}

            <Input
              value={draft.title}
              onChange={event =>
                setDraft(current => ({ ...current, title: event.target.value }))
              }
              className="h-12 text-2xl font-semibold"
            />
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-card p-4 md:grid-cols-3 md:p-5">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Location
          </p>
          <Input
            value={draft.locationName}
            onChange={event =>
              setDraft(current => ({
                ...current,
                locationName: event.target.value,
              }))
            }
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Date
          </p>
          <p className="text-sm font-medium">
            {formatTripDate(startAt, endAt)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            Start
          </p>
          <Input
            type="datetime-local"
            value={draft.startAt}
            onChange={event =>
              setDraft(current => ({ ...current, startAt: event.target.value }))
            }
            className="h-8 text-sm"
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-4">
          <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 md:p-5">
            <h2 className="text-lg font-semibold">Overview</h2>
            <Textarea
              value={draft.summary}
              onChange={event =>
                setDraft(current => ({
                  ...current,
                  summary: event.target.value,
                }))
              }
              rows={3}
              className="text-sm"
              placeholder="Trip description"
            />

            <div className="space-y-2 text-sm">
              <p className="font-semibold">What:</p>
              <Textarea
                value={draft.overviewWhat}
                onChange={event =>
                  setDraft(current => ({
                    ...current,
                    overviewWhat: event.target.value,
                  }))
                }
                rows={4}
                placeholder="What"
              />

              <p className="font-semibold">Where:</p>
              <Textarea
                value={draft.overviewWhere}
                onChange={event =>
                  setDraft(current => ({
                    ...current,
                    overviewWhere: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Where"
              />

              <p className="font-semibold">Weather:</p>
              <Textarea
                value={draft.overviewWeather}
                onChange={event =>
                  setDraft(current => ({
                    ...current,
                    overviewWeather: event.target.value,
                  }))
                }
                rows={2}
                placeholder="Weather"
              />

              <p className="font-semibold">Equipment:</p>
              <Textarea
                value={draft.overviewEquipment}
                onChange={event =>
                  setDraft(current => ({
                    ...current,
                    overviewEquipment: event.target.value,
                  }))
                }
                rows={5}
                placeholder="- water\n- snacks"
              />

              <p className="font-semibold">Carpool/Need Gear:</p>
              <Textarea
                value={draft.overviewCarpoolNeedGear}
                onChange={event =>
                  setDraft(current => ({
                    ...current,
                    overviewCarpoolNeedGear: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Carpool and gear notes"
              />
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 md:p-5">
            <h2 className="text-lg font-semibold">Logistics</h2>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Meetup details
            </p>
            <Textarea
              value={draft.locationNotes}
              onChange={event =>
                setDraft(current => ({
                  ...current,
                  locationNotes: event.target.value,
                }))
              }
              rows={3}
              placeholder="Meetup point and parking details"
            />
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              End time (optional)
            </p>
            <Input
              type="datetime-local"
              value={draft.endAt}
              onChange={event =>
                setDraft(current => ({ ...current, endAt: event.target.value }))
              }
              className="h-9"
            />
          </section>

          {canManageLifecycle && (
            <section className="space-y-3 border border-border p-4">
              <h2 className="font-semibold">Trip status</h2>
              <TripLifecycleControls
                tripId={trip.id}
                title={trip.title}
                lifecycle={trip.lifecycleStatus ?? 'published'}
                reason={trip.cancellationReason}
                deletedHref={
                  returnTo?.startsWith('/admin/trips')
                    ? '/admin/trips'
                    : '/trips'
                }
              />
            </section>
          )}
          <Card className="border-border/70">
            <CardContent className="p-4 text-sm text-muted-foreground md:p-5">
              Comments & Q&A coming soon.
            </CardContent>
          </Card>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 p-3 backdrop-blur md:sticky md:top-20 md:rounded-2xl md:border md:p-4">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:max-w-none">
            <TripStatusBadge status={trip.status} />

            {isMobile ? (
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={onSave}
                  disabled={isPending}
                  className="min-w-[180px]"
                >
                  {isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            ) : (
              <>
                <TripCTA trip={trip} />

                <Button
                  type="button"
                  onClick={onSave}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? 'Saving…' : 'Save'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
