import { HomePage } from '@/components/home/home-page'
import { getViewer } from '@/lib/auth/viewer'
import { getHomeTripsForMember, getHomeTripsPublicCached } from '@/lib/home/queries'

export async function HomePageContent() {
  const viewer = await getViewer()
  try {
    const trips = viewer.isMember
      ? await getHomeTripsForMember({})
      : await getHomeTripsPublicCached({})
    return <HomePage trips={trips} viewer={viewer} />
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load trips'
    return <HomePage trips={[]} viewer={viewer} tripsError={message} />
  }
}
