import Link from 'next/link'
import { Suspense } from 'react'
import { getRoster } from '@/lib/registration/server'
import { RegistrationRosterView } from './roster'

async function RosterContent({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  return <RegistrationRosterView roster={await getRoster(tripId)} />
}

function RosterSkeleton() {
  return (
    <output aria-label="Loading registrations" className="block space-y-6">
      <span className="block h-9 w-32 animate-pulse bg-muted" />
      <span className="block h-12 w-3/4 animate-pulse bg-muted" />
      <span className="grid h-[4.5rem] grid-cols-2 border-2 border-border sm:grid-cols-4" />
      <span className="block h-10 w-64 animate-pulse bg-muted" />
      <span className="block divide-y divide-border border border-border">
        {['a', 'b', 'c', 'd', 'e'].map(key => (
          <span key={key} className="flex h-14 items-center gap-3 px-4">
            <span className="size-8 animate-pulse bg-muted" />
            <span className="h-4 w-40 animate-pulse bg-muted" />
          </span>
        ))}
      </span>
    </output>
  )
}

export function RosterPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  return (
    <main className="public-page-top mx-auto max-w-3xl space-y-6 px-4 pb-28">
      <nav aria-label="Trips" className="flex flex-wrap gap-4 text-sm">
        <Link href="/trips" className="underline underline-offset-4">
          Trips
        </Link>
        <Link href="/profile/trips" className="underline underline-offset-4">
          My trips
        </Link>
      </nav>
      <Suspense fallback={<RosterSkeleton />}>
        <RosterContent params={params} />
      </Suspense>
    </main>
  )
}
