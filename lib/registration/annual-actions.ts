'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { annualFieldsSchema } from './annual-schema'
import { registrationInputSchema } from './schema'

function refresh() {
  revalidatePath('/profile/events/liability-waiver')
  revalidatePath('/profile/trips')
  revalidatePath('/trips', 'layout')
  revalidatePath('/admin/registration')
}
export async function signAnnualAction(
  waiverId: string,
  requestId: string,
  input: unknown,
) {
  const data = registrationInputSchema.shape.data.parse(input)
  const db = await createClient()
  const { error } = await db.rpc('sign_annual_waiver', {
    p_waiver: z.uuid().parse(waiverId),
    p_request: z.uuid().parse(requestId),
    p_data: data,
  })
  if (!error) refresh()
  return {
    ok: !error,
    message:
      error?.code === 'P0001'
        ? error.message
        : error
          ? 'Unable to save your signature. Retry with your details still here.'
          : 'Annual waiver signed.',
  }
}
export async function withdrawAnnualAction(signatureId: string) {
  const db = await createClient()
  const { error } = await db.rpc('withdraw_annual_waiver', {
    p_signature: z.uuid().parse(signatureId),
  })
  if (!error) refresh()
  return {
    ok: !error,
    message: error
      ? 'Unable to withdraw this waiver. Refresh and try again.'
      : 'Waiver withdrawn for future trips. Your signed record is preserved.',
  }
}
export async function createAnnualAction(input: unknown) {
  const parsed = annualFieldsSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? 'Complete the designated fields.',
    }
  const db = await createClient()
  const { error } = await db.rpc('create_annual_waiver', {
    p_fields: parsed.data,
  })
  if (!error) refresh()
  return {
    ok: !error,
    message:
      error?.message ??
      'Draft saved. Review the exact document before publishing.',
  }
}
export async function publishAnnualAction(
  waiverId: string,
  reviewReference: string,
) {
  const db = await createClient()
  const { error } = await db.rpc('publish_annual_waiver', {
    p_waiver: z.uuid().parse(waiverId),
    p_review_reference: z
      .string()
      .trim()
      .min(5)
      .max(2000)
      .parse(reviewReference),
  })
  if (!error) refresh()
  return {
    ok: !error,
    message:
      error?.message ??
      'Annual waiver published. Participants must sign this version for covered trips.',
  }
}
export async function saveInformedRisksAction(
  tripId: string,
  revision: number,
  statements: string[],
  activities: string[],
) {
  const db = await createClient()
  const { error } = await db.rpc('save_trip_informed_risks', {
    p_trip: z.uuid().parse(tripId),
    p_revision: z.number().int().min(0).parse(revision),
    p_statements: z.array(z.string().max(1000)).min(1).max(5).parse(statements),
    p_activities: z
      .array(z.string().min(1).max(80))
      .min(1)
      .max(12)
      .parse(activities),
  })
  if (!error) refresh()
  return {
    ok: !error,
    message:
      error?.message ??
      'Informed risks saved. Participants must acknowledge the current revision.',
  }
}
export async function requestAnnualGuardianAction(waiverId: string) {
  const db = await createClient()
  const { error } = await db.rpc('request_annual_guardian_review', {
    p_waiver: z.uuid().parse(waiverId),
  })
  if (!error) revalidatePath('/admin/membership/trip-guardian-reviews')
  return {
    ok: !error,
    message:
      error?.message ??
      'Review requested. Give an officer the guardian-completed copy of the displayed annual waiver.',
  }
}
export async function verifyAnnualGuardianAction(
  waiverId: string,
  userId: string,
  data: unknown,
) {
  const parsed = registrationInputSchema.shape.data.parse(data)
  const db = await createClient()
  const { error } = await db.rpc('verify_annual_guardian', {
    p_waiver: z.uuid().parse(waiverId),
    p_user: z.uuid().parse(userId),
    p_data: parsed,
  })
  if (!error) {
    refresh()
    revalidatePath('/admin/membership/trip-guardian-reviews')
  }
  return {
    ok: !error,
    message: error?.message ?? 'Guardian annual waiver verified.',
  }
}
