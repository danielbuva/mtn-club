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
  const { error: signupError } = await admin.rpc('submit_membership_signup', {
    p_user_id: userId,
    p_full_name: fullName,
    p_contact_email: contactEmail,
    p_age_status: ageStatus,
    p_dues_payment_claimed: duesStatus === 'paid',
    p_primary_interest: primaryInterest,
    p_experience_notes: experienceNotes || null,
    p_mailing_list_opt_in: mailingListOptIn,
  })
  if (signupError) {
    console.error('Membership sign-up persistence failed:', signupError)
    return failure(
      'Your account is safe, but your application could not be saved. Please try submitting again. If this continues, contact club support.',
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
