import 'server-only'

import { createHmac } from 'node:crypto'
import { z } from 'zod'
import { deliverRegistrationEmail } from '@/lib/registration/delivery'
import { createAdminClient } from '@/lib/supabase/admin'
import { guardianSignedEmail, participantNoticeEmail } from './email'
import { waiverDate } from './presentation'
import { sha256 } from './secrets'
import { siteOrigin } from './send'

const jobsSchema = z.array(z.object({ id: z.uuid(), leaseId: z.uuid() }))
const noticeSchema = z.object({
  kind: z.enum([
    'receipt',
    'signed_review',
    'signed_accepted',
    'approved',
    'rejected',
    'clarification',
  ]),
  to: z.email(),
  participantName: z.string(),
  guardianName: z.string().nullable(),
  membership: z.boolean(),
  waiver: z.boolean(),
  validUntil: z.string().nullable(),
  waiverUntil: z.string().nullable(),
  autoApproved: z.boolean(),
})

export async function processGuardianNotifications(workerSecret: string) {
  const apiKey = process.env.REGISTRATION_RESEND_API_KEY
  const from = process.env.REGISTRATION_EMAIL_FROM
  const origin = siteOrigin()
  if (!apiKey || !from || !origin) return 0

  const db = createAdminClient()
  const claimed = await db.rpc('claim_guardian_notifications')
  if (claimed.error) throw new Error('guardian_claim_failed')
  const jobs = jobsSchema.parse(claimed.data)
  await Promise.all(
    jobs.map(async job => {
      // Stable across retries. Only the digest is stored in the database.
      const token = createHmac('sha256', workerSecret)
        .update(`guardian-record:${job.id}`)
        .digest('base64url')
      const prepared = await db.rpc('prepare_guardian_notification', {
        p_id: job.id,
        p_lease: job.leaseId,
        p_record_hash: sha256(token),
      })
      if (prepared.error) throw new Error('guardian_prepare_failed')
      const notice =
        prepared.data === null ? null : noticeSchema.parse(prepared.data)
      const result = notice
        ? await deliverRegistrationEmail({
            jobId: `guardian/${job.id}`,
            apiKey,
            from,
            to: notice.to,
            message:
              notice.kind === 'receipt'
                ? guardianSignedEmail({
                    siteUrl: origin,
                    recordLink: `${origin}/guardian/${token}`,
                    participantName: notice.participantName,
                    guardianName: notice.guardianName ?? 'Guardian',
                    membership: notice.membership,
                    waiver: notice.waiver,
                    validUntil: notice.validUntil
                      ? waiverDate(notice.validUntil)
                      : null,
                    approved: notice.autoApproved,
                  })
                : participantNoticeEmail({
                    siteUrl: origin,
                    kind: notice.kind,
                  }),
          })
        : {
            providerId: null,
            errorCode: 'recipient_or_token_unavailable',
            retry: false,
          }
      const finished = await db.rpc('finish_guardian_notification', {
        p_id: job.id,
        p_lease: job.leaseId,
        p_provider_id: result.providerId ?? '',
        p_error: result.errorCode ?? '',
        p_retry: result.retry,
      })
      if (finished.error) throw new Error('guardian_finish_failed')
    }),
  )
  return jobs.length
}
