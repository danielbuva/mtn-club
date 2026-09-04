'use client'

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const authInputClass =
  'h-12 min-w-0 border-foreground/25 bg-background text-base shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-base'
export const authButtonClass = 'min-h-12 w-full text-base font-semibold'
export const authLinkClass =
  'inline-flex min-h-11 items-center font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function FormMessage({
  children,
  success = false,
  id,
}: {
  children: React.ReactNode
  success?: boolean
  id?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!success && children) ref.current?.focus()
  }, [children, success])
  return (
    <div
      id={id}
      ref={ref}
      tabIndex={-1}
      role={success ? 'status' : 'alert'}
      className={cn(
        'flex gap-3 border p-3 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring',
        success
          ? 'border-foreground/20 bg-secondary/40'
          : 'border-destructive/50 bg-destructive/5',
      )}
    >
      {success ? (
        <CheckCircle2 className="mt-1 size-4 shrink-0" aria-hidden="true" />
      ) : (
        <AlertCircle className="mt-1 size-4 shrink-0" aria-hidden="true" />
      )}
      <div>{children}</div>
    </div>
  )
}

export function EmailField({
  error,
  ...props
}: React.ComponentProps<typeof Input> & { error?: string }) {
  const id = props.id ?? 'email'
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Email address</Label>
      <Input
        {...props}
        id={id}
        name={props.name ?? 'email'}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        className={cn(authInputClass, props.className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        placeholder="you@example.com"
      />
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
