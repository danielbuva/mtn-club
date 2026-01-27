import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { ProfileFormClient } from '@/components/profile/profile-form-client'
import { ProfilePageShell } from '@/components/profile/profile-page-shell'
import { fetchProfile } from '@/lib/profile/queries'
import { createClient } from '@/lib/supabase/server'

export async function ProfilePageContent() {
  connection()
  const supabase = await createClient()

  try {
    const result = await fetchProfile(supabase)

    if (!result.userId) {
      redirect('/auth/login?redirect=/profile')
    }

    return (
      <ProfilePageShell>
        <ProfileFormClient
          initialProfile={result.profile}
          userId={result.userId}
          email={result.email}
        />
      </ProfilePageShell>
    )
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    if (typeof error === 'object' && error && 'digest' in error) {
      const digest = (error as { digest?: string }).digest
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        throw error
      }
    }
    const message = error instanceof Error ? error.message : 'Unable to load profile'

    return (
      <ProfilePageShell>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
          {message}
        </div>
      </ProfilePageShell>
    )
  }
}
