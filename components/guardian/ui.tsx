import { AlertCircle } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import type { GuardianTone } from '@/lib/guardian/presentation'
import { cn } from '@/lib/utils'

// Shapes shared by every guardian surface: square, hairline, ink on paper.

const toneClass: Record<GuardianTone, string> = {
  ready: 'border-[#211d18] bg-[var(--editorial-highlight)] text-[#211d18]',
  action:
    'border-foreground bg-foreground text-background dark:border-2 dark:bg-transparent dark:text-foreground',
  waiting: 'border-dashed border-foreground/70 text-foreground',
  review: 'border-foreground/70 text-foreground',
  inactive: 'border-border text-muted-foreground',
  stopped:
    'border-[#b00000] text-[#b00000] dark:border-[#ff8a80] dark:text-[#ff8a80]',
}

/** Status in words. Tone is a second signal, never the only one. */
export function GuardianTag({
  label,
  tone,
  className,
}: {
  label: string
  tone: GuardianTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 shrink-0 items-center border px-2 font-brand text-[12px] font-bold uppercase tracking-[0.08em] whitespace-nowrap',
        toneClass[tone],
        className,
      )}
    >
      {label}
    </span>
  )
}

export function Eyebrow({
  children,
  className,
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <p
      id={id}
      className={cn(
        'font-brand text-[13px] font-bold uppercase tracking-[0.15em] text-muted-foreground',
        className,
      )}
    >
      {children}
    </p>
  )
}

const buttonBase =
  'inline-flex min-h-12 items-center justify-center gap-2 px-5 font-brand text-base font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0'

export function InkButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        buttonBase,
        'bg-foreground text-background hover:bg-foreground/85',
        className,
      )}
    />
  )
}

export function LineButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        buttonBase,
        'border border-foreground bg-transparent text-foreground hover:bg-foreground/5',
        className,
      )}
    />
  )
}

export function TextButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex min-h-11 items-center text-base underline underline-offset-4 hover:text-foreground/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50',
        className,
      )}
    />
  )
}

/** Error text stays ink; the red icon carries the signal. */
export function FieldError({
  id,
  children,
}: {
  id: string
  children?: ReactNode
}) {
  if (!children) return null
  return (
    <p
      id={id}
      className="flex items-start gap-2 text-sm leading-5 text-foreground"
    >
      <AlertCircle
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-[#d40000] dark:text-[#ff8a80]"
      />
      <span>{children}</span>
    </p>
  )
}

/** Form-level message: error (red icon) or calm confirmation. */
export function Notice({
  tone,
  children,
  id,
}: {
  tone: 'error' | 'info'
  children?: ReactNode
  id?: string
}) {
  return (
    <div id={id} aria-live="polite" className="min-h-0">
      {children ? (
        <p
          role={tone === 'error' ? 'alert' : 'status'}
          className={cn(
            'flex items-start gap-2 border-l-2 py-1 pl-3 text-base leading-6 text-foreground',
            tone === 'error'
              ? 'border-[#d40000] dark:border-[#ff8a80]'
              : 'border-foreground',
          )}
        >
          {tone === 'error' && (
            <AlertCircle
              aria-hidden="true"
              className="mt-1 size-4 shrink-0 text-[#d40000] dark:text-[#ff8a80]"
            />
          )}
          <span>{children}</span>
        </p>
      ) : null}
    </div>
  )
}

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  className,
  ...props
}: ComponentProps<'input'> & {
  id: string
  label: string
  hint?: string
  error?: string
  optional?: boolean
}) {
  const describedBy =
    [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground"> (optional)</span>
        )}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
        className={cn(
          'block min-h-12 w-full border bg-transparent px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground',
          error
            ? 'border-[#d40000] dark:border-[#ff8a80]'
            : 'border-foreground/35',
          className,
        )}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

export function CheckRow({
  id,
  checked,
  onChange,
  children,
  error,
  disabled,
}: {
  id: string
  checked: boolean
  onChange: (value: boolean) => void
  children: ReactNode
  error?: string
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="flex min-h-12 cursor-pointer items-start gap-3 py-2"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={event => onChange(event.target.checked)}
          className="mt-0.5 size-6 shrink-0 accent-[var(--editorial-ink)]"
        />
        <span className="text-base leading-6">{children}</span>
      </label>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

/** One labeled fact in a hairline list. */
export function FactRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 border-t border-border py-3 first:border-t-0 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <dt className="font-brand text-[13px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 text-base leading-6 [overflow-wrap:anywhere]">
        {children}
      </dd>
    </div>
  )
}
