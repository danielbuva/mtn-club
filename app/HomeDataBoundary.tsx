import { HomePage } from '@/components/home/home-page'
import { getPastTrips } from '@/lib/events/server'

export async function HomeDataBoundary() {
  const trips = await getPastTrips({ limit: 50 })
  return <HomePage trips={trips} />
}
