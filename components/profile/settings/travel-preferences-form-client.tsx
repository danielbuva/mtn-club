'use client'

import { useEffect, useMemo, useState } from 'react'
import { TravelPreferencesSection } from '@/components/profile/sections/travel-preferences'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'
import { SettingsSaveBar } from '@/components/profile/settings/settings-save-bar'
import { profileRowToFormValues } from '@/lib/profile/mappers'
import { upsertProfile } from '@/lib/profile/queries'
import type {
  ProfileRow,
  ProfileUpdate,
  TravelProfile,
} from '@/lib/profile/types'
import { createClient } from '@/lib/supabase/client'

type TravelPreferencesFormClientProps = {
  initialProfile: ProfileRow | null
  userId: string
}

const isEqual = (a: TravelProfile, b: TravelProfile) =>
  JSON.stringify(a) === JSON.stringify(b)

export function TravelPreferencesFormClient({
  initialProfile,
  userId,
}: TravelPreferencesFormClientProps) {
  const initialValues = useMemo(
    () => profileRowToFormValues(initialProfile).travelProfile,
    [initialProfile],
  )
  const [values, setValues] = useState<TravelProfile>(initialValues)
  const [baseline, setBaseline] = useState<TravelProfile>(initialValues)
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

  const updateField = <K extends keyof TravelProfile>(
    key: K,
    value: TravelProfile[K],
  ) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const payload: ProfileUpdate = {
        travel_profile: values,
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
      <TravelPreferencesSection value={values} onChange={updateField} />
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
