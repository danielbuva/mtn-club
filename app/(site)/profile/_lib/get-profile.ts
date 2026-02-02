import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'
import { fetchProfile } from '@/lib/profile/queries'
import { createClient } from '@/lib/supabase/server'

export const getProfileOrRedirect = cache(async () => {
  connection()
  const supabase = await createClient()
  const result = await fetchProfile(supabase)

  if (!result.userId) {
    redirect('/auth/login?redirect=/profile/user/account')
  }

  return { ...result, userId: result.userId }
})
