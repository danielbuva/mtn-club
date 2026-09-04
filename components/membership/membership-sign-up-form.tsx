'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import {
  type MembershipSignUpActionState,
  submitMembershipSignUp,
} from '@/app/(landing)/membership-sign-up/actions'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { PublicShell } from '@/components/landing/public-shell'
import { MembershipAccountFields } from '@/components/membership/membership-account-fields'
import {
  MembershipAuthControls,
  MembershipPendingFields,
} from '@/components/membership/membership-auth-controls'
import { ZellePaymentStep } from '@/components/membership/zelle-payment-step'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MEMBERSHIP_INTEREST_OPTIONS } from '@/lib/memberships/application-options'

const initialState: MembershipSignUpActionState = {
  error: null,
  captchaResetKey: 0,
  confirmationEmail: null,
}

const radioCardClass =
  'flex cursor-pointer items-start gap-3 border border-[#211D18]/35 p-4 transition focus-within:ring-2 focus-within:ring-[#211D18] focus-within:ring-offset-2 focus-within:ring-offset-[#F8F1DF] has-[:checked]:border-[#211D18] has-[:checked]:bg-[#E9DDC3]'

const selectionInputClass = 'mt-1 size-4 shrink-0 accent-[#211D18] outline-none'
const formControlClass =
  'h-12 rounded-none border-[#211D18]/35 bg-transparent shadow-none focus-visible:ring-2 focus-visible:ring-[#211D18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F1DF]'

export function MembershipSignUpForm({ email }: { email: string | null }) {
  const [state, formAction] = useActionState(
    submitMembershipSignUp,
    initialState,
  )
  const [showOtherInterest, setShowOtherInterest] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state.error) errorRef.current?.focus()
  }, [state.error])

  if (state.confirmationEmail) {
    return (
      <PublicShell>
        <section className="public-page-top px-5 pb-16 sm:px-8 sm:pb-24">
          <section
            aria-live="polite"
            className="mx-auto max-w-2xl border border-[#211D18]/25 bg-[#E9DDC3] p-6 sm:p-8"
          >
            <p className="font-brand text-sm uppercase tracking-[0.2em] text-[#6A5146]">
              Application received
            </p>
            <h1 className="mt-3 font-brand text-4xl uppercase sm:text-5xl">
              Check your email.
            </h1>
            <p className="mt-5 leading-7 text-[#211D18]/75">
              We saved your membership application and sent a confirmation to{' '}
              <strong>{state.confirmationEmail}</strong>. Confirm the address,
              then sign in to see your membership status.
            </p>
            <Link
              href={`/auth/login?returnTo=${encodeURIComponent('/membership')}`}
              className="mt-6 inline-flex min-h-12 items-center bg-[#211D18] px-6 font-semibold text-[#FFECA2] outline-none focus-visible:ring-2 focus-visible:ring-[#211D18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F1DF]"
            >
              Sign in after confirming
            </Link>
          </section>
        </section>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <PageViewTracker eventName="membership_signup_view" />
      <section className="public-page-top px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-4xl">
          <p className="font-brand text-sm uppercase tracking-[0.2em] text-[#6A5146]">
            Sign up
          </p>
          <h1 className="mt-3 max-w-3xl font-brand text-5xl uppercase leading-[0.9] sm:text-7xl">
            Membership sign up.
          </h1>
          {email ? (
            <p className="mt-5 text-base leading-6 text-[#211D18]/70">
              Signed in as {email}.{' '}
              <Link
                href="/profile/user/account#sign-in-methods"
                className="font-semibold text-[#211D18] underline decoration-[#211D18]/35 underline-offset-4"
              >
                Account settings
              </Link>
            </p>
          ) : (
            <p className="mt-5 text-base leading-6 text-[#211D18]/70">
              Already have an account?{' '}
              <Link
                href={`/auth/login?returnTo=${encodeURIComponent('/membership-sign-up')}`}
                className="font-semibold text-[#211D18] underline decoration-[#211D18]/35 underline-offset-4"
              >
                Sign in first.
              </Link>
            </p>
          )}

          <ZellePaymentStep />

          <Link
            href="/learn-more#membership"
            className="mt-6 inline-flex min-h-11 items-center font-semibold underline decoration-[#211D18]/35 underline-offset-4"
          >
            What does a membership get?
          </Link>

          <div className="mt-10 border-t border-[#211D18]/20 pt-7">
            <p className="font-brand text-xs uppercase tracking-[0.2em] text-[#6A5146]">
              02
            </p>
            <h2 className="mt-1 font-brand text-3xl uppercase">
              Complete your application
            </h2>
            <p
              id="membership-submission-process"
              className="mt-3 max-w-2xl text-sm leading-6 text-[#211D18]/65"
            >
              Submitting adds your application to the leadership review queue.
              Leadership matches your Zelle payment and confirms membership;
              minors also need guardian consent.
            </p>
          </div>

          <form
            action={formAction}
            autoComplete="on"
            aria-describedby="membership-submission-process"
            data-membership-sign-up-form
            className="mt-8 space-y-10"
          >
            <MembershipPendingFields>
              {email ? (
                <>
                  <input type="hidden" name="contactEmail" value={email} />
                  <p className="text-sm leading-6 text-[#211D18]/65">
                    Your application belongs to your signed-in account. You
                    won’t need another account or password.
                  </p>
                </>
              ) : (
                <MembershipAccountFields
                  captchaResetKey={state.captchaResetKey}
                />
              )}

              <fieldset className="grid gap-5 border-t border-[#211D18]/20 pt-7">
                <legend className="font-brand text-3xl uppercase">
                  About you
                </legend>
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    autoComplete="name"
                    autoCapitalize="words"
                    maxLength={120}
                    className={formControlClass}
                    required
                  />
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium">Age requirement</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className={radioCardClass}>
                      <input
                        type="radio"
                        name="ageStatus"
                        value="adult"
                        className={selectionInputClass}
                        required
                      />
                      <span>
                        <span className="block font-semibold">
                          I am 18 or older
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-[#211D18]/65">
                          No guardian consent is required.
                        </span>
                      </span>
                    </label>
                    <label className={radioCardClass}>
                      <input
                        type="radio"
                        name="ageStatus"
                        value="minor"
                        className={selectionInputClass}
                        required
                      />
                      <span>
                        <span className="block font-semibold">
                          I am under 18
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-[#211D18]/65">
                          A parent or guardian must provide consent to club
                          leadership before membership can be confirmed.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </fieldset>

              <fieldset className="grid gap-5 border-t border-[#211D18]/20 pt-7">
                <legend className="font-brand text-3xl uppercase">
                  Dues status
                </legend>
                <p className="max-w-2xl text-sm leading-6 text-[#211D18]/65">
                  Full member actions remain locked until confirmation.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={radioCardClass}>
                    <input
                      type="radio"
                      name="duesStatus"
                      value="paid"
                      className={selectionInputClass}
                      required
                    />
                    <span className="font-semibold">I sent the $25 dues</span>
                  </label>
                  <label className={radioCardClass}>
                    <input
                      type="radio"
                      name="duesStatus"
                      value="not_yet"
                      className={selectionInputClass}
                      required
                    />
                    <span className="font-semibold">I have not paid yet</span>
                  </label>
                </div>
              </fieldset>

              <fieldset className="grid gap-5 border-t border-[#211D18]/20 pt-7">
                <legend className="font-brand text-3xl uppercase">
                  What gets you outside?
                </legend>
                <p className="text-sm text-[#211D18]/65">
                  Choose all the activities that interest you.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {MEMBERSHIP_INTEREST_OPTIONS.map(option => (
                    <label key={option} className={radioCardClass}>
                      <input
                        type="checkbox"
                        name="interests"
                        value={option}
                        className={selectionInputClass}
                      />
                      <span className="font-semibold">{option}</span>
                    </label>
                  ))}
                  <label className={radioCardClass}>
                    <input
                      type="checkbox"
                      name="interests"
                      value="Other"
                      className={selectionInputClass}
                      checked={showOtherInterest}
                      onChange={event =>
                        setShowOtherInterest(event.currentTarget.checked)
                      }
                    />
                    <span className="font-semibold">Other</span>
                  </label>
                </div>
                {showOtherInterest && (
                  <div className="grid gap-2">
                    <Label htmlFor="otherInterest">
                      If other, tell us what
                    </Label>
                    <Input
                      id="otherInterest"
                      name="otherInterest"
                      maxLength={120}
                      className={formControlClass}
                      required
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="experienceNotes">
                    How can we improve your club experience? (optional)
                  </Label>
                  <Textarea
                    id="experienceNotes"
                    name="experienceNotes"
                    maxLength={2000}
                    rows={5}
                    className="rounded-none border-[#211D18]/35 bg-transparent shadow-none focus-visible:ring-2 focus-visible:ring-[#211D18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F1DF]"
                  />
                </div>
              </fieldset>

              <fieldset className="border-t border-[#211D18]/20 pt-7">
                <legend className="font-brand text-3xl uppercase">
                  Stay in the loop
                </legend>
                <label className="mt-5 flex cursor-pointer items-start gap-3 border border-[#211D18]/35 p-4 transition focus-within:ring-2 focus-within:ring-[#211D18] focus-within:ring-offset-2 focus-within:ring-offset-[#F8F1DF] has-[:checked]:bg-[#E9DDC3]">
                  <input
                    type="checkbox"
                    name="mailingListOptIn"
                    className={selectionInputClass}
                  />
                  <span>
                    <span className="block font-semibold">
                      Join the Mountain Club mailing list
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-[#211D18]/65">
                      Get club news, trip announcements, and community updates
                      by email. This is optional and you can unsubscribe in
                      account settings.
                    </span>
                  </span>
                </label>
              </fieldset>

              {state.error && (
                <div
                  ref={errorRef}
                  role="alert"
                  tabIndex={-1}
                  className="border border-red-900/20 bg-red-50 p-4 text-sm text-red-900"
                >
                  <p className="font-semibold">
                    We couldn&apos;t save your signup.
                  </p>
                  <p className="mt-1">{state.error}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 border-t border-[#211D18]/20 pt-7">
                <MembershipAuthControls createsAccount={!email} />
                <Link
                  href="/membership"
                  className="text-sm font-semibold underline underline-offset-4"
                >
                  View membership status
                </Link>
              </div>
            </MembershipPendingFields>
          </form>
        </div>
      </section>
    </PublicShell>
  )
}
