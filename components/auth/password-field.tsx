'use client'

import { Check, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { authInputClass } from '@/components/auth/form-ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PASSWORD_GUIDANCE, PASSWORD_MIN_LENGTH } from '@/lib/auth/password'
import { cn } from '@/lib/utils'

type PasswordFieldProps = React.ComponentProps<typeof Input> & {
  label: string
  error?: string
  showRequirements?: boolean
}

export function PasswordField({
  label,
  error,
  showRequirements = false,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const id = props.id ?? 'password'
  const meetsLength =
    typeof props.value === 'string' &&
    Array.from(props.value).length >= PASSWORD_MIN_LENGTH
  const description = [
    showRequirements && `${id}-requirements`,
    error && `${id}-error`,
    capsLock && `${id}-caps`,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          {...props}
          id={id}
          name={props.name ?? id}
          type={visible ? 'text' : 'password'}
          required
          autoCapitalize="none"
          spellCheck={false}
          autoComplete={props.autoComplete ?? 'new-password'}
          className={cn(authInputClass, 'pr-14', props.className)}
          aria-invalid={Boolean(error)}
          aria-describedby={description || undefined}
          onKeyUp={event => setCapsLock(event.getModifierState('CapsLock'))}
          onBlur={event => {
            setCapsLock(false)
            props.onBlur?.(event)
          }}
        />
        <button
          type="button"
          disabled={props.disabled}
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible(current => !current)}
          className="absolute right-0 top-0 flex size-12 items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? (
            <EyeOff className="size-5" aria-hidden="true" />
          ) : (
            <Eye className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>
      {showRequirements && (
        <div
          id={`${id}-requirements`}
          className="text-sm leading-5 text-muted-foreground"
        >
          <p className="flex items-center gap-2" aria-live="polite">
            <Check
              aria-hidden="true"
              className={cn(
                'size-4 shrink-0',
                meetsLength ? 'text-foreground' : 'opacity-30',
              )}
            />
            {meetsLength
              ? 'Length requirement met'
              : `At least ${PASSWORD_MIN_LENGTH} characters`}
          </p>
          <p className="mt-1">
            {PASSWORD_GUIDANCE.split('. ').slice(1).join('. ')}
          </p>
        </div>
      )}
      {capsLock && (
        <p
          id={`${id}-caps`}
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          Caps Lock is on.
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          aria-live="polite"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}
