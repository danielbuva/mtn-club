import Link from 'next/link'
import { type ReactNode, Suspense } from 'react'
import './cover-layout.css'
import { CoverEditionCard } from '@/components/home/cover-edition-card'
import { coverFrameStyle } from '@/components/home/cover-frame'
import { HomeCoverClient } from '@/components/home/HomeCoverClient'
import { MoreNavigation } from '@/components/navigation/more-navigation'
import UNLVMountainClub from '@/components/unlv-mountain-club'
import { getCoverEditionsCached } from '@/lib/editorial/cover-editions'

const primaryLinkClass =
  'block text-lg sm:text-2xl md:text-3xl font-medium tracking-wide text-[#FFECA2] motion-safe:transition [text-shadow:0_1px_8px_rgba(0,0,0,0.35)] active:translate-x-0.5 active:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFECA2]'
const secondaryLinkClass =
  'block text-lg sm:text-2xl md:text-3xl font-medium tracking-wide text-[#FFF4C9] motion-safe:transition [text-shadow:0_1px_8px_rgba(0,0,0,0.35)] active:translate-x-0.5 active:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFECA2]'

export function HomeCoverNavigation({
  isAuthenticated,
  isAdmin,
}: {
  isAuthenticated: boolean
  isAdmin: boolean
}) {
  if (!isAuthenticated) {
    return (
      <>
        <Link href="/welcome" className={primaryLinkClass}>
          Welcome →
        </Link>
        <Link href="/auth/login" className={secondaryLinkClass}>
          Log in →
        </Link>
      </>
    )
  }

  const authenticatedLinks = [
    {
      href: isAdmin ? '/admin' : '/welcome',
      label: isAdmin ? 'Dashboard' : 'Club Info',
      primary: true,
    },
    { href: '/schedule', label: 'Schedule', primary: false },
    { href: '/gallery', label: 'Photos', primary: false },
  ]

  return (
    <>
      {authenticatedLinks.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={link.primary ? primaryLinkClass : secondaryLinkClass}
        >
          {link.label} →
        </Link>
      ))}
      <MoreNavigation
        label="Explore →"
        className={`${secondaryLinkClass} ml-auto text-right focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFECA2]`}
      />
    </>
  )
}

export default function HomeCover({
  navigation,
  announcement,
  initialIndex = 0,
}: {
  navigation: ReactNode
  announcement?: ReactNode
  initialIndex?: number
}) {
  const transitionDurationMs = 500

  return (
    <div className="home-cover relative min-h-svh bg-[#211D18] text-[#F8F1DF] overflow-hidden select-none [--frame-padding:16px] md:[--frame-padding:24px]">
      <div className="absolute inset-0 bg-[#211D18]" />
      <HomeCoverClient
        transitionDurationMs={transitionDurationMs}
        initialIndex={initialIndex}
      />
      <Suspense fallback={null}>
        <HomeEditionCard />
      </Suspense>
      {announcement}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/20 via-black/30 to-black/55" />

      <div
        className="pointer-events-none absolute z-20"
        style={coverFrameStyle}
      >
        <div className="pointer-events-none absolute inset-0 border border-[#FEF1D0] opacity-60" />
        <div className="pointer-events-none absolute left-0 bottom-1 text-[10px] tracking-[0.2em] font-medium text-[#FEF1D0] opacity-40 [writing-mode:vertical-rl] rotate-180">
          Founded 2020
        </div>
      </div>

      <div
        className="pointer-events-none absolute z-30"
        style={coverFrameStyle}
      >
        <div
          data-home-wordmark
          className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-[56%] -translate-y-1/2 w-[min(86vw,320px)] sm:w-[min(86vw,360px)] md:w-[min(520px,40vw)] lg:top-6 lg:left-6 lg:translate-x-0 lg:translate-y-0 lg:w-[min(520px,40vw)]"
        >
          <span className="sr-only">UNLV Mountain Club</span>
          <UNLVMountainClub viewBox="0 0 355 196" className="h-auto w-full" />
        </div>

        <div className="pointer-events-auto absolute right-1 bottom-5 md:right-6 md:bottom-6 font-brand select-auto">
          <div className="relative text-right">
            <nav
              data-homecover-nav
              aria-label="Primary"
              className="relative space-y-3 sm:space-y-3 py-1"
            >
              {navigation}
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}

async function HomeEditionCard() {
  const { editions } = await getCoverEditionsCached()
  const edition = editions[0]
  return edition ? (
    <div className="pointer-events-none absolute z-30" style={coverFrameStyle}>
      <CoverEditionCard cover={edition} />
    </div>
  ) : null
}
