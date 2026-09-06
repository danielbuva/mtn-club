'use client'

import { useState } from 'react'
import { ChoiceCards } from '@/components/forms/choice-cards'
import { TextField } from '@/components/forms/fields'
import { Button } from '@/components/ui/button'
import {
  isDifficultyTag,
  normalizeActivityTags,
} from '@/lib/events/activity-tags'

export function ActivityChoices({
  options,
  selected,
  onChange,
  onAdd,
  onRemove,
}: {
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
  onAdd?: (tag: string) => Promise<void>
  onRemove?: (tags: string[]) => Promise<void>
}) {
  const [tag, setTag] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const all = normalizeActivityTags([...options, ...selected]).sort()
  async function manage(remove = false) {
    if (pending) return
    setPending(true)
    setMessage('')
    try {
      if (remove) {
        await onRemove?.(selected)
        onChange([])
      } else {
        const cleaned = tag.trim().toLowerCase()
        if (!cleaned) return
        if (isDifficultyTag(cleaned)) {
          setMessage(
            'Choose beginner friendliness in the Difficulty field under Trip details.',
          )
          return
        }
        await onAdd?.(cleaned)
        onChange(Array.from(new Set([...selected, cleaned])))
        setTag('')
      }
    } catch {
      setMessage('Activity options could not be updated. Please retry.')
    } finally {
      setPending(false)
    }
  }
  return (
    <div className="space-y-4">
      <ChoiceCards
        label="Activities"
        multiple
        columns
        options={all.map(value => ({ value, label: value }))}
        value={selected}
        onChange={onChange}
        disabled={pending}
      />
      {onAdd && (
        <details>
          <summary className="cursor-pointer py-3 text-sm underline">
            Manage activity options
          </summary>
          <div className="space-y-3 py-3">
            <TextField
              label="New activity"
              value={tag}
              onChange={event => setTag(event.target.value)}
              onKeyDown={async event => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  await manage()
                }
              }}
            />
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={pending || !tag.trim()}
                onClick={() => manage()}
              >
                Add activity
              </Button>
              {onRemove && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || !selected.length}
                  onClick={() => manage(true)}
                >
                  Remove selected options
                </Button>
              )}
            </div>
          </div>
        </details>
      )}
      <output className="text-sm" aria-live="polite">
        {message}
      </output>
    </div>
  )
}
