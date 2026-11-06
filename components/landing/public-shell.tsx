import Link from 'next/link'
import type { ReactNode } from 'react'
import { ClubBadge } from '@/components/brand/club-badge'
import { ClubDisclaimer } from '@/components/landing/club-disclaimer'
import { PublicThumbNavigation } from '@/components/navigation/public-thumb-navigation'
import {
  CLUB_EMAIL,
  DISCORD_INVITE_URL,
  INSTAGRAM_URL,
  INVOLVEMENT_CENTER_URL,
} from '@/lib/constants'

export function PublicShell({
  children,
  disclaimerId,
  overscrollTone = 'paper',
  showFooter = true,
}: {
  children: ReactNode
  disclaimerId?: string
  overscrollTone?: 'paper' | 'inverse'
  showFooter?: boolean
}) {
  return (
    <div
      data-public-shell
      data-editorial-surface
      data-overscroll-tone={overscrollTone}
      className="min-h-svh bg-[#F8F1DF] text-[#211D18]"
    >
      <PublicThumbNavigation />
      <main>{children}</main>
      {showFooter ? (
        <footer className="bg-[#211D18] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-[#F8F1DF] md:pb-0">
          <div className="px-5 py-8">
            <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Smaller on md+, where the navbar badge may share the screen. */}
              <Link
                href="/"
                aria-label="UNLV Mountain Club home"
                className="-m-1 inline-flex p-1 outline-none focus-visible:ring-2 focus-visible:ring-[#FFECA2]"
              >
                <ClubBadge className="h-14 w-auto md:h-10" />
              </Link>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#F8F1DF]/75">
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discord
                </a>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
                <a
                  href={INVOLVEMENT_CENTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Involvement Center
                </a>
                <a href={`mailto:${CLUB_EMAIL}`}>{CLUB_EMAIL}</a>
              </div>
            </div>
          </div>
          <ClubDisclaimer id={disclaimerId} />
        </footer>
      ) : null}
    </div>
  )
}
