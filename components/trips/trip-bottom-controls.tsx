'use client'

import type { ReactNode } from 'react'
import { BackButton } from '@/components/back-button'
import { PublicThumbNavigation } from '@/components/navigation/public-thumb-navigation'
import { ThumbNavigationBar } from '@/components/navigation/thumb-navigation'

export function TripBottomControls({
  children,
  fallbackHref = '/',
  showBack = true,
  showNavigation = true,
}: {
  children: ReactNode
  fallbackHref?: string
  showBack?: boolean
  showNavigation?: boolean
}) {
  return (
    <>
      {showNavigation ? <PublicThumbNavigation mobileOnly /> : null}
      <ThumbNavigationBar showTheme={false}>
        {showBack ? (
          <BackButton
            fallbackHref={fallbackHref}
            className="min-h-9 rounded-full px-4 py-2 text-xs text-foreground/70 whitespace-nowrap"
          />
        ) : null}
        <div className="flex min-h-9 items-center">{children}</div>
      </ThumbNavigationBar>
    </>
  )
}
