import { ProfileClient } from '@/components/profile/profile-client'
import { fetchProfile } from '@/lib/profile/queries'
import { createClient } from '@/lib/supabase/server'
import { connection } from 'next/server'

export async function ProfileDataBoundary() {
  connection()
  const supabase = await createClient()

  try {
    const result = await fetchProfile(supabase)
    return (
      <ProfileClient
        initialProfile={result.profile}
        userId={result.userId}
        email={result.email}
        initialError={null}
      />
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load profile'
    return (
      <ProfileClient
        initialProfile={null}
        userId={null}
        email={null}
        initialError={message}
      />
    )
  }
}
