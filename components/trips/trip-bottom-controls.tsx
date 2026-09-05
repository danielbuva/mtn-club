'use client'

import type { ReactNode } from 'react'
import { BackButton } from '@/components/back-button'
import { PublicThumbNavigation } from '@/components/navigation/public-thumb-navigation'
import { ThumbNavigationBar } from '@/components/navigation/thumb-navigation'

export function TripBottomControls({
  children,
  fallbackHref = '/',
}: {
  children: ReactNode
  fallbackHref?: string
}) {
  return (
    <>
      <PublicThumbNavigation mobileOnly />
      <ThumbNavigationBar showTheme={false}>
        <BackButton
          fallbackHref={fallbackHref}
          className="min-h-9 rounded-full px-4 py-2 text-xs text-foreground/70 whitespace-nowrap"
        />
        {children}
      </ThumbNavigationBar>
    </>
  )
}
