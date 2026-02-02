import { getProfileOrRedirect } from '@/app/(site)/profile/_lib/get-profile'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'
import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'
import { TravelPreferencesFormClient } from '@/components/profile/settings/travel-preferences-form-client'

export default async function TravelPreferencesPage() {
  const { profile, userId } = await getProfileOrRedirect()

  return (
    <div className="space-y-6">
      <MobileSettingsHeader
        title="Travel preferences"
        backHref="/profile/settings"
      />
      <SettingsPageHeader
        title="Travel preferences"
        description="Share how you like to travel and carpool for trips."
      />
      <TravelPreferencesFormClient initialProfile={profile} userId={userId} />
    </div>
  )
}
