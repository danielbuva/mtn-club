'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import { participantNoticeEmail } from './email'
import { sendGuardianEmail, siteOrigin } from './send'
import { rpcMessage } from './server'

const decisionSchema = z.enum(['approved', 'rejected', 'clarification'])

export async function reviewGuardianAction(
  requestId: string,
  decision: string,
  reason: string,
  identityChecked: boolean,
): Promise<{ ok: boolean; message: string }> {
  await requireAdminCapability('membership.confirm_guardian')
  const kind = decisionSchema.parse(decision)
  const db = await createClient()
  const { data, error } = await db.rpc('review_guardian_request', {
    p_request: z.uuid().parse(requestId),
    p_decision: kind,
    p_reason: reason.trim() || null,
    p_identity_checked: identityChecked,
  })
  if (error)
    return {
      ok: false,
      message: rpcMessage(
        error,
        'The decision wasn’t saved. Refresh and try again.',
      ),
    }
  const participantEmail = z
    .object({ participantEmail: z.string().nullable() })
    .parse(data).participantEmail
  const origin = siteOrigin()
  if (participantEmail && origin)
    await sendGuardianEmail(
      participantEmail,
      participantNoticeEmail({ siteUrl: origin, kind }),
    )
  revalidatePath('/admin/membership/trip-guardian-reviews')
  revalidatePath('/admin/membership')
  return {
    ok: true,
    message:
      kind === 'approved'
        ? 'Approved. The participant was notified.'
        : kind === 'rejected'
          ? 'Rejected. The participant was notified with your reason.'
          : 'Sent. The request stays here until it’s resolved.',
  }
}

export async function acknowledgeWithdrawalAction(
  withdrawalId: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdminCapability('membership.confirm_guardian')
  const db = await createClient()
  const { error } = await db.rpc('acknowledge_guardian_withdrawal', {
    p_withdrawal: z.uuid().parse(withdrawalId),
  })
  revalidatePath('/admin/membership/trip-guardian-reviews')
  return error
    ? { ok: false, message: 'Couldn’t mark it handled. Try again.' }
    : { ok: true, message: 'Marked handled.' }
}
