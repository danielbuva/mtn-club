'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  type MembershipSignUpActionState,
  submitMembershipSignUp,
} from '@/app/(landing)/membership-sign-up/actions'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { PublicShell } from '@/components/landing/public-shell'
import { MembershipAccountFields } from '@/components/membership/membership-account-fields'
import { ZellePaymentStep } from '@/components/membership/zelle-payment-step'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MEMBERSHIP_INTEREST_OPTIONS } from '@/lib/memberships/application-options'

const initialState: MembershipSignUpActionState = { error: null }

const radioCardClass =
  'flex cursor-pointer items-start gap-3 border border-[#211D18]/35 p-4 transition focus-within:ring-2 focus-within:ring-[#211D18] focus-within:ring-offset-2 focus-within:ring-offset-[#F8F1DF] has-[:checked]:border-[#211D18] has-[:checked]:bg-[#E9DDC3]'

const selectionInputClass = 'mt-1 size-4 shrink-0 accent-[#211D18] outline-none'
const formControlClass =
  'h-12 rounded-none border-[#211D18]/35 bg-transparent shadow-none focus-visible:ring-2 focus-visible:ring-[#211D18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F1DF]'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="min-h-12 rounded-none bg-[#211D18] px-7 text-[#FFECA2] hover:bg-[#352E27]"
    >
      {pending ? 'Creating your account…' : 'Create account and submit'}
    </Button>
  )
}

export function MembershipSignUpForm() {
  const [state, formAction] = useActionState(
    submitMembershipSignUp,
    initialState,
  )
  const [showOtherInterest, setShowOtherInterest] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state.error) errorRef.current?.focus()
  }, [state.error])

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
          <p className="mt-5 text-base leading-6 text-[#211D18]/70">
            Already signed up?{' '}
            <Link
              href={`/auth/login?returnTo=${encodeURIComponent('/membership?signedIn=1')}`}
              className="font-semibold text-[#211D18] underline decoration-[#211D18]/35 underline-offset-4"
            >
              Click here.
            </Link>
          </p>

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
              Create your account
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
            <MembershipAccountFields defaultEmail="" />

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
                      <span className="block font-semibold">I am under 18</span>
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
                  <Label htmlFor="otherInterest">If other, tell us what</Label>
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
              <SubmitButton />
              <Link
                href={`/auth/login?returnTo=${encodeURIComponent('/membership?signedIn=1')}`}
                className="text-sm font-semibold underline underline-offset-4"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
      </section>
    </PublicShell>
  )
}
