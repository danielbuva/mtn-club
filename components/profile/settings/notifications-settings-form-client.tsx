'use client'

import { useEffect, useMemo, useState } from 'react'
import { SettingsCard } from '@/components/profile/settings/settings-card'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'
import { SettingsSaveBar } from '@/components/profile/settings/settings-save-bar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { profileRowToFormValues } from '@/lib/profile/mappers'
import { upsertProfile } from '@/lib/profile/queries'
import type {
  NotificationSettings,
  ProfileRow,
  ProfileUpdate,
} from '@/lib/profile/types'
import { createClient } from '@/lib/supabase/client'

type NotificationsSettingsFormClientProps = {
  initialProfile: ProfileRow | null
  userId: string
  email: string | null
  initialMailingListSubscribed: boolean
}

const isEqual = (a: NotificationSettings, b: NotificationSettings) =>
  JSON.stringify(a) === JSON.stringify(b)

export function NotificationsSettingsFormClient({
  initialProfile,
  userId,
  email,
  initialMailingListSubscribed,
}: NotificationsSettingsFormClientProps) {
  const initialValues = useMemo(
    () => profileRowToFormValues(initialProfile).notificationSettings,
    [initialProfile],
  )
  const [values, setValues] = useState<NotificationSettings>(initialValues)
  const [baseline, setBaseline] = useState<NotificationSettings>(initialValues)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [mailingListSubscribed, setMailingListSubscribed] = useState(
    initialMailingListSubscribed,
  )
  const [mailingListBaseline, setMailingListBaseline] = useState(
    initialMailingListSubscribed,
  )
  const { setIsDirty } = useSettingsDirty()

  useEffect(() => {
    setValues(initialValues)
    setBaseline(initialValues)
  }, [initialValues])

  const isDirty =
    !isEqual(values, baseline) || mailingListSubscribed !== mailingListBaseline

  useEffect(() => {
    setIsDirty(isDirty)
  }, [isDirty, setIsDirty])

  const updateField = (
    key: keyof NotificationSettings,
    value: NotificationSettings[keyof NotificationSettings],
  ) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const payload: ProfileUpdate = {
        notification_settings: values,
        updated_at: new Date().toISOString(),
      }
      const supabase = createClient()
      const mailingPromise =
        mailingListSubscribed !== mailingListBaseline
          ? supabase.rpc('set_mailing_list_subscription', {
              p_email: email ?? '',
              p_subscribed: mailingListSubscribed,
              p_source: 'account_settings',
            })
          : Promise.resolve({ error: null })
      const [, mailingResult] = await Promise.all([
        upsertProfile(supabase, userId, payload),
        mailingPromise,
      ])
      if (mailingResult.error) throw mailingResult.error
      setBaseline(values)
      setMailingListBaseline(mailingListSubscribed)
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
    setMailingListSubscribed(mailingListBaseline)
    setSaveError(null)
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Email newsletters"
        description="Pick the types of emails you want from the club."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium">Club mailing list</p>
              <p className="text-xs text-muted-foreground">
                Optional club news and trip announcements. You can unsubscribe
                at any time.
              </p>
            </div>
            <Switch
              checked={mailingListSubscribed}
              disabled={!email}
              onCheckedChange={setMailingListSubscribed}
              aria-label="Join the club mailing list"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Trip updates</p>
              <p className="text-xs text-muted-foreground">
                New trips and schedule changes.
              </p>
            </div>
            <Switch
              checked={values.tripUpdates}
              onCheckedChange={checked => updateField('tripUpdates', checked)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Member stories</p>
              <p className="text-xs text-muted-foreground">
                Spotlights and community highlights.
              </p>
            </div>
            <Switch
              checked={values.memberStories}
              onCheckedChange={checked => updateField('memberStories', checked)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Safety alerts</p>
              <p className="text-xs text-muted-foreground">
                Urgent notifications for trip changes.
              </p>
            </div>
            <Switch
              checked={values.safetyAlerts}
              onCheckedChange={checked => updateField('safetyAlerts', checked)}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Notification channels"
        description="Choose how the club should reach you."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Email updates</p>
              <p className="text-xs text-muted-foreground">
                General club communications.
              </p>
            </div>
            <Switch
              checked={values.email}
              onCheckedChange={checked => updateField('email', checked)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">SMS alerts</p>
              <p className="text-xs text-muted-foreground">
                Time-sensitive reminders.
              </p>
            </div>
            <Switch
              checked={values.sms}
              onCheckedChange={checked => updateField('sms', checked)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Club announcements</p>
              <p className="text-xs text-muted-foreground">
                Important club-wide notices.
              </p>
            </div>
            <Switch
              checked={values.announcements}
              onCheckedChange={checked => updateField('announcements', checked)}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Digest frequency"
        description="Combine updates into a single summary email."
      >
        <div className="max-w-xs">
          <Select
            value={values.digestFrequency}
            onValueChange={value =>
              updateField(
                'digestFrequency',
                value as NotificationSettings['digestFrequency'],
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
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
