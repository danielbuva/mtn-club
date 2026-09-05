'use client'

import { Minus, Plus } from 'lucide-react'
import { type ComponentProps, useId } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type FieldLabel = {
  label: string
  error?: string
  hint?: string
  optional?: boolean
}

function FieldHeading({
  id,
  label,
  optional,
  error,
}: Pick<FieldLabel, 'label' | 'optional' | 'error'> & { id: string }) {
  return (
    <div className="flex min-h-5 items-baseline justify-between gap-3">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground"> (optional)</span>
        )}
      </label>
      {error && (
        <span
          id={`${id}-error`}
          role="alert"
          className="text-right text-sm text-destructive"
        >
          {error}
        </span>
      )}
    </div>
  )
}

export function TextField({
  label,
  error,
  hint,
  optional,
  className,
  id: suppliedId,
  ...props
}: FieldLabel & ComponentProps<'input'>) {
  const generated = useId()
  const id = suppliedId ?? generated
  return (
    <div className="space-y-2">
      <FieldHeading id={id} label={label} optional={optional} error={error} />
      <Input
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [error ? `${id}-error` : '', hint ? `${id}-hint` : '']
            .filter(Boolean)
            .join(' ') || undefined
        }
        className={cn('min-h-12 text-base md:text-base', className)}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}
export function TextAreaField({
  label,
  error,
  hint,
  optional,
  className,
  id: suppliedId,
  ...props
}: FieldLabel & ComponentProps<'textarea'>) {
  const generated = useId()
  const id = suppliedId ?? generated
  return (
    <div className="space-y-2">
      <FieldHeading id={id} label={label} optional={optional} error={error} />
      <Textarea
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [error ? `${id}-error` : '', hint ? `${id}-hint` : '']
            .filter(Boolean)
            .join(' ') || undefined
        }
        className={cn('min-h-28 text-base md:text-base', className)}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}
export function DateTimeField(
  props: FieldLabel & Omit<ComponentProps<'input'>, 'type'>,
) {
  return <TextField {...props} type="datetime-local" />
}
export function ToggleField({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-5 border-b border-foreground/15 py-4">
      <span>
        <span className="block font-medium">{label}</span>
        {hint && (
          <span className="mt-1 block text-sm text-muted-foreground">
            {hint}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        disabled={disabled}
        className="size-6 shrink-0 accent-primary"
      />
    </label>
  )
}
export function NumberStepper({
  label,
  value,
  onChange,
  min = 1,
  max = 8,
  unit = 'seats',
  error,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  unit?: string
  error?: string
}) {
  const errorId = useId()
  return (
    <fieldset className="space-y-4">
      <legend className="mb-5 w-full text-sm font-medium">
        <span className="flex min-h-5 items-baseline justify-between gap-3">
          <span>{label}</span>
          {error && (
            <span
              id={errorId}
              role="alert"
              className="text-right font-normal text-destructive"
            >
              {error}
            </span>
          )}
        </span>
      </legend>
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          className="size-14"
          aria-label={`Fewer ${unit}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus aria-hidden="true" />
        </Button>
        <label className="text-center">
          <span className="sr-only">{label}</span>
          <input
            type="number"
            inputMode="numeric"
            aria-describedby={error ? errorId : undefined}
            min={min}
            max={max}
            value={value}
            aria-invalid={Boolean(error)}
            onChange={event =>
              onChange(
                event.target.value === '' ? 0 : event.target.valueAsNumber,
              )
            }
            className="number-stepper-input w-24 bg-transparent text-center font-brand text-5xl tabular-nums outline-offset-4"
          />
          <span className="mt-2 block text-sm text-muted-foreground">
            {unit}
          </span>
        </label>
        <Button
          type="button"
          variant="outline"
          className="size-14"
          aria-label={`More ${unit}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>
    </fieldset>
  )
}
