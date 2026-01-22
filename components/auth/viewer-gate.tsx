import type { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { ViewerProvider } from '@/components/auth/viewer-provider'
import { getViewer } from '@/lib/auth/viewer'

type ViewerGateProps = {
  children: ReactNode
}

export async function ViewerGate({ children }: ViewerGateProps) {
  const viewer = await getViewer()

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ViewerProvider viewer={viewer}>{children}</ViewerProvider>
    </ThemeProvider>
  )
}
