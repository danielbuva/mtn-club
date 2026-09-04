import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { ProfilePageFallback } from '@/components/profile/profile-page-fallback'
import { authHref, sanitizeReturnTo } from '@/lib/auth/return-to'
import { createClient } from '@/lib/supabase/server'

async function ProfileSession({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    const requestHeaders = await headers()
    const returnTo =
      sanitizeReturnTo(requestHeaders.get('x-auth-return-to')) ?? '/profile'
    redirect(authHref('/auth/login', returnTo))
  }
  return children
}
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<ProfilePageFallback />}>
      <ProfileSession>{children}</ProfileSession>
    </Suspense>
  )
}
