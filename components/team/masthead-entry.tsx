import type { ReactNode } from 'react'

/** Ignore preview/status tags when generating a person's initials. */
export function memberInitials(name: string): string {
  return name
    .replace(/^(?:\s*\[[^\]]*\])+\s*/, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => Array.from(part)[0])
    .join('')
    .toUpperCase()
}

export function MastheadEntry({
  name,
  role,
  children,
}: {
  name: string
  role: string | null
  children?: ReactNode
}) {
  return (
    <div className="min-w-0 space-y-5 border-b border-border py-7 md:px-6">
      <div
        aria-hidden="true"
        className="flex size-12 items-center justify-center border border-border font-brand text-xl font-bold"
      >
        {memberInitials(name)}
      </div>
      <div className="space-y-2">
        <p className="font-brand text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {role ?? 'Club leadership'}
        </p>
        <h2 className="break-words font-brand text-3xl font-bold leading-tight">
          {name}
        </h2>
      </div>
      {children}
    </div>
  )
}
