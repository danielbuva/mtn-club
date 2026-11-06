'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { guardianInviteEmail } from './email'
import { newSecret } from './secrets'
import { sendGuardianEmail, siteOrigin } from './send'
import { getMyGuardianStatus, rpcMessage } from './server'

export type ActionResult = { ok: boolean; message: string }

const tripIdSchema = z.uuid().nullable()

function refresh(tripId: string | null) {
  revalidatePath('/profile/events/guardian')
  revalidatePath('/profile/events/liability-waiver')
  if (tripId) {
    revalidatePath(`/trips/${tripId}`)
    revalidatePath(`/trips/${tripId}/rsvp`)
  }
}

/** Same-device handoff: returns a short-lived signing link for this device. */
export async function startSameDeviceAction(
  tripId: string | null,
): Promise<ActionResult & { href?: string }> {
  const trip = tripIdSchema.parse(tripId)
  const { secret, hash } = newSecret()
  const db = await createClient()
  const { error } = await db.rpc('guardian_open_request', {
    p_token_hash: hash,
    p_delivery: 'same_device',
    p_trip: trip ?? undefined,
  })
  if (error)
    return {
      ok: false,
      message: rpcMessage(
        error,
        'We couldn’t start signing. Refresh and try again.',
      ),
    }
  refresh(trip)
  return { ok: true, message: '', href: `/guardian/${secret}` }
}

const inviteSchema = z.object({
  name: z.string().trim().min(2, 'Enter your guardian’s full name.').max(200),
  email: z.email('Enter a valid email address.').max(320),
  relationship: z
    .string()
    .trim()
    .min(2, 'Say how they’re related to you, like Mother or Legal guardian.')
    .max(80),
})
export type InviteFieldErrors = Partial<
  Record<keyof z.infer<typeof inviteSchema>, string>
>

export async function sendInviteAction(
  input: unknown,
  tripId: string | null,
): Promise<ActionResult & { fieldErrors?: InviteFieldErrors }> {
  const trip = tripIdSchema.parse(tripId)
  const parsed = inviteSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: InviteFieldErrors = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (key === 'name' || key === 'email' || key === 'relationship')
        fieldErrors[key] ??= issue.message
    }
    return { ok: false, message: 'Check the highlighted fields.', fieldErrors }
  }
  const origin = siteOrigin()
  if (!origin)
    return {
      ok: false,
      message:
        'Email isn’t available right now. Use “My guardian is here” or contact the club.',
    }
  const { secret, hash } = newSecret()
  const db = await createClient()
  const { data, error } = await db.rpc('guardian_prepare_invite', {
    p_token_hash: hash,
    p_guardian: parsed.data,
    p_trip: trip ?? undefined,
  })
  if (error?.message === 'Nothing needs a guardian signature right now.') {
    // Nothing to sign today: just save who to ask next time.
    const saved = await db.rpc('guardian_designate', {
      p_guardian: parsed.data,
    })
    refresh(trip)
    return saved.error
      ? {
          ok: false,
          message: rpcMessage(saved.error, 'We couldn’t save your guardian.'),
        }
      : {
          ok: true,
          message:
            'Saved. Nothing needs signing right now; we’ll ask them next time.',
        }
  }
  if (error)
    return {
      ok: false,
      message: rpcMessage(error, 'We couldn’t send the invitation. Try again.'),
    }
  const prepared = z
    .object({
      email: z.string(),
      guardianName: z.string(),
      participantName: z.string(),
    })
    .parse(data)
  const status = await getMyGuardianStatus(trip)
  const { sent } = await sendGuardianEmail(
    prepared.email,
    guardianInviteEmail({
      siteUrl: origin,
      link: `${origin}/guardian/${secret}`,
      participantName: prepared.participantName,
      guardianName: prepared.guardianName,
      membership: status?.request?.needsMembership ?? false,
      waiver: status?.request?.needsWaiver ?? true,
    }),
  )
  refresh(trip)
  return sent
    ? { ok: true, message: `Sent to ${prepared.email}.` }
    : {
        ok: false,
        message:
          'We saved your guardian but couldn’t send the email. Try again in a few minutes, or use “My guardian is here”.',
      }
}

export async function cancelGuardianRequestAction(
  tripId: string | null,
): Promise<ActionResult> {
  const db = await createClient()
  const { error } = await db.rpc('guardian_cancel_request')
  refresh(tripIdSchema.parse(tripId))
  return error
    ? { ok: false, message: 'We couldn’t cancel the request. Try again.' }
    : {
        ok: true,
        message: 'Request canceled. Earlier links no longer work.',
      }
}

export async function updateGuardianPhoneAction(
  phone: string,
): Promise<ActionResult> {
  const db = await createClient()
  const { error } = await db.rpc('guardian_update_contact_phone', {
    p_phone: z.string().max(50).parse(phone),
  })
  refresh(null)
  return error
    ? {
        ok: false,
        message: rpcMessage(error, 'We couldn’t save the phone number.'),
      }
    : { ok: true, message: 'Phone number saved.' }
}
