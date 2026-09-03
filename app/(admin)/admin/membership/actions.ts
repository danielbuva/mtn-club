'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const uuidSchema = z.string().uuid()

export async function confirmGuardianConsentAction(formData: FormData) {
  const reviewer = await requireAdminCapability('membership.confirm_guardian')
  const applicantId = uuidSchema.parse(
    String(formData.get('applicantId') ?? ''),
  )
  const admin = createAdminClient()
  const { error } = await admin.rpc('confirm_membership_guardian_consent', {
    p_user_id: applicantId,
    p_reviewer_id: reviewer.userId,
  })
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/admin/membership')
  revalidatePath('/membership')
}

export async function reviewZellePaymentAction(formData: FormData) {
  const reviewer = await requireAdminCapability('membership.confirm_payment')
  const paymentId = uuidSchema.parse(String(formData.get('paymentId') ?? ''))
  const decision = z
    .enum(['confirmed', 'rejected'])
    .parse(String(formData.get('decision') ?? ''))
  const note = String(formData.get('note') ?? '').trim()
  const admin = createAdminClient()
  const { error } = await admin.rpc('review_zelle_membership_payment', {
    p_payment_id: paymentId,
    p_reviewer_id: reviewer.userId,
    p_decision: decision,
    p_note: note || null,
  })
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/admin/membership')
  revalidatePath('/admin/accounts')
  revalidatePath('/membership')
}

export async function setZellePaymentStatusAction(formData: FormData) {
  const reviewer = await requireAdminCapability('membership.confirm_payment')
  const applicantId = uuidSchema.parse(
    String(formData.get('applicantId') ?? ''),
  )
  const desiredStatus = z
    .enum(['pending', 'accepted', 'rejected'])
    .parse(String(formData.get('paymentStatus') ?? ''))
  const note = z
    .string()
    .trim()
    .max(1000)
    .parse(String(formData.get('note') ?? ''))
  const databaseStatus =
    desiredStatus === 'pending'
      ? 'claimed'
      : desiredStatus === 'accepted'
        ? 'confirmed'
        : 'rejected'
  const admin = createAdminClient()
  const { error } = await admin.rpc('set_zelle_membership_payment_status', {
    p_user_id: applicantId,
    p_reviewer_id: reviewer.userId,
    p_desired_status: databaseStatus,
    p_note: note || null,
  })
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/admin/membership')
  revalidatePath('/admin/accounts')
  revalidatePath('/membership')
}

export async function reverseZellePaymentAction(formData: FormData) {
  const reviewer = await requireAdminCapability('membership.confirm_payment')
  if (!reviewer.isSuperAdmin) throw new Error('Super admin access required.')
  const paymentId = uuidSchema.parse(String(formData.get('paymentId') ?? ''))
  const reason = z
    .string()
    .trim()
    .min(3)
    .max(1000)
    .parse(String(formData.get('reason') ?? ''))
  const admin = createAdminClient()
  const { error } = await admin.rpc('reverse_zelle_membership_payment', {
    p_payment_id: paymentId,
    p_reviewer_id: reviewer.userId,
    p_reason: reason,
  })
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/admin/membership')
  revalidatePath('/admin/accounts')
  revalidatePath('/membership')
}

export async function confirmMembershipApplicationAction(formData: FormData) {
  const reviewer = await requireAdminCapability('membership.confirm_payment')
  const applicantId = uuidSchema.parse(
    String(formData.get('applicantId') ?? ''),
  )
  const admin = createAdminClient()
  const paymentResult = await admin
    .from('membership_zelle_payments')
    .select('id')
    .eq('user_id', applicantId)
    .eq('status', 'claimed')
    .order('claimed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (paymentResult.error || !paymentResult.data) {
    throw paymentResult.error ?? new Error('No Zelle payment claim is ready.')
  }
  const { error } = await admin.rpc('review_zelle_membership_payment', {
    p_payment_id: paymentResult.data.id,
    p_reviewer_id: reviewer.userId,
    p_decision: 'confirmed',
    p_note: null,
  })
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/admin/membership')
  revalidatePath('/membership')
}
