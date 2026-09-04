import { ArrowRight, BadgeCheck, Clock3, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { claimZelleMembershipPayment } from '@/app/(site)/membership/actions'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { PublicShell } from '@/components/landing/public-shell'
import { Button } from '@/components/ui/button'
import type { Viewer } from '@/lib/auth/viewer'
import { ZELLE_PHONE_DISPLAY } from '@/lib/constants'
import type { MembershipAccount } from '@/lib/memberships/account'
import { MEMBERSHIP_INTEREST_OPTIONS } from '@/lib/memberships/application-options'

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
  const application = account?.schemaReady ? account.application : null
  const showZelleInstructions = Boolean(
    application && !application.duesPaymentClaimed && !account?.accessActive,
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
            {getSignedInSummary(account)}
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

function getSignedInSummary(account: MembershipAccount | null) {
  if (!account?.schemaReady) {
    return 'We could not load your membership status right now.'
  }
  if (account.restriction !== 'normal') {
    return `Your account is ${account.restriction}.`
  }
  if (account.accessActive) {
    return 'Your membership is active.'
  }
  if (!account.application) {
    return 'We could not find a membership application for this account.'
  }
  if (
    account.application.ageStatus === 'minor' &&
    account.application.guardianConsent === 'pending'
  ) {
    return 'Your form is complete. Guardian consent is still required before leadership can activate your membership.'
  }
  if (account.application.duesPaymentClaimed) {
    return 'Leadership is confirming your dues.'
  }
  if (account.latestZelleStatus === 'rejected') {
    return 'Leadership could not match the previous payment claim. You can report a new payment after checking the Zelle details.'
  }
  return 'Your form is complete. Send your dues to receive full membership access.'
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

  if (account.accessActive) {
    return (
      <StatusBox icon={BadgeCheck} title="Membership active">
        {account.accessExpiresAt
          ? `Your current term ends ${formatDateTime(account.accessExpiresAt)}.`
          : 'Your membership access is active.'}
      </StatusBox>
    )
  }

  if (!account.application) {
    return (
      <StatusBox icon={Clock3} title="Ready to join?">
        <p>Your account is ready. Complete the membership application next.</p>
        <StatusLink href="/membership-sign-up">
          Complete your application
        </StatusLink>
      </StatusBox>
    )
  }

  if (
    account.application.ageStatus === 'minor' &&
    account.application.guardianConsent === 'pending'
  ) {
    return (
      <StatusBox icon={ShieldAlert} title="Guardian consent needed">
        A parent or guardian must provide consent before leadership can confirm
        the membership.
      </StatusBox>
    )
  }

  if (account.application.duesPaymentClaimed) {
    return (
      <StatusBox icon={Clock3} title="Confirmation pending">
        Leadership is checking your Zelle payment. Full member actions remain
        locked until confirmation.
      </StatusBox>
    )
  }

  if (account.latestZelleStatus === 'rejected') {
    return (
      <StatusBox icon={ShieldAlert} title="Payment not matched">
        <p>
          Check the Zelle recipient and report the payment again when ready.
        </p>
        <form action={claimZelleMembershipPayment} className="mt-4">
          <Button
            type="submit"
            className="rounded-none bg-[#211D18] text-[#FFECA2]"
          >
            I sent the dues
          </Button>
        </form>
      </StatusBox>
    )
  }

  return (
    <StatusBox icon={Clock3} title="Form received">
      <p>Send the $25 dues through Zelle, then let leadership know.</p>
      <form action={claimZelleMembershipPayment} className="mt-4">
        <Button
          type="submit"
          className="rounded-none bg-[#211D18] text-[#FFECA2]"
        >
          I sent the dues
        </Button>
      </form>
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
