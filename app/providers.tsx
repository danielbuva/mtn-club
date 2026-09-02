'use client'

import { Analytics } from '@vercel/analytics/react'
import { PublicNavigationStateProvider } from '@/components/navigation/public-navigation-state'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

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
        <Analytics />
      </PublicNavigationStateProvider>
    </ThemeProvider>
  )
}
