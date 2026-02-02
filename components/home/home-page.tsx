import { HomeCTASection } from '@/components/home/home-cta-section'
import { HomePageClient } from '@/components/home/home-page-client'
import type { Viewer } from '@/lib/auth/viewer'
import type { CalendarTrip } from '@/lib/events/types'

type HomePageProps = {
  trips: CalendarTrip[]
  viewer: Viewer
  tripsError?: string | null
}

export function HomePage({ trips, viewer, tripsError }: HomePageProps) {
  return (
    <div className="min-h-screen flex flex-col">
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
          </div>
        ) : null}
      </main>
    </div>
  )
}
