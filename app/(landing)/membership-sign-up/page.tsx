import type { Metadata, Viewport } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { MembershipSignUpForm } from '@/components/membership/membership-sign-up-form'
import { MembershipSignUpSkeleton } from '@/components/membership/membership-sign-up-skeleton'
import { authHref } from '@/lib/auth/return-to'
import { getViewer } from '@/lib/auth/viewer'
import { getMembershipAccount } from '@/lib/memberships/account'

export const metadata: Metadata = {
  title: 'Membership Sign Up | UNLV Mountain Club',
  description:
    'Create a UNLV Mountain Club account and submit the membership form.',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#F8F1DF',
}

async function MembershipSignUpContent() {
  const viewer = await getViewer()
  if (!viewer.userId) redirect(authHref('/auth/sign-up', '/membership-sign-up'))
  const account = await getMembershipAccount(viewer.userId)
  if (account.application || account.accessActive) redirect('/membership')
  return <MembershipSignUpForm email={viewer.email ?? ''} />
}

export default function Page() {
  return (
    <Suspense fallback={<MembershipSignUpSkeleton />}>
      <MembershipSignUpContent />
    </Suspense>
  )
}
