import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { MembershipPage } from '@/components/membership/membership-page'
import { MembershipPageSkeleton } from '@/components/membership/membership-page-skeleton'
import { getViewer } from '@/lib/auth/viewer'
import { getMembershipAccount } from '@/lib/memberships/account'

export const metadata: Metadata = {
  title: 'Membership | UNLV Mountain Club',
  description:
    'Learn how to sign up, send $25 membership dues through Zelle, and receive confirmation from club leadership.',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#F8F1DF',
}

async function MembershipContent() {
  const viewer = await getViewer()
  const account = viewer.userId
    ? await getMembershipAccount(viewer.userId)
    : null
  return <MembershipPage viewer={viewer} account={account} />
}

export default function Page() {
  return (
    <Suspense fallback={<MembershipPageSkeleton />}>
      <MembershipContent />
    </Suspense>
  )
}
