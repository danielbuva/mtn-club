import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { HomePageClient } from '@/components/home/home-page-client'
import { HomeCTASection } from '@/components/home/home-cta-section'
import type { CalendarTrip } from '@/lib/events/types'
import type { Viewer } from '@/lib/auth/viewer'

type HomePageProps = {
  trips: CalendarTrip[]
  viewer: Viewer
  tripsError?: string | null
}

export function HomePage({ trips, viewer, tripsError }: HomePageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HomePageClient
          trips={trips}
          tripsError={tripsError ?? null}
          showScrollIndicator={!viewer.isMember}
          scrollTargetId="home-cta"
        />
        {!viewer.isMember ? (
          <div className="min-h-screen flex flex-col">
            <HomeCTASection className="flex-1" />
            <Footer />
          </div>
        ) : null}
      </main>
      {viewer.isMember ? <Footer /> : null}
    </div>
  )
}
