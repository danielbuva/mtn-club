import { z } from 'zod'
import { sessionHash, tokenHash } from '@/lib/guardian/server'
import { createAdminClient } from '@/lib/supabase/admin'

const copySchema = z.object({
  signedAt: z.string(),
  participantName: z.string(),
  membership: z
    .object({
      body: z.string(),
      version: z.number(),
      signatureName: z.string(),
      signedAt: z.string(),
      evidence: z
        .object({ verifiedEmail: z.string().optional() })
        .passthrough(),
    })
    .nullable(),
  waiver: z
    .object({
      title: z.string(),
      version: z.number(),
      body: z.string(),
      signatureName: z.string(),
      signedAt: z.string(),
      validFrom: z.string(),
      validUntil: z.string(),
      activities: z.array(z.string()),
      details: z
        .object({
          verifiedEmail: z.string().optional(),
          relationship: z.string().optional(),
          initials: z.array(z.string()).optional(),
          participant: z
            .object({
              birthDate: z.string().optional(),
              address: z.string().optional(),
            })
            .passthrough()
            .optional(),
          emergencyContact: z
            .object({
              name: z.string().optional(),
              relationship: z.string().optional(),
              phone: z.string().optional(),
              address: z.string().optional(),
              notes: z.string().optional(),
            })
            .passthrough()
            .optional(),
        })
        .passthrough(),
    })
    .nullable(),
})

const pacific = (iso: string) =>
  `${new Date(iso).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} Pacific`

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const hash = tokenHash(token)
  const session = await sessionHash()
  if (!hash || !session)
    return new Response('Confirm your email on the signing page first.', {
      status: 401,
    })
  const { data, error } = await createAdminClient().rpc(
    'guardian_signed_copy',
    {
      p_token_hash: hash,
      p_session_hash: session,
    },
  )
  if (error || !data)
    return new Response('Confirm your email on the signing page first.', {
      status: 401,
    })
  const copy = copySchema.parse(data)
  const sections: string[] = [
    'UNLV MOUNTAIN CLUB — SIGNED GUARDIAN RECORD',
    `Participant: ${copy.participantName}`,
    `Completed: ${pacific(copy.signedAt)}`,
  ]
  if (copy.membership)
    sections.push(
      '',
      '────────────────────────────────────────',
      copy.membership.body,
      '',
      `Signed: ${copy.membership.signatureName}`,
      `Signed at: ${pacific(copy.membership.signedAt)}`,
      `Email confirmed by one-time code: ${copy.membership.evidence.verifiedEmail ?? ''}`,
    )
  if (copy.waiver) {
    const d = copy.waiver.details
    sections.push(
      '',
      '────────────────────────────────────────',
      `${copy.waiver.title} (version ${copy.waiver.version})`,
      `Covers: ${copy.waiver.activities.join(', ')}`,
      `Valid: ${copy.waiver.validFrom} through ${copy.waiver.validUntil}`,
      '',
      copy.waiver.body,
      '',
      `Parent/Legal Guardian signature: ${copy.waiver.signatureName}`,
      `Relationship: ${d.relationship ?? ''}`,
      `Signed at: ${pacific(copy.waiver.signedAt)}`,
      `Initials: ${(d.initials ?? []).join(' · ')}`,
      `Participant date of birth: ${d.participant?.birthDate ?? ''}`,
      `Participant local address: ${d.participant?.address ?? ''}`,
      `Emergency contact: ${d.emergencyContact?.name ?? ''} (${d.emergencyContact?.relationship ?? ''}), ${d.emergencyContact?.phone ?? ''}`,
      `Emergency contact address: ${d.emergencyContact?.address ?? ''}`,
      `Medical services, conditions, or allergies: ${d.emergencyContact?.notes || 'None listed'}`,
      `Email confirmed by one-time code: ${d.verifiedEmail ?? ''}`,
    )
  }
  sections.push(
    '',
    'Email confirmation shows access to the inbox above. It is not a legal identity check.',
  )
  return new Response(`${sections.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition':
        'attachment; filename="mountain-club-guardian-record.txt"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  })
}
