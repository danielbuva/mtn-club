import Link from 'next/link'
import type { ReactNode } from 'react'

export function RegistrationShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <main className="public-page-top mx-auto max-w-3xl space-y-6 px-4 pb-28">
      <nav className="flex flex-wrap gap-4 text-sm">
        <Link href="/trips" className="underline">
          Trips
        </Link>
        <Link href="/profile/trips" className="underline">
          My trips
        </Link>
      </nav>
      <h1 className="text-3xl font-semibold">{title}</h1>
      {children}
    </main>
  )
}
export function RegistrationSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-44 animate-pulse rounded-lg border bg-muted" />
      <div className="h-72 animate-pulse rounded-lg border bg-muted" />
      <output className="sr-only">Loading registration details</output>
    </div>
  )
}
