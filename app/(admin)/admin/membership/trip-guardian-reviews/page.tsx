import { Suspense } from 'react'
import { z } from 'zod'
import { GuardianReview } from '@/components/registration/guardian-review'
import {
  RegistrationShell,
  RegistrationSkeleton,
} from '@/components/registration/page-shell'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'

const requestsSchema = z.array(
  z.object({
    tripId: z.string().uuid(),
    title: z.string(),
    userId: z.string().uuid(),
    name: z.string(),
    revision: z.number(),
    waiverTitle: z.string().nullable(),
    waiverVersion: z.number().nullable(),
    waiverBody: z.string().nullable(),
  }),
)
async function Requests() {
  await requireAdminCapability('membership.confirm_guardian')
  const db = await createClient()
  const { data, error } = await db.rpc('get_trip_guardian_requests')
  if (error)
    throw new Error(
      'Guardian requests could not be loaded. Refresh or contact an administrator.',
    )
  const requests = requestsSchema.parse(data)
  return requests.length ? (
    <div className="space-y-4">
      {requests.map(request => (
        <GuardianReview
          key={`${request.tripId}-${request.userId}-${request.revision}`}
          request={request}
        />
      ))}
    </div>
  ) : (
    <p>No trip guardian reviews are waiting.</p>
  )
}
export default function TripGuardianReviewsPage() {
  return (
    <RegistrationShell title="Trip guardian consent">
      <Suspense fallback={<RegistrationSkeleton />}>
        <Requests />
      </Suspense>
    </RegistrationShell>
  )
}
