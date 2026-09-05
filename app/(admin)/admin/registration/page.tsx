import Link from 'next/link'
import { Suspense } from 'react'
import { z } from 'zod'
import { AnnualConfiguration } from '@/components/registration/annual-configuration'
import { RegistrationSwitch } from '@/components/registration/operations-switch'
import {
  RegistrationShell,
  RegistrationSkeleton,
} from '@/components/registration/page-shell'
import { annualDocumentSchema } from '@/lib/registration/annual-schema'
import { createClient } from '@/lib/supabase/server'

const operationsSchema = z.object({
  enabled: z.boolean(),
  pending: z.number(),
  oldestPending: z.string().nullable(),
  health: z.object({
    last_run_at: z.string().nullable(),
    last_success_at: z.string().nullable(),
    last_error: z.string().nullable(),
  }),
  failures: z.array(
    z.object({
      id: z.string(),
      trip_id: z.string(),
      kind: z.string(),
      status: z.string(),
      error_code: z.string().nullable(),
      updated_at: z.string(),
    }),
  ),
})
async function Operations() {
  const db = await createClient()
  const [{ data, error }, annual] = await Promise.all([
    db.rpc('registration_operations'),
    db.rpc('get_annual_waiver_configuration'),
  ])
  if (error) throw new Error('Registration operations are unavailable.')
  const status = operationsSchema.parse(data)
  return (
    <div className="space-y-6">
      <RegistrationSwitch enabled={status.enabled} />
      {!annual.error && (
        <AnnualConfiguration
          documents={z
            .array(
              annualDocumentSchema.extend({
                publishedAt: z.string().nullable(),
              }),
            )
            .parse(annual.data)}
        />
      )}
      <section className="space-y-2">
        <h2 className="font-semibold">Notification worker</h2>
        <p>Last run: {status.health.last_run_at ?? 'Never'}</p>
        <p>Last successful run: {status.health.last_success_at ?? 'Never'}</p>
        <p>
          Pending messages: {status.pending} · Oldest:{' '}
          {status.oldestPending ?? 'None'}
        </p>
        {status.health.last_error ? (
          <p role="alert">Worker needs attention: {status.health.last_error}</p>
        ) : null}
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">Delivery failures</h2>
        {status.failures.length ? (
          status.failures.map(failure => (
            <p key={failure.id}>
              <Link
                className="underline"
                href={`/admin/trips/${failure.trip_id}/registrations`}
              >
                Trip roster
              </Link>
              : {failure.kind} — {failure.status} (
              {failure.error_code ?? 'See provider delivery history'})
            </p>
          ))
        ) : (
          <p>No failed deliveries.</p>
        )}
      </section>
    </div>
  )
}
export default function RegistrationOperationsPage() {
  return (
    <RegistrationShell title="Registration operations">
      <Suspense fallback={<RegistrationSkeleton />}>
        <Operations />
      </Suspense>
    </RegistrationShell>
  )
}
