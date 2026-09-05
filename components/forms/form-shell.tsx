'use client'

import { type ComponentProps, type ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function FormShell({
  children,
  className,
  ...props
}: ComponentProps<'form'>) {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return (
    <form
      noValidate
      inert={!ready}
      data-ready={ready}
      data-guided-form
      className={cn(
        'mx-auto flex w-full max-w-2xl flex-col gap-8 text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </form>
  )
}

export function FormStep({
  title,
  description,
  optional,
  children,
}: {
  title: string
  description?: string
  optional?: boolean
  children: ReactNode
}) {
  return (
    <section className="space-y-7">
      <header className="space-y-3">
        {optional && (
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Optional
          </p>
        )}
        <h2
          data-step-heading
          tabIndex={-1}
          className="font-brand text-3xl leading-tight outline-none md:text-4xl"
        >
          {title}
        </h2>
        {description && (
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  )
}

export function FormProgress({
  index,
  count,
}: {
  index: number
  count: number
}) {
  if (count <= 3) return null
  return (
    <div className="space-y-2">
      <progress
        aria-label="Form progress"
        aria-valuetext={`${Math.round((index / Math.max(1, count - 1)) * 100)}% through the current questions. Remaining questions depend on your answers.`}
        className="form-progress block h-1 w-full"
        value={index}
        max={Math.max(1, count - 1)}
      />
      <span className="sr-only">
        The remaining questions depend on your answers.
      </span>
    </div>
  )
}

export function FormMessage({
  children,
  error = false,
}: {
  children?: ReactNode
  error?: boolean
}) {
  return (
    <div
      className={children ? undefined : 'sr-only'}
      aria-live={error ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {children && (
        <p
          role={error ? 'alert' : 'status'}
          className={cn(
            'border-l-2 border-primary p-4 text-sm leading-relaxed',
            error && 'border-destructive text-destructive',
          )}
        >
          {children}
        </p>
      )}
    </div>
  )
}
