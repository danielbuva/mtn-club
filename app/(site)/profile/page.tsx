import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { ProfilePageContent } from './ProfilePageContent'
import { ProfilePageFallback } from '@/components/profile/profile-page-fallback'
import { createClient } from '@/lib/supabase/server'

const getReturnPathFromHeaders = async () => {
  const headerStore = await headers()
  const referer = headerStore.get('referer')
  if (!referer) return null

  const host = headerStore.get('host')
  if (!host) return null

  const proto = headerStore.get('x-forwarded-proto') ?? 'http'
  const origin = `${proto}://${host}`

  try {
    const url = new URL(referer)
    if (url.origin !== origin) return null
    if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/profile')) {
      return null
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    const returnTo = await getReturnPathFromHeaders()
    const redirectParam = returnTo ? `?redirect=${encodeURIComponent(returnTo)}` : '?redirect=/'
    redirect(`/auth/login${redirectParam}`)
  }

  return (
    <Suspense fallback={<ProfilePageFallback />}>
      <ProfilePageContent />
    </Suspense>
  )
}
