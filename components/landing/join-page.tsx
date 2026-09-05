import {
  ArrowUpRight,
  Instagram,
  Landmark,
  MessageCircle,
  UserPlus,
} from 'lucide-react'
import { Suspense } from 'react'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { TrackLink } from '@/components/analytics/track-link'
import {
  JoinAccountOption,
  JoinAccountOptionSkeleton,
} from '@/components/landing/join-account-option'
import { PublicShell } from '@/components/landing/public-shell'
import {
  DISCORD_INVITE_URL,
  INSTAGRAM_URL,
  INVOLVEMENT_CENTER_URL,
} from '@/lib/constants'

const secondaryLinkClass =
  'group flex min-h-28 items-center gap-4 border border-[#211D18]/20 p-5 transition hover:bg-[#E9DDC3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211D18]'

export function JoinPage() {
  return (
    <PublicShell>
      <PageViewTracker eventName="join_view" />
      <section className="public-page-top px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-4xl">
          <TrackLink
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            eventName="join_discord_click"
            className="flex min-h-36 items-center justify-between gap-5 bg-[#211D18] p-6 text-[#FFECA2] sm:p-8"
          >
            <span>
              <span className="flex items-center gap-2 font-brand text-sm uppercase tracking-[0.18em] text-[#FFECA2]/70">
                <MessageCircle className="size-5" aria-hidden="true" />
                Join the open community
              </span>
              <h1 className="mt-3 font-brand text-4xl uppercase sm:text-5xl">
                Open Discord
              </h1>
              <span className="mt-2 block text-sm text-[#F8F1DF]/65">
                Open invites, announcements, and day-of coordination.
              </span>
            </span>
            <ArrowUpRight className="size-8 shrink-0" aria-hidden="true" />
          </TrackLink>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <TrackLink
              href="/membership-sign-up"
              eventName="join_membership_signup_click"
              className={secondaryLinkClass}
            >
              <UserPlus
                className="size-7 shrink-0 text-[#6A5146]"
                aria-hidden="true"
              />
              <span>
                <span className="block font-brand text-2xl uppercase">
                  Membership sign up
                </span>
                <span className="mt-1 block text-sm text-[#211D18]/65">
                  Create an account and submit the membership form.
                </span>
              </span>
            </TrackLink>
            <TrackLink
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              eventName="join_instagram_click"
              className={secondaryLinkClass}
            >
              <Instagram
                className="size-7 shrink-0 text-[#6A5146]"
                aria-hidden="true"
              />
              <span>
                <span className="block font-brand text-2xl uppercase">
                  Follow along
                </span>
                <span className="mt-1 block text-sm text-[#211D18]/65">
                  Photos and club updates on Instagram.
                </span>
              </span>
            </TrackLink>
            <TrackLink
              href={INVOLVEMENT_CENTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              eventName="join_involvement_center_click"
              className={secondaryLinkClass}
            >
              <Landmark
                className="size-7 shrink-0 text-[#6A5146]"
                aria-hidden="true"
              />
              <span>
                <span className="block font-brand text-2xl uppercase">
                  Register with UNLV
                </span>
                <span className="mt-1 block text-sm text-[#211D18]/65">
                  For current UNLV students.
                </span>
              </span>
            </TrackLink>
          </div>
          <Suspense fallback={<JoinAccountOptionSkeleton />}>
            <JoinAccountOption />
          </Suspense>
        </div>
      </section>
    </PublicShell>
  )
}
