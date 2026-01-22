import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { HomePageClient } from '@/components/home/home-page-client'
import type { CalendarTrip } from '@/lib/events/types'

type HomePageProps = {
  trips: CalendarTrip[]
}

export function HomePage({ trips }: HomePageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <HomePageClient trips={trips} />
      <Footer />
    </div>
  )
}
