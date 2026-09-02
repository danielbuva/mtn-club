import { Check, Gauge, Tags, Type } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EVENT_DIFFICULTIES } from '@/lib/events/constants'
import type { EventFormValues } from '@/lib/events/schema'

interface EventBasicsSectionProps {
  values: EventFormValues
  fieldErrors: Record<string, string>
  activityOptions: string[]
  canManageTags: boolean
  newActivityTag: string
  canChooseOfficial: boolean
  onOfficialChange: (value: boolean) => void
  onFieldChange: <K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) => void
  onToggleActivity: (activity: string) => void
  onSetActivityTypes: (activityTypes: string[]) => void
  onNewActivityTagChange: (value: string) => void
  onAddActivityTag: () => void
  onRemoveActivityTags: (tagsToRemove: string[]) => void
}

type DifficultyValue = NonNullable<EventFormValues['difficulty']>

const difficultyClassMap: Record<DifficultyValue, string> = {
  Easy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  Moderate: 'border-blue-500/30 bg-blue-500/10 text-blue-700',
  Challenging: 'border-orange-500/30 bg-orange-500/10 text-orange-700',
  Expert: 'border-red-500/30 bg-red-500/10 text-red-700',
}

export function EventBasicsSection({
  values,
  fieldErrors,
  activityOptions,
  canManageTags,
  newActivityTag,
  canChooseOfficial,
  onOfficialChange,
  onFieldChange,
  onToggleActivity,
  onSetActivityTypes,
  onNewActivityTagChange,
  onAddActivityTag,
  onRemoveActivityTags,
}: EventBasicsSectionProps) {
  const [isAddTagOpen, setIsAddTagOpen] = useState(false)
  const [isRemoveTagOpen, setIsRemoveTagOpen] = useState(false)
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([])
  const addTagInputRef = useRef<HTMLInputElement | null>(null)
  const selectedTags = (values.activityTypes ?? []).map(tag =>
    tag.trim().toLowerCase(),
  )
  const tagOptions = Array.from(
    new Set([
      ...activityOptions.map(tag => tag.trim().toLowerCase()),
      ...selectedTags,
    ]),
  ).sort((a, b) => a.localeCompare(b))

  const toggleTagToRemove = (tag: string) => {
    setTagsToRemove(current =>
      current.includes(tag)
        ? current.filter(item => item !== tag)
        : [...current, tag],
    )
  }

  const removeSelectedTags = () => {
    if (!tagsToRemove.length) {
      return
    }
    const remaining = selectedTags.filter(tag => !tagsToRemove.includes(tag))
    onSetActivityTypes(remaining)
    onRemoveActivityTags(tagsToRemove)
    setTagsToRemove([])
    setIsRemoveTagOpen(false)
  }

  useEffect(() => {
    if (isAddTagOpen) {
      addTagInputRef.current?.focus()
    }
  }, [isAddTagOpen])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {canChooseOfficial ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                values.isOfficial
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground'
              }`}
              onClick={() => onOfficialChange(true)}
            >
              Official Trip
            </button>
            <button
              type="button"
              className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                !values.isOfficial
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground'
              }`}
              onClick={() => onOfficialChange(false)}
            >
              Community Meetup
            </button>
          </div>
        ) : null}
        <Button
          asChild
          type="button"
          variant="outline"
          className="ml-auto rounded-xl"
        >
          <Link href="/trips/drafts">Drafts</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title" className="inline-flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5 text-muted-foreground" />
            Title
          </Label>
          <Input
            id="title"
            value={values.title}
            onChange={e => onFieldChange('title', e.target.value)}
          />
          {fieldErrors.title && (
            <p className="text-xs text-red-500">{fieldErrors.title}</p>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label className="inline-flex items-center gap-1.5">
          <Tags className="h-3.5 w-3.5 text-muted-foreground" />
          Activity tags
        </Label>
        <div className="flex flex-wrap gap-1">
          {tagOptions.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                if (isRemoveTagOpen) {
                  toggleTagToRemove(tag)
                  return
                }
                onToggleActivity(tag)
              }}
              className={`rounded-md border px-2 py-1 text-xs ${
                isRemoveTagOpen
                  ? tagsToRemove.includes(tag)
                    ? 'border-destructive/50 bg-destructive/10 text-destructive'
                    : 'border-border text-muted-foreground'
                  : selectedTags.includes(tag)
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground'
              }`}
            >
              {tag}
            </button>
          ))}

          {canManageTags && isAddTagOpen ? (
            <Input
              ref={addTagInputRef}
              value={newActivityTag}
              onChange={event => onNewActivityTagChange(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  onAddActivityTag()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  onNewActivityTagChange('')
                  setIsAddTagOpen(false)
                }
              }}
              placeholder="new tag"
              className="h-7 w-28 rounded-md px-2 py-1 text-xs"
            />
          ) : null}

          {canManageTags && isAddTagOpen ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 rounded-md px-2 py-1 text-xs"
              onClick={onAddActivityTag}
              aria-label="Confirm add tag"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          ) : null}

          {canManageTags ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={`h-7 rounded-md px-2 py-1 text-xs ${
                  isAddTagOpen
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : ''
                }`}
                onClick={() => {
                  if (isAddTagOpen) {
                    onNewActivityTagChange('')
                    setIsAddTagOpen(false)
                    return
                  }
                  setTagsToRemove([])
                  setIsRemoveTagOpen(false)
                  setIsAddTagOpen(true)
                }}
              >
                + add tag
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                className={`h-7 rounded-md px-2 py-1 text-xs ${
                  isRemoveTagOpen
                    ? 'border-destructive/50 bg-destructive/10 text-destructive'
                    : ''
                }`}
                onClick={() => {
                  if (isRemoveTagOpen) {
                    removeSelectedTags()
                    return
                  }
                  onNewActivityTagChange('')
                  setIsAddTagOpen(false)
                  setTagsToRemove([])
                  setIsRemoveTagOpen(true)
                }}
              >
                {isRemoveTagOpen ? 'remove' : '- remove tags'}
              </Button>

              {isRemoveTagOpen ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-md px-2 py-1 text-xs"
                  onClick={() => {
                    setTagsToRemove([])
                    setIsRemoveTagOpen(false)
                  }}
                >
                  close
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        <Label className="inline-flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
          Difficulty
        </Label>
        <div className="flex flex-wrap gap-2">
          {EVENT_DIFFICULTIES.map(difficulty => (
            <button
              key={difficulty}
              type="button"
              onClick={() =>
                onFieldChange(
                  'difficulty',
                  values.difficulty === difficulty
                    ? undefined
                    : (difficulty as EventFormValues['difficulty']),
                )
              }
              className={`rounded-md border px-2 py-1 text-xs ${
                difficultyClassMap[difficulty as DifficultyValue]
              } ${
                values.difficulty === difficulty ? '' : 'opacity-45 saturate-50'
              }`}
            >
              {difficulty}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
