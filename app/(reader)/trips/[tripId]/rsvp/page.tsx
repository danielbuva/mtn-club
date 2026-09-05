import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { RegistrationSkeleton } from '@/components/registration/page-shell'
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
  return <RegistrationForm key={snapshot.tripId} snapshot={snapshot} />
}
export default function RegistrationPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  return (
    <main
      data-guided-form
      className="mx-auto min-h-screen max-w-2xl px-5 py-8 text-foreground md:py-12"
    >
      <Suspense fallback={<RegistrationSkeleton />}>
        <RegistrationContent params={params} />
      </Suspense>
    </main>
  )
}
