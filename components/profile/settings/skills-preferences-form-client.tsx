'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ProfileRow, ProfileUpdate, SkillsCerts } from '@/lib/profile/types'
import { profileRowToFormValues } from '@/lib/profile/mappers'
import { createClient } from '@/lib/supabase/client'
import { SkillsCertsSection } from '@/components/profile/sections/skills-certs'
import { SettingsSaveBar } from '@/components/profile/settings/settings-save-bar'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'
import { upsertProfile } from '@/lib/profile/queries'

type SkillsPreferencesFormClientProps = {
  initialProfile: ProfileRow | null
  userId: string
}

const isEqual = (a: SkillsCerts, b: SkillsCerts) => JSON.stringify(a) === JSON.stringify(b)

export function SkillsPreferencesFormClient({
  initialProfile,
  userId,
}: SkillsPreferencesFormClientProps) {
  const initialValues = useMemo(
    () => profileRowToFormValues(initialProfile).skillsCerts,
    [initialProfile]
  )
  const [values, setValues] = useState<SkillsCerts>(initialValues)
  const [baseline, setBaseline] = useState<SkillsCerts>(initialValues)
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

  const updateField = <K extends keyof SkillsCerts>(key: K, value: SkillsCerts[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const payload: ProfileUpdate = {
        skills_certs: values,
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
      <SkillsCertsSection value={values} onChange={updateField} />
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
