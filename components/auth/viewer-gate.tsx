import type { ReactNode } from 'react'
import { ViewerProvider } from '@/components/auth/viewer-provider'
import { getViewer } from '@/lib/auth/viewer'

type ViewerGateProps = {
  children: ReactNode
}

export async function ViewerGate({ children }: ViewerGateProps) {
  const viewer = await getViewer()

  return <ViewerProvider viewer={viewer}>{children}</ViewerProvider>
}
