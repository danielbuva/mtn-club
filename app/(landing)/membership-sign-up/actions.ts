'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { captchaRequestError } from '@/lib/auth/captcha'
import { authErrorMessage } from '@/lib/auth/errors'
import { passwordError } from '@/lib/auth/password'
import { emailConfirmationRedirect } from '@/lib/auth/return-to'
import {
  encodeMembershipInterests,
  MEMBERSHIP_INTEREST_OPTIONS,
} from '@/lib/memberships/application-options'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type MembershipSignUpActionState = {
  error: string | null
  captchaResetKey: number
  confirmationEmail: string | null
}

const normalizeText = (formData: FormData, name: string) =>
  String(formData.get(name) ?? '').trim()

function splitName(fullName: string) {
  const parts = fullName.split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? fullName,
    lastName: parts.slice(1).join(' ') || null,
  }
}

export async function submitMembershipSignUp(
  previousState: MembershipSignUpActionState,
  formData: FormData,
): Promise<MembershipSignUpActionState> {
  const failure = (error: string, resetCaptcha = false) => ({
    error,
    captchaResetKey: previousState.captchaResetKey + (resetCaptcha ? 1 : 0),
    confirmationEmail: null,
  })
  const fullName = normalizeText(formData, 'fullName')
  const contactEmail = normalizeText(formData, 'contactEmail').toLowerCase()
  const ageStatus = normalizeText(formData, 'ageStatus')
  const duesStatus = normalizeText(formData, 'duesStatus')
  const interestChoices = formData
    .getAll('interests')
    .map(value => String(value).trim())
    .filter(Boolean)
  const otherInterest = normalizeText(formData, 'otherInterest')
  const experienceNotes = normalizeText(formData, 'experienceNotes')
  const password = String(formData.get('password') ?? '')
  const repeatPassword = String(formData.get('repeatPassword') ?? '')
  const captchaToken = normalizeText(formData, 'captchaToken')
  const mailingListOptIn = formData.get('mailingListOptIn') === 'on'

  if (fullName.length < 2 || fullName.length > 120) {
    return failure('Enter your full name.')
  }
  if (
    contactEmail.length < 3 ||
    contactEmail.length > 320 ||
    !contactEmail.includes('@')
  ) {
    return failure('Enter a valid contact email.')
  }
  if (ageStatus !== 'adult' && ageStatus !== 'minor') {
    return failure('Choose the age option that applies to you.')
  }
  if (duesStatus !== 'paid' && duesStatus !== 'not_yet') {
    return failure('Tell us whether you have sent the annual dues.')
  }

  const allowedInterests = new Set<string>([
    ...MEMBERSHIP_INTEREST_OPTIONS,
    'Other',
  ])
  if (
    interestChoices.length === 0 ||
    interestChoices.length > MEMBERSHIP_INTEREST_OPTIONS.length + 1 ||
    interestChoices.some(interest => !allowedInterests.has(interest))
  ) {
    return failure('Choose at least one outdoor activity.')
  }

  const selectedInterests = interestChoices.filter(
    interest => interest !== 'Other',
  )
  if (interestChoices.includes('Other')) {
    if (otherInterest.length < 2 || otherInterest.length > 120) {
      return failure('Tell us which other outdoor activity interests you.')
    }
    selectedInterests.push(otherInterest)
  }
  const uniqueInterests = [...new Set(selectedInterests)]
  if (uniqueInterests.length === 0) {
    return failure('Choose at least one outdoor activity.')
  }
  const primaryInterest = encodeMembershipInterests(uniqueInterests)
  if (experienceNotes.length > 2000) {
    return failure('Keep the experience note under 2,000 characters.')
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (error: unknown) {
    console.error(
      'Membership sign-up is missing its server configuration:',
      error,
    )
    return failure(
      'Membership sign-up is temporarily unavailable. Please try again later.',
    )
  }

  const supabase = await createClient()
  const {
    data: { user: signedInUser },
  } = await supabase.auth.getUser()
  let userId = signedInUser?.id ?? null
  let requiresConfirmation = false

  if (signedInUser) {
    if (signedInUser.email?.toLowerCase() !== contactEmail) {
      return failure(
        'Sign in again with the account shown on this form before submitting.',
      )
    }
  } else {
    const passwordMessage = passwordError(password)
    if (passwordMessage) return failure(passwordMessage)
    if (password !== repeatPassword)
      return failure('The passwords do not match.')
    const captchaMessage = captchaRequestError(captchaToken)
    if (captchaMessage) return failure(captchaMessage, true)

    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    const signUpResult = await supabase.auth.signUp({
      email: contactEmail,
      password,
      options: {
        captchaToken,
        ...(configuredOrigin
          ? {
              emailRedirectTo: emailConfirmationRedirect(
                configuredOrigin,
                '/membership-sign-up',
              ),
            }
          : {}),
        ...(ageStatus === 'adult' ? { data: { age_18_or_older: true } } : {}),
      },
    })
    if (signUpResult.error)
      return failure(authErrorMessage(signUpResult.error), true)
    if (!signUpResult.data.user)
      return failure(
        'We could not create your account. Check your connection and try again.',
        true,
      )
    if (!signUpResult.data.session) {
      if ((signUpResult.data.user.identities?.length ?? 0) === 0) {
        return failure(
          'If you already have an account, sign in using your usual method or reset your password. Otherwise, check your email to continue.',
          true,
        )
      }
      requiresConfirmation = true
    }
    userId = signUpResult.data.user.id
  }

  if (!userId)
    return failure(
      'We could not verify your account. Check your connection and try again.',
      true,
    )
  const existing = await admin
    .from('membership_applications')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (existing.error)
    return failure('We could not check your application. Please try again.')
  if (existing.data)
    return failure(
      'An application is already on file. Open Membership status to review it or contact club support.',
    )

  const duesPaymentClaimed = duesStatus === 'paid'
  const guardianConsent = ageStatus === 'adult' ? 'not_required' : 'pending'
  const duesClaimedAt = duesPaymentClaimed ? new Date().toISOString() : null
  const { firstName, lastName } = splitName(fullName)
  const duesSettings = duesPaymentClaimed
    ? await admin
        .from('club_admin_settings')
        .select('dues_amount_cents, currency')
        .eq('id', true)
        .single()
    : { data: null, error: null }

  if (duesSettings.error) {
    console.error(
      'Membership dues settings could not be loaded:',
      duesSettings.error,
    )
    return failure('We could not start your payment claim. Please try again.')
  }

  const [
    profileResult,
    membershipResult,
    applicationResult,
    ageDeclarationResult,
    mailingResult,
    mailingConsentResult,
    zelleResult,
  ] = await Promise.all([
    admin.from('profiles').upsert(
      {
        user_id: userId,
        display_name: fullName,
        first_name: firstName,
        last_name: lastName,
      },
      { onConflict: 'user_id' },
    ),
    admin
      .from('memberships')
      .upsert(
        { user_id: userId, status: 'pending', role: 'regular' },
        { onConflict: 'user_id', ignoreDuplicates: true },
      ),
    admin.from('membership_applications').insert({
      user_id: userId,
      full_name: fullName,
      contact_email: contactEmail,
      age_status: ageStatus,
      guardian_consent: guardianConsent,
      dues_payment_claimed: duesPaymentClaimed,
      dues_claimed_at: duesClaimedAt,
      primary_interest: primaryInterest,
      experience_notes: experienceNotes || null,
      status: 'submitted',
      confirmed_at: null,
      confirmed_by: null,
      membership_access_override_id: null,
    }),
    ageStatus === 'adult'
      ? admin.from('account_age_declarations').upsert(
          {
            user_id: userId,
            is_18_or_older: true,
            source: 'membership_application',
          },
          { onConflict: 'user_id', ignoreDuplicates: true },
        )
      : Promise.resolve({ error: null }),
    mailingListOptIn
      ? admin.from('mailing_list_subscriptions').upsert(
          {
            user_id: userId,
            email: contactEmail,
            subscribed: true,
            consent_source: 'membership_signup',
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
          },
          { onConflict: 'user_id' },
        )
      : Promise.resolve({ error: null }),
    mailingListOptIn
      ? admin.from('mailing_list_consent_events').insert({
          user_id: userId,
          email: contactEmail,
          subscribed: true,
          consent_source: 'membership_signup',
        })
      : Promise.resolve({ error: null }),
    duesPaymentClaimed
      ? admin.from('membership_zelle_payments').insert({
          user_id: userId,
          amount_cents: duesSettings.data?.dues_amount_cents ?? 2500,
          currency: duesSettings.data?.currency ?? 'usd',
          status: 'claimed',
          claim_source: 'membership_signup',
          claimed_at: duesClaimedAt ?? new Date().toISOString(),
        })
      : Promise.resolve({ error: null }),
  ])

  if (
    profileResult.error ||
    membershipResult.error ||
    applicationResult.error ||
    ageDeclarationResult.error ||
    mailingResult.error ||
    mailingConsentResult.error ||
    zelleResult.error
  ) {
    console.error('Membership sign-up persistence failed:', {
      profile: profileResult.error,
      membership: membershipResult.error,
      application: applicationResult.error,
      ageDeclaration: ageDeclarationResult.error,
      mailingList: mailingResult.error,
      mailingConsent: mailingConsentResult.error,
      zelle: zelleResult.error,
    })
    // Never roll back a form failure by deleting the member's auth account.
    return failure(
      'Your account is safe, but part of the application could not be saved. Check Membership status before trying again, or contact club support.',
    )
  }

  const { error: activityError } = await admin
    .from('admin_activity_events')
    .insert({
      actor_user_id: userId,
      subject_user_id: userId,
      action: 'membership_application_submitted',
      resource_type: 'membership_application',
      resource_id: userId,
      summary: `${fullName} submitted a membership application.`,
      after_data: {
        guardian_consent: guardianConsent,
        payment_claimed: duesPaymentClaimed,
        mailing_list_opt_in: mailingListOptIn,
      },
    })
  if (activityError) {
    console.error(
      'Membership application activity could not be recorded:',
      activityError,
    )
  }

  revalidatePath('/membership')
  if (requiresConfirmation) {
    return {
      error: null,
      captchaResetKey: previousState.captchaResetKey + 1,
      confirmationEmail: contactEmail,
    }
  }
  redirect('/membership')
}
