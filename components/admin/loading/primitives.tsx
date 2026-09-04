import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const panelClass =
  'border border-[#211D18]/15 bg-white/45 dark:border-border dark:bg-card'

export function LoadingValue({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block h-4 w-28 bg-current/10 motion-safe:animate-pulse',
        className,
      )}
    />
  )
}

export function LoadingPanel({
  title,
  children,
  className,
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn(panelClass, 'p-6', className)}>
      {title ? (
        <h2 className="font-brand text-2xl uppercase">{title}</h2>
      ) : null}
      {children}
    </section>
  )
}

export function LoadingField({
  label,
  multiline = false,
  knownValue,
}: {
  label: string
  multiline?: boolean
  knownValue?: string
}) {
  return (
    <div className="text-sm font-semibold">
      {label}
      <div
        className={cn(
          'mt-2 border border-input bg-background p-3',
          multiline ? 'h-20' : 'h-10',
        )}
      >
        {knownValue === undefined ? (
          <LoadingValue className="h-3 w-2/3" />
        ) : (
          <span className="text-sm font-normal text-muted-foreground">
            {knownValue}
          </span>
        )}
      </div>
    </div>
  )
}

export function LoadingTabs({ labels }: { labels: string[] }) {
  return (
    <div className="mt-8 grid min-w-0 grid-cols-2 gap-0 overflow-hidden border-b border-[#211D18]/15 sm:flex sm:gap-1 sm:overflow-x-auto dark:border-border">
      {labels.map(label => (
        <div
          key={label}
          className="flex min-h-12 min-w-0 items-center justify-center gap-1 px-1.5 py-2 text-center text-sm leading-tight font-medium sm:h-11 sm:min-h-0 sm:shrink-0 sm:gap-2 sm:px-4 sm:py-1"
        >
          {label}
          <LoadingValue className="h-5 w-5 shrink-0 rounded-full sm:w-6" />
        </div>
      ))}
    </div>
  )
}

export function LoadingTable({
  columns,
  className,
}: {
  columns: string[]
  className?: string
}) {
  return (
    <section className={cn(panelClass, 'overflow-x-auto', className)}>
      <table className="w-full text-left text-sm">
        <thead className="bg-[#E9DDC3]/70 text-xs uppercase tracking-wide dark:bg-secondary">
          <tr>
            {columns.map(column => (
              <th key={column} className="px-5 py-3">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#211D18]/10 dark:divide-border">
          {[0, 1, 2].map(row => (
            <tr key={row}>
              {columns.map(column => (
                <td key={column} className="px-5 py-4">
                  <LoadingValue className="w-24" />
                  <LoadingValue className="mt-2 h-3 w-16" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
