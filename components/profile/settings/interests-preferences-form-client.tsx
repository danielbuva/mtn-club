'use client'

import { useEffect, useMemo, useState } from 'react'
import { InterestsPreferencesSection } from '@/components/profile/sections/interests-preferences'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'
import { SettingsSaveBar } from '@/components/profile/settings/settings-save-bar'
import { profileRowToFormValues } from '@/lib/profile/mappers'
import { upsertProfile } from '@/lib/profile/queries'
import type {
  InterestsPreferences,
  ProfileRow,
  ProfileUpdate,
} from '@/lib/profile/types'
import { createClient } from '@/lib/supabase/client'

type InterestsPreferencesFormClientProps = {
  initialProfile: ProfileRow | null
  userId: string
}

const isEqual = (a: InterestsPreferences, b: InterestsPreferences) =>
  JSON.stringify(a) === JSON.stringify(b)

export function InterestsPreferencesFormClient({
  initialProfile,
  userId,
}: InterestsPreferencesFormClientProps) {
  const initialValues = useMemo(
    () => profileRowToFormValues(initialProfile).interestsPreferences,
    [initialProfile],
  )
  const [values, setValues] = useState<InterestsPreferences>(initialValues)
  const [baseline, setBaseline] = useState<InterestsPreferences>(initialValues)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { setIsDirty } = useSettingsDirty()

  useEffect(() => {
    setValues(initialValues)
    setBaseline(initialValues)
  }, [initialValues])

  const isDirty = !isEqual(values, baseline)

  useEffect(() => {
    setIsDirty(isDirty)
  }, [isDirty, setIsDirty])

  const updateField = <K extends keyof InterestsPreferences>(
    key: K,
    value: InterestsPreferences[K],
  ) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const payload: ProfileUpdate = {
        interests_preferences: values,
        updated_at: new Date().toISOString(),
      }
      const supabase = createClient()
      await upsertProfile(supabase, userId, payload)
      setBaseline(values)
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Unable to save changes',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setValues(baseline)
    setSaveError(null)
  }

  return (
    <div className="space-y-6">
      <InterestsPreferencesSection value={values} onChange={updateField} />
      <SettingsSaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        saveError={saveError}
        onSave={handleSave}
        onReset={handleReset}
      />
    </div>
  )
}
