import { Mountain } from 'lucide-react'
import type { ReactNode } from 'react'
import { CLUB_EMAIL } from '@/lib/constants'

/** Standalone frame for guardians: no account, no site navigation. */
export function GuardianShell({ children }: { children: ReactNode }) {
  return (
    <div data-trip-surface className="min-h-svh bg-background text-foreground">
      <header className="border-b border-foreground/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="flex items-center gap-2 font-brand text-base font-bold uppercase tracking-[0.08em]">
            <Mountain aria-hidden="true" className="size-5" />
            UNLV Mountain Club
          </p>
          <p className="font-brand text-[13px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Guardians
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
        {children}
      </main>
      <footer className="mx-auto max-w-2xl border-t border-border px-4 py-6 text-sm leading-6 text-muted-foreground sm:px-6">
        Questions? Email{' '}
        <a
          className="text-foreground underline underline-offset-4"
          href={`mailto:${CLUB_EMAIL}`}
        >
          {CLUB_EMAIL}
        </a>
        . UNLV Mountain Club is a registered student organization at UNLV.
      </footer>
    </div>
  )
}

export function GuardianHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string
  title: string
  children?: ReactNode
}) {
  return (
    <header className="space-y-3">
      {eyebrow && (
        <p className="font-brand text-[13px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <h1
        data-step-heading
        tabIndex={-1}
        className="font-brand text-4xl font-bold uppercase leading-[0.95] tracking-wide outline-none sm:text-5xl"
      >
        {title}
      </h1>
      {children && (
        <div className="max-w-xl space-y-3 text-base leading-7">{children}</div>
      )}
    </header>
  )
}

export function GuardianShellSkeleton() {
  return (
    <output aria-label="Loading signing request" className="block space-y-8">
      <span className="block space-y-3">
        <span className="block h-4 w-40 animate-pulse bg-muted" />
        <span className="block h-11 w-4/5 animate-pulse bg-muted" />
        <span className="block h-11 w-3/5 animate-pulse bg-muted" />
        <span className="block h-5 w-full max-w-xl animate-pulse bg-muted" />
        <span className="block h-5 w-2/3 max-w-xl animate-pulse bg-muted" />
      </span>
      <span className="block border-y border-foreground/80">
        {[0, 1, 2].map(row => (
          <span
            key={row}
            className="flex gap-3 border-t border-border py-3 first:border-t-0"
          >
            <span className="block h-5 w-24 animate-pulse bg-muted" />
            <span className="block h-5 flex-1 animate-pulse bg-muted" />
          </span>
        ))}
      </span>
      <span className="block h-12 w-full animate-pulse bg-muted sm:w-56" />
    </output>
  )
}
