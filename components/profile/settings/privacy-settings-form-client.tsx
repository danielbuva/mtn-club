'use client'

import { useEffect, useState } from 'react'
import { SettingsCard } from '@/components/profile/settings/settings-card'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'
import { SettingsSaveBar } from '@/components/profile/settings/settings-save-bar'
import { Switch } from '@/components/ui/switch'
import { savePrivacyEmailPreferences } from '@/lib/profile/email-preference-actions'
import type { EmailPreferences } from '@/lib/profile/email-preferences'
import { profileRowToFormValues } from '@/lib/profile/mappers'
import type { PrivacySettings, ProfileRow } from '@/lib/profile/types'
import { EmailPreferencesFields } from './email-preferences-fields'

type PrivacySettingsFormClientProps = {
  initialProfile: ProfileRow | null
  initialEmail: EmailPreferences
}

const isEqual = (a: PrivacySettings, b: PrivacySettings) =>
  JSON.stringify(a) === JSON.stringify(b)

export function PrivacySettingsFormClient({
  initialProfile,
  initialEmail,
}: PrivacySettingsFormClientProps) {
  const [baseline, setBaseline] = useState<PrivacySettings>(
    () => profileRowToFormValues(initialProfile).privacySettings,
  )
  const [values, setValues] = useState<PrivacySettings>(baseline)
  const [emailValues, setEmailValues] = useState(initialEmail)
  const [emailBaseline, setEmailBaseline] = useState(initialEmail)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { setIsDirty } = useSettingsDirty()

  useEffect(() => {
    const next = profileRowToFormValues(initialProfile).privacySettings
    setValues(next)
    setBaseline(next)
    setEmailValues(initialEmail)
    setEmailBaseline(initialEmail)
  }, [initialProfile, initialEmail])

  const isDirty =
    !isEqual(values, baseline) ||
    JSON.stringify(emailValues) !== JSON.stringify(emailBaseline)

  useEffect(() => {
    setIsDirty(isDirty)
  }, [isDirty, setIsDirty])

  const updateField = (key: keyof PrivacySettings, value: boolean) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const result = await savePrivacyEmailPreferences({
        privacy: values,
        preferences: emailValues,
        expected: emailBaseline,
      })
      if (!result.ok) throw new Error(result.message)
      setEmailValues(result.preferences)
      setEmailBaseline(result.preferences)
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
    setEmailValues(emailBaseline)
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
              aria-label="Show profile in directory"
              disabled={isSaving}
              checked={values.profileVisible}
              onCheckedChange={checked =>
                updateField('profileVisible', checked)
              }
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
              aria-label="Share email"
              disabled={isSaving}
              checked={values.shareEmail}
              onCheckedChange={checked => updateField('shareEmail', checked)}
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
              aria-label="Share phone number"
              disabled={isSaving}
              checked={values.sharePhone}
              onCheckedChange={checked => updateField('sharePhone', checked)}
            />
          </div>
        </div>
      </SettingsCard>

      <EmailPreferencesFields
        value={emailValues}
        onChange={setEmailValues}
        disabled={isSaving}
      />
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
              aria-label="Share gear availability"
              disabled={isSaving}
              checked={values.shareGear}
              onCheckedChange={checked => updateField('shareGear', checked)}
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
              aria-label="Share carpooling info"
              disabled={isSaving}
              checked={values.shareCarpooling}
              onCheckedChange={checked =>
                updateField('shareCarpooling', checked)
              }
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
              aria-label="Share car details"
              disabled={isSaving}
              checked={values.shareCarInfo}
              onCheckedChange={checked => updateField('shareCarInfo', checked)}
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
              aria-label="Share approximate area"
              disabled={isSaving}
              checked={values.shareNeighborhood}
              onCheckedChange={checked =>
                updateField('shareNeighborhood', checked)
              }
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
