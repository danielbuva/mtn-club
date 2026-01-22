import { HomePage } from '@/components/home/home-page'
import { getHomeTripsCached } from '@/lib/events/cached'

export async function HomePageContent() {
  const trips = await getHomeTripsCached({ limit: 50 })
  return <HomePage trips={trips} />
}
