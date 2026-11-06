'use server'
import { cookies, headers } from 'next/headers'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  guardianCodeEmail,
  guardianSignedEmail,
  type ParticipantNotice,
  participantNoticeEmail,
} from './email'
import { waiverDate } from './presentation'
import { guardianSignInputSchema } from './schema'
import {
  codeHash,
  GUARDIAN_SESSION_COOKIE,
  newCode,
  newSecret,
  sha256,
} from './secrets'
import { sendGuardianEmail, siteOrigin } from './send'
import { getGuardianView, rpcMessage, sessionHash, tokenHash } from './server'

export type GuardianActionResult = { ok: boolean; message: string }
const expired: GuardianActionResult = {
  ok: false,
  message:
    'This link has expired or was replaced. Ask the participant to send a new one.',
}

async function notifyParticipant(
  email: string | null,
  kind: ParticipantNotice,
) {
  const origin = siteOrigin()
  if (!email || !origin) return
  await sendGuardianEmail(
    email,
    participantNoticeEmail({ siteUrl: origin, kind }),
  )
}

export async function sendGuardianCodeAction(
  token: string,
  email: string,
): Promise<GuardianActionResult & { email?: string }> {
  const hash = tokenHash(token)
  const address = z.email().max(320).safeParse(email.trim().toLowerCase())
  if (!hash) return expired
  if (!address.success)
    return { ok: false, message: 'Enter a valid email address.' }
  const origin = siteOrigin()
  if (!origin)
    return {
      ok: false,
      message:
        'Email isn’t available right now. Contact the club to sign another way.',
    }
  const code = newCode()
  const { data, error } = await createAdminClient().rpc(
    'guardian_start_verification',
    {
      p_token_hash: hash,
      p_email: address.data,
      p_code_hash: codeHash(hash, code),
    },
  )
  if (error)
    return {
      ok: false,
      message: rpcMessage(
        error,
        'We couldn’t send a code. Try again in a minute.',
      ),
    }
  const started = z
    .object({ email: z.string(), participantName: z.string() })
    .parse(data)
  const { sent } = await sendGuardianEmail(
    started.email,
    guardianCodeEmail({
      siteUrl: origin,
      code,
      participantName: started.participantName,
    }),
  )
  return sent
    ? {
        ok: true,
        message: `Code sent to ${started.email}.`,
        email: started.email,
      }
    : {
        ok: false,
        message: 'We couldn’t send the email. Check the address and try again.',
      }
}

const verifyResult = z.object({
  ok: z.boolean(),
  email: z.string().optional(),
  reason: z.enum(['missing', 'expired', 'locked', 'wrong']).optional(),
  remaining: z.number().optional(),
})

export async function verifyGuardianCodeAction(
  token: string,
  code: string,
): Promise<GuardianActionResult & { reason?: string }> {
  const hash = tokenHash(token)
  if (!hash) return expired
  const digits = code.replace(/\D/g, '')
  if (digits.length !== 6)
    return {
      ok: false,
      message: 'Enter all 6 digits from the email.',
      reason: 'wrong',
    }
  const session = newSecret()
  const { data, error } = await createAdminClient().rpc(
    'guardian_verify_code',
    {
      p_token_hash: hash,
      p_code_hash: codeHash(hash, digits),
      p_session_hash: session.hash,
    },
  )
  if (error) return { ok: false, message: rpcMessage(error, expired.message) }
  const result = verifyResult.parse(data)
  if (!result.ok)
    return {
      ok: false,
      reason: result.reason,
      message:
        result.reason === 'expired'
          ? 'That code expired. Send a new one.'
          : result.reason === 'locked'
            ? 'Too many tries. Send a new code.'
            : result.reason === 'missing'
              ? 'Send a code first.'
              : `That code doesn’t match. ${result.remaining ?? 0} ${result.remaining === 1 ? 'try' : 'tries'} left.`,
    }
  ;(await cookies()).set(GUARDIAN_SESSION_COOKIE, session.secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  })
  return { ok: true, message: 'Email confirmed.' }
}

const signResult = z.object({
  requestId: z.string().uuid(),
  duplicate: z.boolean().optional(),
  autoApproved: z.boolean().optional(),
  participantEmail: z.string().nullable().optional(),
  guardianEmail: z.string().optional(),
  guardianName: z.string().optional(),
  participantName: z.string().optional(),
  validUntil: z.string().nullable().optional(),
})

export async function signGuardianAction(
  token: string,
  input: unknown,
): Promise<
  GuardianActionResult & { approved?: boolean; validUntil?: string | null }
> {
  const hash = tokenHash(token)
  const session = await sessionHash()
  if (!hash) return expired
  if (!session)
    return { ok: false, message: 'Confirm your email again before signing.' }
  const parsed = guardianSignInputSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      message: 'Some details are missing. Check the form and try again.',
    }
  const view = await getGuardianView(token)
  if (view.state !== 'open') return expired
  const values = parsed.data
  if (
    view.waiver &&
    (!values.waiver || values.waiver.waiverId !== view.waiver.id)
  )
    return {
      ok: false,
      message:
        'The waiver changed while you were signing. Refresh to read the current version.',
    }
  const requestHeaders = await headers()
  const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const record = newSecret()
  const { data, error } = await createAdminClient().rpc('guardian_sign', {
    p_token_hash: hash,
    p_session_hash: session,
    p_record_token_hash: record.hash,
    p_data: {
      guardian: values.guardian,
      signatureName: values.signatureName,
      membershipAgreed: values.membershipAgreed,
      ...(values.waiver
        ? {
            waiverId: values.waiver.waiverId,
            waiverAgreed: values.waiver.agreed,
            participant: values.waiver.participant,
            emergencyContact: values.waiver.emergencyContact,
            initials: values.waiver.initials,
          }
        : {}),
      userAgent: requestHeaders.get('user-agent') ?? '',
      ipHash: ip ? sha256(`guardian-ip:${ip}`).slice(0, 32) : '',
    },
  })
  if (error)
    return {
      ok: false,
      message: rpcMessage(
        error,
        'We couldn’t save your signature. Your answers are still here; try again.',
      ),
    }
  const signed = signResult.parse(data)
  const origin = siteOrigin()
  if (!signed.duplicate && origin && signed.guardianEmail) {
    const first = view.participantName.split(' ')[0]
    const until =
      view.waiver && signed.validUntil
        ? `${waiverDate(signed.validUntil)}${signed.validUntil < view.waiver.until ? ` (the day before ${first} turns 18)` : ''}`
        : null
    await Promise.all([
      sendGuardianEmail(
        signed.guardianEmail,
        guardianSignedEmail({
          siteUrl: origin,
          recordLink: `${origin}/guardian/${record.secret}`,
          participantName: signed.participantName ?? view.participantName,
          guardianName: signed.guardianName ?? values.guardian.name,
          membership: Boolean(view.membership),
          waiver: Boolean(view.waiver),
          validUntil: until,
          approved: Boolean(signed.autoApproved),
        }),
      ),
      notifyParticipant(
        signed.participantEmail ?? null,
        signed.autoApproved ? 'signed_accepted' : 'signed_review',
      ),
    ])
  }
  return {
    ok: true,
    message: 'Signed.',
    approved: Boolean(signed.autoApproved),
    validUntil: signed.validUntil ?? null,
  }
}

export async function declineGuardianAction(
  token: string,
  reason: string,
): Promise<GuardianActionResult> {
  const hash = tokenHash(token)
  if (!hash) return expired
  const { data, error } = await createAdminClient().rpc('guardian_decline', {
    p_token_hash: hash,
    p_reason: z.string().max(1000).parse(reason),
  })
  if (error) return { ok: false, message: rpcMessage(error, expired.message) }
  await notifyParticipant(
    z.object({ participantEmail: z.string().nullable() }).parse(data)
      .participantEmail,
    'declined',
  )
  return { ok: true, message: 'Got it. Nothing was signed.' }
}

export async function withdrawGuardianAction(
  token: string,
  note: string,
): Promise<GuardianActionResult> {
  const hash = tokenHash(token)
  const session = await sessionHash()
  if (!hash) return expired
  if (!session) return { ok: false, message: 'Confirm your email again first.' }
  const { data, error } = await createAdminClient().rpc('guardian_withdraw', {
    p_token_hash: hash,
    p_session_hash: session,
    p_note: z.string().max(1000).parse(note),
  })
  if (error)
    return {
      ok: false,
      message: rpcMessage(error, 'We couldn’t record that. Try again.'),
    }
  const parsed = z
    .object({
      participantEmail: z.string().nullable().optional(),
      duplicate: z.boolean().optional(),
    })
    .parse(data)
  if (!parsed.duplicate)
    await notifyParticipant(parsed.participantEmail ?? null, 'withdrawn')
  return {
    ok: true,
    message: 'Withdrawn for future activities. The club has been told.',
  }
}
