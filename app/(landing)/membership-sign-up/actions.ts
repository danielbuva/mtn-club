'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  encodeMembershipInterests,
  MEMBERSHIP_INTEREST_OPTIONS,
} from '@/lib/memberships/application-options'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type MembershipSignUpActionState = {
  error: string | null
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
  _previousState: MembershipSignUpActionState,
  formData: FormData,
): Promise<MembershipSignUpActionState> {
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
  const mailingListOptIn = formData.get('mailingListOptIn') === 'on'

  if (fullName.length < 2 || fullName.length > 120) {
    return { error: 'Enter your full name.' }
  }
  if (
    contactEmail.length < 3 ||
    contactEmail.length > 320 ||
    !contactEmail.includes('@')
  ) {
    return { error: 'Enter a valid contact email.' }
  }
  if (ageStatus !== 'adult' && ageStatus !== 'minor') {
    return { error: 'Choose the age option that applies to you.' }
  }
  if (duesStatus !== 'paid' && duesStatus !== 'not_yet') {
    return { error: 'Tell us whether you have sent the annual dues.' }
  }
  if (password.length < 8) {
    return { error: 'Use a password with at least eight characters.' }
  }
  if (password !== repeatPassword) {
    return { error: 'The passwords do not match.' }
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
    return { error: 'Choose at least one outdoor activity.' }
  }

  const selectedInterests = interestChoices.filter(
    interest => interest !== 'Other',
  )
  if (interestChoices.includes('Other')) {
    if (otherInterest.length < 2 || otherInterest.length > 120) {
      return { error: 'Tell us which other outdoor activity interests you.' }
    }
    selectedInterests.push(otherInterest)
  }
  const uniqueInterests = [...new Set(selectedInterests)]
  if (uniqueInterests.length === 0) {
    return { error: 'Choose at least one outdoor activity.' }
  }
  const primaryInterest = encodeMembershipInterests(uniqueInterests)
  if (experienceNotes.length > 2000) {
    return { error: 'Keep the experience note under 2,000 characters.' }
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (error: unknown) {
    console.error(
      'Membership sign-up is missing its server configuration:',
      error,
    )
    return {
      error:
        'Membership sign-up is temporarily unavailable. Please try again later.',
    }
  }

  const supabase = await createClient()
  const signUpResult = await supabase.auth.signUp({
    email: contactEmail,
    password,
  })
  if (signUpResult.error || !signUpResult.data.user) {
    const accountExists = signUpResult.error?.message
      .toLowerCase()
      .includes('already registered')
    return {
      error: accountExists
        ? 'An account already exists for this email. Use the sign-in link below.'
        : (signUpResult.error?.message ??
          'We could not create the account. Please try again.'),
    }
  }
  const userId = signUpResult.data.user.id

  const clearSessionAndDeleteUser = async () => {
    const signOutResult = await supabase.auth.signOut({ scope: 'local' })
    if (signOutResult.error) {
      console.error(
        'Membership sign-up session cleanup failed:',
        signOutResult.error,
      )
    }

    const cleanupResult = await admin.auth.admin.deleteUser(userId)
    if (cleanupResult.error) {
      console.error(
        'Membership sign-up account cleanup failed:',
        cleanupResult.error,
      )
    }
    return cleanupResult.error
  }

  const session = signUpResult.data.session
  if (!session) {
    await clearSessionAndDeleteUser()
    return {
      error:
        'We could not sign you in after creating the account. Please try again.',
    }
  }

  const sessionResult = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })
  const verifiedUser = await supabase.auth.getUser()
  if (
    sessionResult.error ||
    verifiedUser.error ||
    verifiedUser.data.user?.id !== userId
  ) {
    console.error('Membership sign-up session verification failed:', {
      session: sessionResult.error,
      user: verifiedUser.error,
    })
    await clearSessionAndDeleteUser()
    return {
      error:
        'We could not sign you in after creating the account. Please try again.',
    }
  }

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
    await clearSessionAndDeleteUser()
    return { error: 'We could not start your payment claim. Please try again.' }
  }

  const [
    profileResult,
    membershipResult,
    applicationResult,
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
    admin.from('membership_applications').upsert(
      {
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
      },
      { onConflict: 'user_id' },
    ),
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
    mailingResult.error ||
    mailingConsentResult.error ||
    zelleResult.error
  ) {
    console.error('Membership sign-up persistence failed:', {
      profile: profileResult.error,
      membership: membershipResult.error,
      application: applicationResult.error,
      mailingList: mailingResult.error,
      mailingConsent: mailingConsentResult.error,
      zelle: zelleResult.error,
    })
    const cleanupError = await clearSessionAndDeleteUser()
    return {
      error: cleanupError
        ? 'Your account was created, but we could not save the membership form. Contact club leadership for help.'
        : 'We could not save your signup. Please try again.',
    }
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
  redirect('/membership')
}
