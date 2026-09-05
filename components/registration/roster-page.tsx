import { Suspense } from 'react'
import { getRoster } from '@/lib/registration/server'
import { RegistrationShell, RegistrationSkeleton } from './page-shell'
import { RegistrationRosterView } from './roster'

async function RosterContent({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  return <RegistrationRosterView roster={await getRoster(tripId)} />
}
export function RosterPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  return (
    <RegistrationShell title="Manage trip registration">
      <Suspense fallback={<RegistrationSkeleton />}>
        <RosterContent params={params} />
      </Suspense>
    </RegistrationShell>
  )
}
