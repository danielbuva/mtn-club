import type { ReactNode } from 'react'
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
      <main>{children}</main>
      {showFooter ? (
        <footer className="bg-[#211D18] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-[#F8F1DF]">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-brand text-xl uppercase tracking-wide">
              UNLV Mountain Club
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#F8F1DF]/75">
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
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
          <ClubDisclaimer id={disclaimerId} />
        </footer>
      ) : null}
      <PublicThumbNavigation />
    </div>
  )
}
