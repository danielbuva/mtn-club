import { Suspense } from 'react'
import { ViewerGate } from '@/components/auth/viewer-gate'
import { ViewerFallback } from '@/components/auth/viewer-fallback'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ViewerFallback />}>
      <ViewerGate>
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </ViewerGate>
    </Suspense>
  )
}
