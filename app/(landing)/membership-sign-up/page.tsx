import type { Metadata, Viewport } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { MembershipSignUpForm } from '@/components/membership/membership-sign-up-form'
import { MembershipSignUpSkeleton } from '@/components/membership/membership-sign-up-skeleton'
import { getViewer } from '@/lib/auth/viewer'

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
  if (viewer.isAuthenticated) {
    redirect('/membership')
  }

  return <MembershipSignUpForm />
}

export default function Page() {
  return (
    <Suspense fallback={<MembershipSignUpSkeleton />}>
      <MembershipSignUpContent />
    </Suspense>
  )
}
