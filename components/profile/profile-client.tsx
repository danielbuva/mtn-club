'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { upsertProfile } from '@/lib/profile/queries'
import { profileFormToUpdate } from '@/lib/profile/mappers'
import type { ProfileFormValues, ProfileRow } from '@/lib/profile/types'
import { ProfileForm } from '@/components/profile/profile-form'

export type ProfileClientProps = {
  initialProfile: ProfileRow | null
  userId: string | null
  email: string | null
  initialError: string | null
}

export function ProfileClient({
  initialProfile,
  userId,
  email,
  initialError,
}: ProfileClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<ProfileRow | null>(initialProfile)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = async (values: ProfileFormValues) => {
    if (!userId) {
      throw new Error('Sign in to save your profile.')
    }
    setSaveError(null)
    setIsSaving(true)
    try {
      const update = profileFormToUpdate(values)
      const updated = await upsertProfile(supabase, userId, update)
      setProfile(updated)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to save profile'
      setSaveError(message)
      throw new Error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-16">
        <section className="py-12 px-4 bg-secondary/30 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Your Profile</h1>
            <p className="text-muted-foreground">Update your member details and preferences.</p>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            {initialError && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="p-6 text-sm text-destructive">{initialError}</CardContent>
              </Card>
            )}

            {!initialError && !userId && (
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
            )}

            {!initialError && userId && (
              <ProfileForm
                initialProfile={profile}
                email={email}
                onSave={handleSave}
                isSaving={isSaving}
                saveError={saveError}
              />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
