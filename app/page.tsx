import { Suspense } from 'react'
import { HomePageFallback } from '@/components/home/home-page-fallback'
import { HomeDataBoundary } from '@/app/HomeDataBoundary'

export default function Page() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomeDataBoundary />
    </Suspense>
  )
}
