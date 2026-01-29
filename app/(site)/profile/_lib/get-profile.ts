import { cache } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchProfile } from '@/lib/profile/queries'

export const getProfileOrRedirect = cache(async () => {
  connection()
  const supabase = await createClient()
  const result = await fetchProfile(supabase)

  if (!result.userId) {
    redirect('/auth/login?redirect=/profile/user/account')
  }

  return result
})
