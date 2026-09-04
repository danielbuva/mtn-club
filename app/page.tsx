import { Suspense } from 'react'
import HomeCover, { HomeCoverNavigation } from '@/components/home/HomeCover'
import { getViewer } from '@/lib/auth/viewer'

async function ViewerHomeCoverNavigation() {
  const viewer = await getViewer()
  return (
    <HomeCoverNavigation
      isAuthenticated={viewer.isAuthenticated}
      isAdmin={viewer.isAdmin}
    />
  )
}

export default function HomePage() {
  return (
    <HomeCover
      navigation={
        <Suspense fallback={null}>
          <ViewerHomeCoverNavigation />
        </Suspense>
      }
    />
  )
}
