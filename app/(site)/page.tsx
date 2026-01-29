import { Suspense } from 'react'
import { HomeBasicMap } from '@/components/home/home-basic'
import { HomeCTASection } from '@/components/home/home-cta-section'
import { getViewer } from '@/lib/auth/viewer'

async function HomePageData() {
  const viewer = await getViewer()
  const showGuestCta = !viewer.isAuthenticated

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HomeBasicMap showScrollIndicator={showGuestCta} scrollTargetId="home-cta" />
      {showGuestCta ? <HomeCTASection className="flex-1" /> : null}
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomePageData />
    </Suspense>
  )
}
