import 'server-only'
import { z } from 'zod'
import { deliverRegistrationEmail } from '@/lib/registration/delivery'
import { notificationSchema, registrationEmail } from '@/lib/registration/email'
import { createAdminClient } from '@/lib/supabase/admin'

const jobsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    leaseToken: z.string().uuid(),
    attempts: z.number(),
  }),
)
export async function processRegistrationNotifications() {
  const db = createAdminClient()
  const maintenance = await db.rpc('registration_maintenance')
  if (maintenance.error) throw new Error('maintenance_failed')
  const apiKey = process.env.REGISTRATION_RESEND_API_KEY
  const from = process.env.REGISTRATION_EMAIL_FROM
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (
    process.env.REGISTRATION_EMAIL_ENABLED !== 'true' ||
    !apiKey ||
    !from ||
    !siteUrl
  ) {
    await db.rpc('registration_worker_result', {
      p_error: 'email_not_configured',
    })
    return { processed: 0, emailConfigured: false }
  }
  const claimed = await db.rpc('claim_registration_notifications', {
    p_limit: 5,
  })
  if (claimed.error) throw new Error('claim_failed')
  const jobs = jobsSchema.parse(claimed.data)
  for (const job of jobs) {
    const prepared = await db.rpc('prepare_registration_notification', {
      p_id: job.id,
      p_lease: job.leaseToken,
    })
    if (prepared.error) throw new Error('prepare_failed')
    if (!prepared.data) continue
    const notification = notificationSchema.parse(prepared.data)
    const { providerId, errorCode, retry } = await deliverRegistrationEmail({
      jobId: job.id,
      apiKey,
      from,
      to: notification.email,
      message: registrationEmail(notification, siteUrl),
    })
    const finished = await db.rpc('finish_registration_notification', {
      p_id: job.id,
      p_lease: job.leaseToken,
      p_provider_id: providerId ?? '',
      p_error: errorCode ?? '',
      p_retry: retry,
    })
    if (finished.error) throw new Error('finish_failed')
  }
  const health = await db.rpc('registration_worker_result')
  if (health.error) throw new Error('health_failed')
  return { processed: jobs.length, emailConfigured: true }
}
