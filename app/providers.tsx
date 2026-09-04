'use client'

import { Analytics } from '@vercel/analytics/react'
import { AuthNotices } from '@/components/auth/auth-notices'
import { PublicNavigationStateProvider } from '@/components/navigation/public-navigation-state'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { isAuthSensitiveUrl } from '@/lib/auth/analytics'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <PublicNavigationStateProvider>
        {children}
        <Toaster />
        <AuthNotices />
        <Analytics
          beforeSend={event => (isAuthSensitiveUrl(event.url) ? null : event)}
        />
      </PublicNavigationStateProvider>
    </ThemeProvider>
  )
}
