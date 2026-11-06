import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import {
  GuardianPanelSkeleton,
  GuardianTripPanel,
} from '@/components/guardian/guardian-trip-panel'
import { RegistrationSkeleton } from '@/components/registration/page-shell'
import { RegistrationForm } from '@/components/registration/registration-form'
import { completeProfileHref, needsProfileName } from '@/lib/auth/profile-name'
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
  if (await needsProfileName(db, user))
    redirect(completeProfileHref(`/trips/${tripId}/rsvp`))
  const snapshot = await getRegistration(tripId)
  return (
    <div className="space-y-10">
      {snapshot.ageAdult === false &&
      snapshot.annualWaiver &&
      snapshot.waiverRequired ? (
        <Suspense fallback={<GuardianPanelSkeleton />}>
          <GuardianTripPanel tripId={tripId} />
        </Suspense>
      ) : null}
      <RegistrationForm key={snapshot.tripId} snapshot={snapshot} />
    </div>
  )
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
