'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ProfileRow, PrivacySettings, ProfileUpdate } from '@/lib/profile/types'
import { profileRowToFormValues } from '@/lib/profile/mappers'
import { createClient } from '@/lib/supabase/client'
import { Switch } from '@/components/ui/switch'
import { SettingsCard } from '@/components/profile/settings/settings-card'
import { SettingsSaveBar } from '@/components/profile/settings/settings-save-bar'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'
import { upsertProfile } from '@/lib/profile/queries'

type PrivacySettingsFormClientProps = {
  initialProfile: ProfileRow | null
  userId: string
}

const isEqual = (a: PrivacySettings, b: PrivacySettings) =>
  JSON.stringify(a) === JSON.stringify(b)

export function PrivacySettingsFormClient({
  initialProfile,
  userId,
}: PrivacySettingsFormClientProps) {
  const initialValues = useMemo(
    () => profileRowToFormValues(initialProfile).privacySettings,
    [initialProfile]
  )
  const [values, setValues] = useState<PrivacySettings>(initialValues)
  const [baseline, setBaseline] = useState<PrivacySettings>(initialValues)
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

  const updateField = (key: keyof PrivacySettings, value: boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const payload: ProfileUpdate = {
        privacy_settings: values,
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
      <SettingsCard
        title="Data & privacy"
        description="Control what information can be shared with other members."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Show profile in directory</p>
              <p className="text-xs text-muted-foreground">
                Allow members to find you by name and avatar.
              </p>
            </div>
            <Switch
              checked={values.profileVisible}
              onCheckedChange={(checked) => updateField('profileVisible', checked)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Share email</p>
              <p className="text-xs text-muted-foreground">
                Show your email to trip leaders when you RSVP.
              </p>
            </div>
            <Switch
              checked={values.shareEmail}
              onCheckedChange={(checked) => updateField('shareEmail', checked)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Share phone number</p>
              <p className="text-xs text-muted-foreground">
                Let leaders text you about schedule changes.
              </p>
            </div>
            <Switch
              checked={values.sharePhone}
              onCheckedChange={(checked) => updateField('sharePhone', checked)}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Community sharing"
        description="These options power ride sharing and gear swaps."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Share gear availability</p>
              <p className="text-xs text-muted-foreground">
                Let members know what gear you can lend.
              </p>
            </div>
            <Switch
              checked={values.shareGear}
              onCheckedChange={(checked) => updateField('shareGear', checked)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Share carpooling info</p>
              <p className="text-xs text-muted-foreground">
                Enable others to request a ride when you are driving.
              </p>
            </div>
            <Switch
              checked={values.shareCarpooling}
              onCheckedChange={(checked) => updateField('shareCarpooling', checked)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Share car details</p>
              <p className="text-xs text-muted-foreground">
                Include your vehicle type and available seats.
              </p>
            </div>
            <Switch
              checked={values.shareCarInfo}
              onCheckedChange={(checked) => updateField('shareCarInfo', checked)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Share approximate area</p>
              <p className="text-xs text-muted-foreground">
                Display your general neighborhood for meetup planning.
              </p>
            </div>
            <Switch
              checked={values.shareNeighborhood}
              onCheckedChange={(checked) => updateField('shareNeighborhood', checked)}
            />
          </div>
        </div>
      </SettingsCard>

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
