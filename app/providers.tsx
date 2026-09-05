'use client'

import { Suspense } from 'react'
import { SiteAnalytics } from '@/components/analytics/site-analytics'
import { AuthNotices } from '@/components/auth/auth-notices'
import { PublicNavigationStateProvider } from '@/components/navigation/public-navigation-state'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

export function Providers({
  children,
  moreLinks,
}: {
  children: React.ReactNode
  moreLinks: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <PublicNavigationStateProvider moreLinks={moreLinks}>
        {children}
        <Toaster />
        <AuthNotices />
        <Suspense fallback={null}>
          <SiteAnalytics />
        </Suspense>
      </PublicNavigationStateProvider>
    </ThemeProvider>
  )
}
