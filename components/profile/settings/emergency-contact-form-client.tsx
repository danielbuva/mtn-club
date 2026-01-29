'use client'

import { useEffect, useMemo, useState } from 'react'
import type { EmergencyContact, ProfileRow, ProfileUpdate } from '@/lib/profile/types'
import { profileRowToFormValues } from '@/lib/profile/mappers'
import { createClient } from '@/lib/supabase/client'
import { EmergencyContactSection } from '@/components/profile/sections/emergency-contact'
import { SettingsSaveBar } from '@/components/profile/settings/settings-save-bar'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'
import { upsertProfile } from '@/lib/profile/queries'

type EmergencyContactFormClientProps = {
  initialProfile: ProfileRow | null
  userId: string
}

const isEqual = (a: EmergencyContact, b: EmergencyContact) => JSON.stringify(a) === JSON.stringify(b)

export function EmergencyContactFormClient({
  initialProfile,
  userId,
}: EmergencyContactFormClientProps) {
  const initialValues = useMemo(
    () => profileRowToFormValues(initialProfile).emergencyContact,
    [initialProfile]
  )
  const [values, setValues] = useState<EmergencyContact>(initialValues)
  const [baseline, setBaseline] = useState<EmergencyContact>(initialValues)
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

  const updateField = <K extends keyof EmergencyContact>(
    key: K,
    value: EmergencyContact[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const payload: ProfileUpdate = {
        emergency_contact: values,
        updated_at: new Date().toISOString(),
      }
      const supabase = createClient()
      await upsertProfile(supabase, userId, payload)
      setBaseline(values)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save changes')
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
      <EmergencyContactSection value={values} onChange={updateField} />
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
