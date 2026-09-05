'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type {
  RegistrationAnswers,
  RegistrationQuestion,
} from '@/lib/registration/schema'

export function QuestionFields({
  questions,
  answers,
  onChange,
}: {
  questions: RegistrationQuestion[]
  answers: RegistrationAnswers
  onChange: (answers: RegistrationAnswers) => void
}) {
  return questions.map(question => {
    const value = answers[question.id]
    const label = `${question.label}${question.required ? ' *' : ''}`
    const update = (next: RegistrationAnswers[string]) =>
      onChange({ ...answers, [question.id]: next })
    if (question.type === 'multiple')
      return (
        <fieldset key={question.id} className="space-y-2">
          <legend className="text-sm font-medium">{label}</legend>
          {(question.options ?? []).map(option => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(option)}
                onChange={event =>
                  update(
                    event.target.checked
                      ? [...(Array.isArray(value) ? value : []), option]
                      : (Array.isArray(value) ? value : []).filter(
                          item => item !== option,
                        ),
                  )
                }
              />
              {option}
            </label>
          ))}
        </fieldset>
      )
    return (
      <div key={question.id} className="space-y-2">
        <Label htmlFor={`question-${question.id}`}>{label}</Label>
        {question.type === 'text' ? (
          <Textarea
            id={`question-${question.id}`}
            required={question.required}
            maxLength={4000}
            value={typeof value === 'string' ? value : ''}
            onChange={event => update(event.target.value)}
          />
        ) : (
          <select
            id={`question-${question.id}`}
            required={question.required}
            className="w-full rounded-md border bg-background p-2 text-sm focus-visible:outline-2"
            value={
              typeof value === 'boolean'
                ? String(value)
                : typeof value === 'string'
                  ? value
                  : ''
            }
            onChange={event =>
              update(
                question.type === 'boolean' && event.target.value !== ''
                  ? event.target.value === 'true'
                  : event.target.value,
              )
            }
          >
            <option value="">Choose an answer</option>
            {(question.type === 'boolean'
              ? ['true', 'false']
              : (question.options ?? [])
            ).map(option => (
              <option key={option} value={option}>
                {question.type === 'boolean'
                  ? option === 'true'
                    ? 'Yes'
                    : 'No'
                  : option}
              </option>
            ))}
          </select>
        )}
      </div>
    )
  })
}

export function EmergencyFields({
  value,
  onChange,
  required,
}: {
  value: { name: string; relationship: string; phone: string; notes: string }
  onChange: (value: {
    name: string
    relationship: string
    phone: string
    notes: string
  }) => void
  required: boolean
}) {
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 font-medium">
        Emergency contact{required ? ' *' : ' (optional)'}
      </legend>
      <p className="text-sm text-muted-foreground">
        Confirm these details for this trip. Authorized trip organizers can
        access this contact in an emergency.
      </p>
      {(['name', 'relationship', 'phone', 'notes'] as const).map(field => (
        <div key={field} className="space-y-1">
          <Label htmlFor={`emergency-${field}`} className="capitalize">
            {field.charAt(0).toUpperCase() + field.slice(1)}
          </Label>
          <Input
            id={`emergency-${field}`}
            type={field === 'phone' ? 'tel' : 'text'}
            required={required && field !== 'notes'}
            maxLength={field === 'notes' ? 1000 : 200}
            value={value[field]}
            onChange={event =>
              onChange({ ...value, [field]: event.target.value })
            }
          />
        </div>
      ))}
    </fieldset>
  )
}
