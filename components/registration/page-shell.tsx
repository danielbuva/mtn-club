import Link from 'next/link'
import type { ReactNode } from 'react'
import { FormSkeleton } from '@/components/forms/form-skeleton'

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
  return <FormSkeleton />
}
