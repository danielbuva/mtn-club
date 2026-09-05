'use client'

import { ChoiceCards } from '@/components/forms/choice-cards'
import { TextAreaField } from '@/components/forms/fields'
import type {
  RegistrationAnswers,
  RegistrationQuestion,
} from '@/lib/registration/schema'

export function GuidedQuestion({
  question,
  value,
  onChange,
  error,
}: {
  question: RegistrationQuestion
  value: RegistrationAnswers[string] | undefined
  onChange: (value: RegistrationAnswers[string]) => void
  error?: string
}) {
  if (question.type === 'text')
    return (
      <TextAreaField
        label={question.label}
        optional={!question.required}
        required={question.required}
        value={typeof value === 'string' ? value : ''}
        error={error}
        maxLength={4000}
        onChange={event => onChange(event.target.value)}
      />
    )
  if (question.type === 'multiple')
    return (
      <ChoiceCards
        hideLabel
        multiple
        label={question.label}
        options={(question.options ?? []).map(option => ({
          value: option,
          label: option,
        }))}
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
        error={error}
      />
    )
  const selected =
    question.type === 'boolean'
      ? typeof value === 'boolean'
        ? value
          ? 'yes'
          : 'no'
        : null
      : typeof value === 'string'
        ? value
        : null
  return (
    <div className="space-y-3">
      <ChoiceCards
        hideLabel
        label={question.label}
        options={
          question.type === 'boolean'
            ? [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]
            : (question.options ?? []).map(option => ({
                value: option,
                label: option,
              }))
        }
        value={selected}
        onChange={next =>
          onChange(question.type === 'boolean' ? next === 'yes' : next)
        }
        error={error}
      />
      {!question.required && selected && (
        <button
          type="button"
          className="text-sm text-muted-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
          onClick={() => onChange('')}
        >
          Clear answer
        </button>
      )}
    </div>
  )
}
