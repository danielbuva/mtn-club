'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { upsertProfile } from '@/lib/profile/queries'
import { profileFormToUpdate } from '@/lib/profile/mappers'
import type { ProfileFormValues, ProfileRow } from '@/lib/profile/types'
import { ProfileForm } from '@/components/profile/profile-form'

type ProfileFormClientProps = {
  initialProfile: ProfileRow | null
  userId: string
  email: string | null
}

export function ProfileFormClient({ initialProfile, userId, email }: ProfileFormClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<ProfileRow | null>(initialProfile)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = async (values: ProfileFormValues) => {
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
    <ProfileForm
      initialProfile={profile}
      email={email}
      onSave={handleSave}
      isSaving={isSaving}
      saveError={saveError}
    />
  )
}
