import { ArrowRight, Lock, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  blockLinkClass,
  editActionClass,
  listClass,
  mutedText,
  noteBoxClass,
  textLinkClass,
  viewActionClass,
  viewSlotClass,
} from './styles'

export function DirectorySection({
  id,
  title,
  intro,
  footer,
  children,
}: {
  id: string
  title: string
  intro?: ReactNode
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="border-t border-[#211D18]/80 pt-5 dark:border-[#F8F1DF]/80"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2
          id={id}
          className="font-brand text-2xl font-bold uppercase leading-none tracking-wide"
        >
          {title}
        </h2>
        {footer}
      </div>
      {intro ? (
        <p className={cn('mt-2 max-w-2xl text-sm leading-6', mutedText)}>
          {intro}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function DirectoryList({ children }: { children: ReactNode }) {
  return <ul className={listClass}>{children}</ul>
}

export function DirectoryRow({
  title,
  path,
  tag,
  detail,
  actions,
  compact = false,
}: {
  title: string
  path?: string
  tag?: ReactNode
  detail: ReactNode
  actions?: ReactNode
  /** One short action: keep it beside the text on phones too. */
  compact?: boolean
}) {
  return (
    <li
      className={cn(
        'grid gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 sm:py-3.5',
        compact && 'grid-cols-[minmax(0,1fr)_auto] items-center',
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h3 className="min-w-0 break-words text-[15px] font-semibold leading-6">
            {title}
          </h3>
          {path ? (
            <span className={cn('font-mono text-[13px]', mutedText)}>
              {path}
            </span>
          ) : null}
          {tag}
        </div>
        <div className={cn('mt-0.5 text-sm leading-6', mutedText)}>
          {detail}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </li>
  )
}

export function EditAction({
  href,
  label,
  className,
}: {
  href: string
  label: string
  className?: string
}) {
  return (
    <Link href={href} className={cn(editActionClass, className)}>
      {label}
    </Link>
  )
}

export function ViewAction({ href, name }: { href: string; name: string }) {
  return (
    <Link href={href} className={cn(viewActionClass, viewSlotClass)}>
      View<span className="sr-only"> {name}</span>
    </Link>
  )
}

export function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        textLinkClass,
        'inline-flex min-h-11 items-center gap-1 text-sm sm:min-h-0',
      )}
    >
      {label}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  )
}

/** Fills the View column when a page has no public address yet. */
export function NotPublicNote() {
  return (
    <span
      className={cn(
        'inline-flex h-11 items-center text-[13px] sm:h-9 sm:justify-center',
        mutedText,
        viewSlotClass,
      )}
    >
      Not public yet
    </span>
  )
}

/** Says, without a box that could pass for a button, that a row is read-only. */
export function ReadOnlyNote({ children }: { children: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-[13px]', mutedText)}
    >
      <Lock aria-hidden="true" className="size-3.5 shrink-0" />
      {children}
    </span>
  )
}

export function EmptyNote({
  children,
  action,
}: {
  children: ReactNode
  action?: { href: string; label: string }
}) {
  return (
    <div className={noteBoxClass}>
      <p className={mutedText}>{children}</p>
      {action ? (
        <Link href={action.href} className={cn(blockLinkClass, 'mt-1')}>
          {action.label}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  )
}

/** A part of the directory failed to load; the rest of the page still works. */
export function LoadErrorNote({
  children,
  action,
}: {
  children: ReactNode
  action?: { href: string; label: string }
}) {
  return (
    <div role="alert" className={cn(noteBoxClass, 'flex items-start gap-2.5')}>
      <TriangleAlert aria-hidden="true" className="mt-1 size-4 shrink-0" />
      <div>
        <p>{children}</p>
        {action ? (
          <Link href={action.href} className={cn(blockLinkClass, 'mt-1')}>
            {action.label}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export function StatusUnavailable() {
  return (
    <span className="flex items-start gap-1.5">
      <TriangleAlert
        aria-hidden="true"
        className="mt-[5px] size-3.5 shrink-0"
      />
      Couldn’t load the current status. Editing still works.
    </span>
  )
}
