import { Suspense } from 'react'
import { ViewerFallback } from '@/components/auth/viewer-fallback'
import { ViewerGate } from '@/components/auth/viewer-gate'
import { Footer } from '@/components/footer'
import { PublicThumbNavigation } from '@/components/navigation/public-thumb-navigation'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<ViewerFallback />}>
      <ViewerGate>
        <div data-editorial-surface className="min-h-screen flex flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
          <PublicThumbNavigation />
        </div>
      </ViewerGate>
    </Suspense>
  )
}
