import Link from 'next/link'
import { Suspense } from 'react'
import { z } from 'zod'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'
import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'
import { AnnualProfile } from '@/components/registration/annual-profile'
import { RegistrationSkeleton } from '@/components/registration/page-shell'
import { annualStateSchema } from '@/lib/registration/annual-schema'
import { createClient } from '@/lib/supabase/server'

const signaturesSchema = z.array(
  z.object({
    tripId: z.string().nullable(),
    title: z.string(),
    version: z.number(),
    body: z.string(),
    signatureName: z.string(),
    signedAt: z.string(),
    verification: z.string().optional(),
  }),
)
async function Waivers() {
  const db = await createClient()
  const [{ data, error }, annual] = await Promise.all([
    db.rpc('get_my_registration_signatures'),
    db.rpc('get_annual_waivers'),
  ])
  if (error)
    return (
      <p role="alert">
        Waiver records could not be loaded. Refresh or contact the club.
      </p>
    )
  const signatures = signaturesSchema.parse(data)
  return (
    <div className="space-y-4">
      {annual.error ? (
        <p role="alert">
          Annual waiver records could not be loaded. Refresh or contact the
          club.
        </p>
      ) : (
        <AnnualProfile state={annualStateSchema.parse(annual.data)} />
      )}
      <h2 className="font-semibold">Previous trip waivers</h2>
      {signatures.length ? (
        signatures
          .filter(signature => signature.tripId)
          .map(signature => (
            <details
              key={`${signature.tripId}-${signature.version}-${signature.signedAt}`}
              className="min-w-0 max-w-full rounded-lg border p-4 [overflow-wrap:anywhere]"
            >
              <summary className="cursor-pointer font-medium">
                {signature.title} — version {signature.version}
              </summary>
              <p className="mt-3 text-sm">
                {signature.verification ?? 'Electronic signature'} ·{' '}
                {signature.signatureName} ·{' '}
                {signature.signedAt.length === 10
                  ? signature.signedAt
                  : new Date(signature.signedAt).toLocaleString('en-US', {
                      timeZone: 'America/Los_Angeles',
                    })}{' '}
                (America/Los_Angeles)
              </p>
              <p className="my-4 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm">
                {signature.body}
              </p>
              <Link
                className="underline"
                href={`/trips/${signature.tripId}/rsvp`}
              >
                View registration
              </Link>
            </details>
          ))
      ) : (
        <p>No trip waivers have been signed in the app.</p>
      )}
      <Link className="inline-block underline" href="/profile/trips">
        My trips
      </Link>
    </div>
  )
}
export default function LiabilityWaiverPage() {
  return (
    <div className="space-y-6">
      <MobileSettingsHeader
        title="Liability waiver"
        backHref="/profile/settings"
      />
      <SettingsPageHeader
        title="Liability waiver"
        description="Your annual waiver and signed document history."
      />
      <Suspense fallback={<RegistrationSkeleton />}>
        <Waivers />
      </Suspense>
    </div>
  )
}
