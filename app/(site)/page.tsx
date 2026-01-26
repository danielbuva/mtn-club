import { Suspense } from 'react'
import { HomePageFallback } from '@/components/home/home-page-fallback'
import { HomePageContent } from '@/app/HomePageContent'

export default function Page() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePageContent />
    </Suspense>
  )
}
