'use client'

import { Check } from 'lucide-react'
import { type ReactNode, useId } from 'react'
import { cn } from '@/lib/utils'

export type ChoiceOption<T extends string> = {
  value: T
  label: string
  description?: string
  icon?: ReactNode
}

type ChoiceProps<T extends string> = {
  label: string
  options: readonly ChoiceOption<T>[]
  disabled?: boolean
  error?: string
  hideLabel?: boolean
  columns?: boolean
} & (
  | { multiple?: false; value: T | null; onChange: (value: T) => void }
  | { multiple: true; value: T[]; onChange: (value: T[]) => void }
)

export function ChoiceCards<T extends string>(props: ChoiceProps<T>) {
  const id = useId()
  return (
    <fieldset
      disabled={props.disabled}
      aria-describedby={props.error ? `${id}-error` : undefined}
      className="relative space-y-3"
    >
      <legend
        className={
          props.hideLabel ? 'sr-only' : 'mb-3 w-full text-sm font-medium'
        }
      >
        <span className="flex min-h-5 items-baseline justify-between gap-3">
          <span>{props.label}</span>
          {props.error && !props.hideLabel && (
            <span
              id={`${id}-error`}
              role="alert"
              className="text-right font-normal text-destructive"
            >
              {props.error}
            </span>
          )}
        </span>
      </legend>
      {props.hideLabel && props.error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="absolute -top-7 right-0 text-right text-sm text-destructive"
        >
          {props.error}
        </p>
      )}
      <div className={cn('grid gap-3', props.columns && 'sm:grid-cols-2')}>
        {props.options.map(option => {
          const checked = props.multiple
            ? props.value.includes(option.value)
            : props.value === option.value
          return (
            <label
              key={option.value}
              className={cn(
                'relative flex min-h-20 cursor-pointer items-center gap-4 border border-foreground/15 p-5 transition-colors focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-ring',
                checked
                  ? 'border-foreground bg-secondary text-foreground'
                  : 'hover:bg-secondary/40',
                props.disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <input
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                type={props.multiple ? 'checkbox' : 'radio'}
                name={id}
                value={option.value}
                checked={checked}
                aria-invalid={Boolean(props.error)}
                onChange={() => {
                  if (props.multiple)
                    props.onChange(
                      checked
                        ? props.value.filter(value => value !== option.value)
                        : [...props.value, option.value],
                    )
                  else props.onChange(option.value)
                }}
              />
              {option.icon && (
                <span aria-hidden="true" className="shrink-0">
                  {option.icon}
                </span>
              )}
              <span className="flex-1">
                <span className="block text-lg font-medium">
                  {option.label}
                </span>
                {option.description && (
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </span>
              <span
                data-choice-indicator={props.multiple ? 'multiple' : 'single'}
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center border border-current',
                  !props.multiple && 'rounded-full',
                  checked ? 'bg-foreground text-background' : 'opacity-30',
                )}
              >
                {checked && <Check className="size-4" aria-hidden="true" />}
              </span>
            </label>
          )
        })}
      </div>
      {!props.options.length && (
        <p className="text-sm text-muted-foreground">
          No choices are available yet.
        </p>
      )}
    </fieldset>
  )
}
