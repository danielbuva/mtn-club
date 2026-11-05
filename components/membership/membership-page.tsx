import { ArrowRight, BadgeCheck, Clock3, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { PublicShell } from '@/components/landing/public-shell'
import { ZellePaymentClaimForm } from '@/components/membership/zelle-payment-claim-form'
import type { Viewer } from '@/lib/auth/viewer'
import { ZELLE_PHONE_DISPLAY } from '@/lib/constants'
import type { MembershipAccount } from '@/lib/memberships/account'
import { MEMBERSHIP_INTEREST_OPTIONS } from '@/lib/memberships/application-options'
import {
  getMembershipPaymentState,
  getMembershipSummary,
} from '@/lib/memberships/payment-state'

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Los_Angeles',
  }).format(new Date(value))

export function MembershipPage({
  viewer,
  account,
  signedIn = false,
}: {
  viewer: Viewer
  account: MembershipAccount | null
  signedIn?: boolean
}) {
  if (viewer.isAuthenticated) {
    return (
      <SignedInMembershipPage
        viewer={viewer}
        account={account}
        signedIn={signedIn}
      />
    )
  }

  return (
    <PublicShell>
      <PageViewTracker eventName="membership_view" />

      <section className="public-page-top border-b border-[#211D18]/15 px-5 pb-14 sm:px-8 sm:pb-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div>
            <p className="font-brand text-sm uppercase tracking-[0.2em] text-[#6A5146]">
              Membership
            </p>
            <h1 className="mt-3 max-w-4xl font-brand text-6xl uppercase leading-[0.9] sm:text-8xl">
              Become a member.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#211D18]/70">
              Membership is $25 for 12 months. Complete the sign-up form, send
              the dues through Zelle, and leadership will confirm your term.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <Link
                href="/membership-sign-up"
                className="group inline-flex min-h-12 items-center gap-3 bg-[#211D18] px-6 font-semibold text-[#FFECA2] outline-none focus-visible:ring-2 focus-visible:ring-[#211D18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F1DF]"
              >
                Membership sign up
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/learn-more#membership"
                className="inline-flex min-h-11 items-center font-semibold underline decoration-[#211D18]/35 underline-offset-4"
              >
                What does a membership get?
              </Link>
            </div>
          </div>

          <ZellePanel />
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_22rem]">
          <div>
            <h2 className="font-brand text-4xl uppercase sm:text-5xl">
              How confirmation works
            </h2>
            <ol className="mt-6 grid gap-px overflow-hidden border border-[#211D18]/20 bg-[#211D18]/20 sm:grid-cols-3">
              {[
                ['01', 'Sign up', 'Create your account and submit the form.'],
                ['02', 'Send the dues', `Zelle $25 to ${ZELLE_PHONE_DISPLAY}.`],
                [
                  '03',
                  'Leadership confirms',
                  'An officer cross-references the club account and activates your term.',
                ],
              ].map(([number, title, description]) => (
                <li key={number} className="bg-[#F8F1DF] p-5">
                  <p className="font-brand text-sm text-[#6A5146]">{number}</p>
                  <h3 className="mt-3 font-brand text-2xl uppercase">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#211D18]/65">
                    {description}
                  </p>
                </li>
              ))}
            </ol>

            <section className="mt-10 border-t border-[#211D18]/20 pt-8">
              <h2 className="font-brand text-4xl uppercase">
                Member activities
              </h2>
              <ul className="mt-5 grid gap-x-8 text-sm leading-6 text-[#211D18]/70 sm:grid-cols-2">
                {MEMBERSHIP_INTEREST_OPTIONS.map(item => (
                  <li key={item} className="border-b border-[#211D18]/15 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="h-fit lg:sticky lg:top-8">
            <MembershipStatus viewer={viewer} account={account} />
          </aside>
        </div>
      </section>
    </PublicShell>
  )
}

function SignedInMembershipPage({
  viewer,
  account,
  signedIn,
}: {
  viewer: Viewer
  account: MembershipAccount | null
  signedIn: boolean
}) {
  const paymentState = getMembershipPaymentState(account)
  const showZelleInstructions = ['initial', 'renewal', 'rejected'].includes(
    paymentState,
  )

  return (
    <PublicShell>
      <PageViewTracker eventName="membership_view" />

      <section className="public-page-top border-b border-[#211D18]/15 px-5 pb-14 sm:px-8 sm:pb-20">
        <div className="mx-auto max-w-4xl">
          {signedIn ? (
            <output className="mb-6 block border border-[#211D18]/20 bg-[#E9DDC3] px-4 py-3 text-sm font-semibold text-[#211D18]">
              Signed in{viewer.email ? ` as ${viewer.email}` : ''}.
            </output>
          ) : null}
          <p className="font-brand text-sm uppercase tracking-[0.2em] text-[#6A5146]">
            Membership
          </p>
          <h1 className="mt-3 font-brand text-6xl uppercase leading-[0.9] sm:text-8xl">
            Membership status.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#211D18]/70">
            {getMembershipSummary(account)}
          </p>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-4xl gap-8">
          <MembershipStatus viewer={viewer} account={account} />
          {showZelleInstructions && <ZellePanel />}
        </div>
      </section>
    </PublicShell>
  )
}

function ZellePanel() {
  return (
    <section className="bg-[#211D18] p-7 text-[#F8F1DF]">
      <p className="text-sm text-[#F8F1DF]/60">Send through Zelle</p>
      <p className="mt-1 font-brand text-6xl text-[#FFECA2]">$25</p>
      <p className="mt-2 text-sm leading-6 text-[#F8F1DF]/70">
        Use phone number{' '}
        <strong className="whitespace-nowrap text-[#FFECA2]">
          {ZELLE_PHONE_DISPLAY}
        </strong>
        . Keep your payment confirmation while leadership checks the club
        account.
      </p>
    </section>
  )
}

function MembershipStatus({
  viewer,
  account,
}: {
  viewer: Viewer
  account: MembershipAccount | null
}) {
  if (!viewer.isAuthenticated) {
    return (
      <StatusBox icon={BadgeCheck} title="Already signed up?">
        <p>Sign in to see your form and confirmation status.</p>
        <StatusLink
          href={`/auth/login?returnTo=${encodeURIComponent('/membership?signedIn=1')}`}
        >
          Sign in
        </StatusLink>
      </StatusBox>
    )
  }

  if (!account) {
    return (
      <StatusBox icon={Clock3} title="Status unavailable">
        Your membership status could not be loaded. Try again later or contact
        club leadership.
      </StatusBox>
    )
  }

  if (!account.schemaReady) {
    return (
      <StatusBox icon={Clock3} title="Status unavailable">
        Your membership status could not be loaded. Try again later or contact
        club leadership.
      </StatusBox>
    )
  }

  if (account.restriction !== 'normal') {
    return (
      <StatusBox icon={ShieldAlert} title={`Account ${account.restriction}`}>
        Contact club leadership if you believe this is incorrect.
      </StatusBox>
    )
  }

  const paymentState = getMembershipPaymentState(account)

  if (paymentState === 'active') {
    return (
      <StatusBox icon={BadgeCheck} title="Membership active">
        {account.accessExpiresAt
          ? `Your current term ends ${formatDateTime(account.accessExpiresAt)}.`
          : 'Your membership access is active.'}
      </StatusBox>
    )
  }

  if (paymentState === 'withdrawn' || paymentState === 'activation') {
    return (
      <StatusBox
        icon={ShieldAlert}
        title={
          paymentState === 'withdrawn'
            ? 'Application withdrawn'
            : 'Activation needed'
        }
      >
        {getMembershipSummary(account)}
      </StatusBox>
    )
  }

  if (paymentState === 'incomplete') {
    return (
      <StatusBox
        icon={Clock3}
        title={
          account.latestZelleStatus === 'rejected'
            ? 'Payment not matched'
            : 'Membership pending'
        }
      >
        <p>
          {account.latestZelleStatus === 'rejected'
            ? 'Leadership could not match your payment. Contact the club with your payment details.'
            : 'Complete your membership application before reporting a dues payment.'}
        </p>
        <StatusLink href="/membership-sign-up">
          Complete your application
        </StatusLink>
      </StatusBox>
    )
  }

  if (paymentState === 'guardian') {
    return (
      <StatusBox icon={ShieldAlert} title="Guardian consent needed">
        A parent or guardian must provide consent before leadership can confirm
        the membership.
      </StatusBox>
    )
  }

  if (paymentState === 'pending') {
    return (
      <StatusBox icon={Clock3} title="Confirmation pending">
        Leadership is checking your Zelle payment. Full member actions remain
        locked until confirmation.
      </StatusBox>
    )
  }

  if (paymentState === 'rejected') {
    return (
      <StatusBox icon={ShieldAlert} title="Payment not matched">
        <p>
          Check the Zelle recipient and report the payment again when ready.
        </p>
        <ZellePaymentClaimForm />
      </StatusBox>
    )
  }

  return (
    <StatusBox
      icon={Clock3}
      title={
        paymentState === 'renewal' ? 'Membership expired' : 'Form received'
      }
    >
      <p>
        {paymentState === 'renewal'
          ? 'Send a new $25 payment through Zelle, then report it below. Leadership will confirm a new 12-month term.'
          : 'Send the $25 dues through Zelle, then let leadership know.'}
      </p>
      <ZellePaymentClaimForm renewal={paymentState === 'renewal'} />
    </StatusBox>
  )
}

function StatusLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="mt-5 inline-flex min-h-11 items-center font-semibold underline decoration-[#211D18]/35 underline-offset-4"
    >
      {children}
    </Link>
  )
}

function StatusBox({
  icon: Icon,
  title,
  children,
  inline = false,
}: {
  icon: typeof BadgeCheck
  title: string
  children?: React.ReactNode
  inline?: boolean
}) {
  if (inline) {
    return (
      <section className="flex items-center gap-4 bg-[#E9DDC3] p-6">
        <span className="flex size-11 shrink-0 items-center justify-center bg-[#211D18] text-[#FFECA2]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <h2 className="font-brand text-3xl uppercase">{title}</h2>
      </section>
    )
  }

  return (
    <section className="bg-[#E9DDC3] p-6">
      <span className="flex size-11 items-center justify-center bg-[#211D18] text-[#FFECA2]">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-brand text-3xl uppercase">{title}</h2>
      {children && (
        <div className="mt-3 text-sm leading-6 text-[#211D18]/70">
          {children}
        </div>
      )}
    </section>
  )
}
