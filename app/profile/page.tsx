import { Suspense } from 'react'
import { ProfilePageContent } from '@/app/profile/ProfilePageContent'
import { ProfilePageFallback } from '@/components/profile/profile-page-fallback'

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageFallback />}>
      <ProfilePageContent />
    </Suspense>
  )
}
