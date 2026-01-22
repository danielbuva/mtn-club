import { Suspense } from 'react'
import { ProfileDataBoundary } from '@/app/profile/ProfileDataBoundary'
import { ProfileSkeleton } from '@/components/profile/profile-skeleton'

export default function Profile() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileDataBoundary />
    </Suspense>
  )
}
