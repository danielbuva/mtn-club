import { getProfileOrRedirect } from '@/app/(site)/profile/_lib/get-profile'
import { InterestsPreferencesFormClient } from '@/components/profile/settings/interests-preferences-form-client'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'
import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'

export default async function InterestsPreferencesPage() {
  const { profile, userId } = await getProfileOrRedirect()

  return (
    <div className="space-y-6">
      <MobileSettingsHeader title="Interests" backHref="/profile/settings" />
      <SettingsPageHeader
        title="Interests"
        description="Share the activities and trip styles you enjoy."
      />
      <InterestsPreferencesFormClient
        initialProfile={profile}
        userId={userId}
      />
    </div>
  )
}
