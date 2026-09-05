import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import {
  RegistrationShell,
  RegistrationSkeleton,
} from '@/components/registration/page-shell'
import { RegistrationForm } from '@/components/registration/registration-form'
import { getRegistration } from '@/lib/registration/server'
import { createClient } from '@/lib/supabase/server'

async function RegistrationContent({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user)
    redirect(
      `/auth/login?returnTo=${encodeURIComponent(`/trips/${tripId}/rsvp`)}`,
    )
  const snapshot = await getRegistration(tripId)
  return (
    <>
      <h2 className="text-2xl font-semibold">{snapshot.title}</h2>
      {snapshot.canManage ? (
        <Link className="underline" href={`/trips/${tripId}/registrations`}>
          Manage registration and roster
        </Link>
      ) : null}
      <RegistrationForm key={snapshot.tripId} snapshot={snapshot} />
    </>
  )
}
export default function RegistrationPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  return (
    <RegistrationShell title="Trip registration">
      <Suspense fallback={<RegistrationSkeleton />}>
        <RegistrationContent params={params} />
      </Suspense>
    </RegistrationShell>
  )
}
