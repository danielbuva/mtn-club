'use server'

import { revalidatePath } from 'next/cache'
import { getViewer } from '@/lib/auth/viewer'
import { isLeaderRole } from '@/lib/memberships/types'
import { createStripeClient } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function requireOfficer() {
  const viewer = await getViewer()
  if (!viewer.userId || !isLeaderRole(viewer.member?.role)) {
    throw new Error('Officer access required.')
  }
  return viewer.userId
}

const readApplicantId = (formData: FormData) => {
  const applicantId = String(formData.get('applicantId') ?? '')
  if (!uuidPattern.test(applicantId)) {
    throw new Error('Invalid membership applicant.')
  }
  return applicantId
}

export async function confirmGuardianConsentAction(formData: FormData) {
  const reviewerId = await requireOfficer()
  const applicantId = readApplicantId(formData)
  const admin = createAdminClient()
  const { error } = await admin.rpc('confirm_membership_guardian_consent', {
    p_user_id: applicantId,
    p_reviewer_id: reviewerId,
  })
  if (error) throw error
  revalidatePath('/admin/membership')
  revalidatePath('/membership')
}

export async function confirmMembershipApplicationAction(formData: FormData) {
  const reviewerId = await requireOfficer()
  const applicantId = readApplicantId(formData)
  const admin = createAdminClient()
  const { error } = await admin.rpc('confirm_zelle_membership_application', {
    p_user_id: applicantId,
    p_reviewer_id: reviewerId,
  })
  if (error) throw error
  revalidatePath('/admin/membership')
  revalidatePath('/membership')
  revalidatePath('/trips')
  revalidatePath('/calendar')
}

export async function resolveMembershipReviewAction(formData: FormData) {
  const reviewerId = await requireOfficer()
  const reviewId = String(formData.get('reviewId') ?? '')
  const resolution = String(formData.get('resolution') ?? '')
  if (!uuidPattern.test(reviewId)) throw new Error('Invalid review item.')
  if (!['approve', 'refund', 'dismiss'].includes(resolution)) {
    throw new Error('Invalid review resolution.')
  }

  const admin = createAdminClient()

  if (resolution === 'approve') {
    const { error } = await admin.rpc('approve_membership_review_item', {
      p_review_id: reviewId,
      p_reviewer_id: reviewerId,
    })
    if (error) throw error
  }

  if (resolution === 'dismiss') {
    const { error } = await admin
      .from('membership_review_items')
      .update({
        status: 'dismissed',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('status', 'pending')
    if (error) throw error
  }

  if (resolution === 'refund') {
    const reviewResult = await admin
      .from('membership_review_items')
      .select('payment_id')
      .eq('id', reviewId)
      .eq('status', 'pending')
      .maybeSingle()
    if (reviewResult.error || !reviewResult.data?.payment_id) {
      throw reviewResult.error ?? new Error('Reviewable payment not found.')
    }

    const paymentResult = await admin
      .from('membership_payments')
      .select('stripe_payment_intent_id')
      .eq('id', reviewResult.data.payment_id)
      .maybeSingle()
    if (paymentResult.error || !paymentResult.data?.stripe_payment_intent_id) {
      throw paymentResult.error ?? new Error('Stripe payment not found.')
    }

    const reviewedAt = new Date().toISOString()
    const update = await admin
      .from('membership_review_items')
      .update({
        status: 'refund_requested',
        reviewed_by: reviewerId,
        reviewed_at: reviewedAt,
      })
      .eq('id', reviewId)
      .eq('status', 'pending')
    if (update.error) throw update.error

    try {
      const stripe = createStripeClient()
      await stripe.refunds.create(
        { payment_intent: paymentResult.data.stripe_payment_intent_id },
        { idempotencyKey: `membership-review-refund-${reviewId}` },
      )
    } catch (error: unknown) {
      await admin
        .from('membership_review_items')
        .update({
          status: 'pending',
          reviewed_by: null,
          reviewed_at: null,
        })
        .eq('id', reviewId)
        .eq('status', 'refund_requested')
      throw error
    }
  }

  revalidatePath('/admin/membership')
  revalidatePath('/membership')
}
