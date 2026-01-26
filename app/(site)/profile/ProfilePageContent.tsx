import Link from 'next/link'
import { connection } from 'next/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProfileFormClient } from '@/components/profile/profile-form-client'
import { ProfilePageShell } from '@/components/profile/profile-page-shell'
import { fetchProfile } from '@/lib/profile/queries'
import { createClient } from '@/lib/supabase/server'

export async function ProfilePageContent() {
  connection()
  const supabase = await createClient()

  try {
    const result = await fetchProfile(supabase)

    return (
      <ProfilePageShell>
        {!result.userId ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign in to view and edit your profile.
              </p>
              <Link href="/auth/login">
                <Button className="rounded-xl">Sign in</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ProfileFormClient
            initialProfile={result.profile}
            userId={result.userId}
            email={result.email}
          />
        )}
      </ProfilePageShell>
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load profile'

    return (
      <ProfilePageShell>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-6 text-sm text-destructive">{message}</CardContent>
        </Card>
      </ProfilePageShell>
    )
  }
}
