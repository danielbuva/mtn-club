import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AuthMessageSkeleton } from '@/components/auth/auth-message-skeleton'
import { AuthShell } from '@/components/auth/auth-shell'
import {
  type AuthSearchParams,
  authHref,
  getReturnToFromSearchParams,
  readAuthSearchParams,
} from '@/lib/auth/return-to'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Continue to your account | UNLV Mountain Club',
}

async function Destination({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  const returnTo =
    getReturnToFromSearchParams(readAuthSearchParams(await searchParams)) ?? '/'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  redirect(user ? returnTo : authHref('/auth/login', returnTo))
}
export default function Page({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  return (
    <AuthShell title="Almost there." description="Getting your account ready.">
      <Suspense fallback={<AuthMessageSkeleton />}>
        <Destination searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  )
}
