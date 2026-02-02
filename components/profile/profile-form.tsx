'use client'

import { useEffect, useState } from 'react'
import { AccountBasicsSection } from '@/components/profile/sections/account-basics'
import { ContactCommunicationSection } from '@/components/profile/sections/contact-communication'
import { EmergencyContactSection } from '@/components/profile/sections/emergency-contact'
import { GearProfileSection } from '@/components/profile/sections/gear-profile'
import { InterestsPreferencesSection } from '@/components/profile/sections/interests-preferences'
import { NotificationsSection } from '@/components/profile/sections/notifications'
import { PrivacyControlsSection } from '@/components/profile/sections/privacy-controls'
import { SkillsCertsSection } from '@/components/profile/sections/skills-certs'
import { TravelPreferencesSection } from '@/components/profile/sections/travel-preferences'
import { Button } from '@/components/ui/button'
import {
  emptyProfileValues,
  profileRowToFormValues,
} from '@/lib/profile/mappers'
import { profileFormSchema } from '@/lib/profile/schemas'
import type { ProfileFormValues, ProfileRow } from '@/lib/profile/types'

interface ProfileFormProps {
  initialProfile: ProfileRow | null
  email: string | null
  onSave: (values: ProfileFormValues) => Promise<void>
  isSaving: boolean
  saveError: string | null
}

export function ProfileForm({
  initialProfile,
  email,
  onSave,
  isSaving,
  saveError,
}: ProfileFormProps) {
  const [values, setValues] = useState<ProfileFormValues>(emptyProfileValues())
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    setValues(profileRowToFormValues(initialProfile))
  }, [initialProfile])

  const updateField = <K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K],
  ) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const updateEmergencyContact = <
    K extends keyof ProfileFormValues['emergencyContact'],
  >(
    key: K,
    value: ProfileFormValues['emergencyContact'][K],
  ) => {
    setValues(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [key]: value },
    }))
  }

  const updatePrivacy = <K extends keyof ProfileFormValues['privacySettings']>(
    key: K,
    value: ProfileFormValues['privacySettings'][K],
  ) => {
    setValues(prev => ({
      ...prev,
      privacySettings: { ...prev.privacySettings, [key]: value },
    }))
  }

  const updateTravel = <K extends keyof ProfileFormValues['travelProfile']>(
    key: K,
    value: ProfileFormValues['travelProfile'][K],
  ) => {
    setValues(prev => ({
      ...prev,
      travelProfile: { ...prev.travelProfile, [key]: value },
    }))
  }

  const updateGear = <K extends keyof ProfileFormValues['gearProfile']>(
    key: K,
    value: ProfileFormValues['gearProfile'][K],
  ) => {
    setValues(prev => ({
      ...prev,
      gearProfile: { ...prev.gearProfile, [key]: value },
    }))
  }

  const updateInterests = <
    K extends keyof ProfileFormValues['interestsPreferences'],
  >(
    key: K,
    value: ProfileFormValues['interestsPreferences'][K],
  ) => {
    setValues(prev => ({
      ...prev,
      interestsPreferences: { ...prev.interestsPreferences, [key]: value },
    }))
  }

  const updateSkills = <K extends keyof ProfileFormValues['skillsCerts']>(
    key: K,
    value: ProfileFormValues['skillsCerts'][K],
  ) => {
    setValues(prev => ({
      ...prev,
      skillsCerts: { ...prev.skillsCerts, [key]: value },
    }))
  }

  const updateNotifications = <
    K extends keyof ProfileFormValues['notificationSettings'],
  >(
    key: K,
    value: ProfileFormValues['notificationSettings'][K],
  ) => {
    setValues(prev => ({
      ...prev,
      notificationSettings: { ...prev.notificationSettings, [key]: value },
    }))
  }

  const handleSave = async () => {
    setValidationError(null)
    const parsed = profileFormSchema.safeParse(values)
    if (!parsed.success) {
      setValidationError('Please check the form for invalid values.')
      return
    }

    try {
      await onSave(values)
    } catch {
      // Parent handles save errors.
    }
  }

  return (
    <div className="space-y-6">
      {(validationError ?? saveError) && (
        <p className="text-sm text-red-500">{validationError ?? saveError}</p>
      )}

      <AccountBasicsSection values={values} onChange={updateField} />
      <ContactCommunicationSection
        email={email}
        values={values}
        onChange={updateField}
      />
      <EmergencyContactSection
        value={values.emergencyContact}
        onChange={updateEmergencyContact}
      />
      <PrivacyControlsSection
        value={values.privacySettings}
        onChange={updatePrivacy}
      />
      <TravelPreferencesSection
        value={values.travelProfile}
        onChange={updateTravel}
      />
      <GearProfileSection value={values.gearProfile} onChange={updateGear} />
      <InterestsPreferencesSection
        value={values.interestsPreferences}
        onChange={updateInterests}
      />
      <SkillsCertsSection value={values.skillsCerts} onChange={updateSkills} />
      <NotificationsSection
        value={values.notificationSettings}
        onChange={updateNotifications}
      />

      <div className="flex items-center justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="rounded-xl">
          {isSaving ? 'Saving...' : 'Save profile'}
        </Button>
      </div>
    </div>
  )
}
