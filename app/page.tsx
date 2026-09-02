import { Suspense } from 'react'
import HomeCover, {
  HomeCoverNavigation,
  HomeCoverNavigationSkeleton,
} from '@/components/home/HomeCover'
import { getViewer } from '@/lib/auth/viewer'

async function ViewerHomeCoverNavigation() {
  const viewer = await getViewer()
  return <HomeCoverNavigation isAuthenticated={viewer.isAuthenticated} />
}

export default function HomePage() {
  return (
    <HomeCover
      navigation={
        <Suspense fallback={<HomeCoverNavigationSkeleton />}>
          <ViewerHomeCoverNavigation />
        </Suspense>
      }
    />
  )
}
