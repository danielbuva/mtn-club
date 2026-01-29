import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'
import { GearPreferencesFormClient } from '@/components/profile/settings/gear-preferences-form-client'
import { getProfileOrRedirect } from '@/app/(site)/profile/_lib/get-profile'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'

export default async function GearPreferencesPage() {
  const { profile, userId } = await getProfileOrRedirect()

  return (
    <div className="space-y-6">
      <MobileSettingsHeader title="Gear" backHref="/profile/settings" />
      <SettingsPageHeader
        title="Gear"
        description="Share what gear you have and what you still need."
      />
      <GearPreferencesFormClient initialProfile={profile} userId={userId} />
    </div>
  )
}
