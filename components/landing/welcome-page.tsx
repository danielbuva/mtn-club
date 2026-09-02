import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { TrackLink } from '@/components/analytics/track-link'
import { PublicShell } from '@/components/landing/public-shell'
import { WelcomeDisclaimer } from '@/components/landing/welcome-disclaimer'
import { getViewer } from '@/lib/auth/viewer'
import {
  DISCORD_INVITE_URL,
  INSTAGRAM_URL,
  INVOLVEMENT_CENTER_URL,
} from '@/lib/constants'

const internalLinkClass =
  'group flex min-h-14 items-center justify-between gap-3 border-b border-[#211D18]/20 py-2 text-left outline-none transition hover:pl-1 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[#211D18] [@media(max-height:720px)]:min-h-10 [@media(max-height:720px)]:py-1 [@media(max-height:720px)]:text-sm'

const externalLinkClass = `${internalLinkClass} text-[#6A5146]`

const membershipLinkClass =
  'group inline-flex min-h-13 w-64 items-center justify-between gap-3 border border-[#211D18] px-6 py-2 text-base font-bold text-[#211D18] outline-none transition hover:bg-[#E9DDC3] focus-visible:ring-2 focus-visible:ring-[#211D18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F1DF] [@media(max-height:720px)]:min-h-11 [@media(max-height:720px)]:px-5 [@media(max-height:720px)]:text-sm'

function LinkArrow({ external = false }: { external?: boolean }) {
  const Icon = external ? ArrowUpRight : ArrowRight
  return (
    <Icon
      className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
      aria-hidden="true"
    />
  )
}

function WelcomePhoto() {
  return (
    <div className="relative -mt-[0.43em] ml-0.5 aspect-[5/4] w-[calc(100%-2px)] overflow-hidden sm:aspect-[16/7]">
      <Image
        src="/welcome/sunset-group.jpg"
        alt="Mountain Club members standing together beneath an orange sunset in the desert"
        fill
        priority
        sizes="(min-width: 1152px) 1088px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)"
        className="object-cover [object-position:50%_58%] sm:[object-position:50%_62%]"
      />
    </div>
  )
}

function MembershipLink({
  href = '/membership-sign-up',
  label = 'Become a Member',
}: {
  href?: string
  label?: string
}) {
  return (
    <TrackLink
      href={href}
      eventName="welcome_membership_signup_click"
      className={membershipLinkClass}
    >
      <span>{label}</span>
      <ArrowRight
        className="-mr-px size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </TrackLink>
  )
}

function MembershipLinkSkeleton() {
  return (
    <div
      className={membershipLinkClass}
      aria-hidden="true"
      data-membership-link-loading
    >
      <span className="h-4 w-32 animate-pulse bg-[#211D18]/15" />
      <ArrowRight className="-mr-px size-4 shrink-0" aria-hidden="true" />
    </div>
  )
}

async function ViewerMembershipLink() {
  const viewer = await getViewer()
  if (!viewer.isAuthenticated) {
    return <MembershipLink />
  }

  return <MembershipLink href="/membership" label="Membership Status" />
}

export function WelcomePage() {
  return (
    <PublicShell showFooter={false}>
      <PageViewTracker eventName="welcome_view" />

      <section className="public-page-top mx-auto flex min-h-svh w-full max-w-6xl flex-col px-5 pb-[3.875rem] [overflow-anchor:none] sm:px-8 sm:pb-[4.375rem] [@media(max-height:720px)]:pb-[3.125rem]">
        <div className="w-full">
          <div>
            <p className="font-brand text-xs uppercase tracking-[0.2em] text-[#6A5146]">
              Welcome to Mountain Club
            </p>
            <h1 className="mt-3 max-w-5xl font-brand text-[clamp(3.2rem,14vw,7rem)] leading-[0.86] uppercase tracking-[-0.03em] [@media(max-height:720px)]:text-[2.8rem]">
              Find your people
              <span className="sr-only"> outside.</span>
            </h1>

            <div className="relative mt-2 w-full font-brand text-[clamp(3.2rem,14vw,7rem)] leading-[0.86] uppercase tracking-[-0.03em] [@media(max-height:720px)]:text-[2.8rem] sm:mt-3">
              <p aria-hidden="true" className="relative z-10 text-[#211D18]">
                Outside.
              </p>
              <WelcomePhoto />
            </div>

            <p className="mt-5 max-w-xl text-base leading-6 text-[#211D18]/72 sm:text-lg sm:leading-7 [@media(max-height:720px)]:text-sm [@media(max-height:720px)]:leading-5">
              We climb, hike, camp, backpack, and try whatever gets us outside.
              Everyone is welcome.{' '}
              <Link
                href="/learn-more"
                className="whitespace-nowrap text-[0.82em] font-medium text-[#211D18]/65 underline decoration-[#211D18]/35 underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#211D18]"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </p>

            <div className="mt-6 flex max-w-xl flex-col items-start gap-3 [@media(max-height:720px)]:mt-4">
              <TrackLink
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                eventName="welcome_discord_click"
                className="group inline-flex min-h-13 w-64 items-center justify-between gap-3 bg-[#211D18] px-6 py-2 text-base font-bold text-[#FFECA2] outline-none transition hover:bg-[#352E27] focus-visible:ring-2 focus-visible:ring-[#211D18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F1DF] [@media(max-height:720px)]:min-h-11 [@media(max-height:720px)]:px-5 [@media(max-height:720px)]:text-sm"
              >
                <span>Join our Discord</span>
                <ArrowUpRight
                  className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </TrackLink>

              <Suspense fallback={<MembershipLinkSkeleton />}>
                <ViewerMembershipLink />
              </Suspense>
            </div>
            <p className="mt-3 max-w-lg text-xs leading-5 text-[#211D18]/62 sm:text-sm [@media(max-height:720px)]:mt-2 [@media(max-height:720px)]:text-[11px] [@media(max-height:720px)]:leading-4">
              Open community invitations and weekly meets are free. Member-only
              invitations are included with annual membership.
            </p>
          </div>
        </div>

        <div className="mt-auto pt-12 [@media(max-height:720px)]:pt-8">
          <nav
            aria-label="Welcome links"
            className="grid grid-cols-2 gap-x-5 border-t border-[#211D18]/20"
          >
            <TrackLink
              href="/schedule"
              eventName="welcome_calendar_click"
              className={internalLinkClass}
            >
              <span className="font-semibold leading-5">Trip schedule</span>
              <LinkArrow />
            </TrackLink>
            <TrackLink
              href="/gallery"
              eventName="welcome_gallery_click"
              className={internalLinkClass}
            >
              <span className="font-semibold leading-5">Photo gallery</span>
              <LinkArrow />
            </TrackLink>
            <TrackLink
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              eventName="welcome_instagram_click"
              className={externalLinkClass}
            >
              <span className="font-semibold leading-5">Instagram</span>
              <LinkArrow external />
            </TrackLink>
            <TrackLink
              href={INVOLVEMENT_CENTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              eventName="welcome_involvement_center_click"
              className={externalLinkClass}
            >
              <span className="font-semibold leading-5">UNLV registration</span>
              <LinkArrow external />
            </TrackLink>
          </nav>

          <WelcomeDisclaimer />
        </div>
      </section>
    </PublicShell>
  )
}
