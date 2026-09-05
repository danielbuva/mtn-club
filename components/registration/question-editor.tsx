'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { RegistrationQuestion } from '@/lib/registration/schema'

export function QuestionEditor({
  questions,
  onChange,
  disabled,
}: {
  questions: RegistrationQuestion[]
  onChange: (questions: RegistrationQuestion[]) => void
  disabled: boolean
}) {
  function update(index: number, values: Partial<RegistrationQuestion>) {
    onChange(
      questions.map((question, at) =>
        at === index ? { ...question, ...values } : question,
      ),
    )
  }
  return (
    <fieldset disabled={disabled} className="space-y-4">
      <legend className="font-semibold">Registration questions</legend>
      {questions.map((question, index) => (
        <div key={question.id} className="space-y-2 rounded border p-3">
          <Label htmlFor={`label-${question.id}`}>Question {index + 1}</Label>
          <Input
            id={`label-${question.id}`}
            required
            maxLength={300}
            value={question.label}
            onChange={event => update(index, { label: event.target.value })}
          />
          <Label htmlFor={`type-${question.id}`}>Answer type</Label>
          <select
            id={`type-${question.id}`}
            className="w-full rounded border bg-background p-2"
            value={question.type}
            onChange={event => {
              const type = event.target.value
              if (
                type === 'text' ||
                type === 'single' ||
                type === 'multiple' ||
                type === 'boolean'
              )
                update(index, { type })
            }}
          >
            <option value="text">Text</option>
            <option value="single">Single choice</option>
            <option value="multiple">Multiple choices</option>
            <option value="boolean">Yes / no</option>
          </select>
          {question.type === 'single' || question.type === 'multiple' ? (
            <>
              <Label htmlFor={`options-${question.id}`}>
                Choices (one per line)
              </Label>
              <Textarea
                id={`options-${question.id}`}
                value={(question.options ?? []).join('\n')}
                onChange={event =>
                  update(index, { options: event.target.value.split('\n') })
                }
              />
            </>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={question.required}
              onChange={event =>
                update(index, { required: event.target.checked })
              }
            />
            Required
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(questions.filter((_, at) => at !== index))}
          >
            Remove question {index + 1}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={disabled || questions.length >= 20}
        onClick={() =>
          onChange([
            ...questions,
            {
              id: `q_${crypto.randomUUID().replaceAll('-', '')}`,
              label: '',
              type: 'text',
              required: false,
            },
          ])
        }
      >
        Add question
      </Button>
    </fieldset>
  )
}
