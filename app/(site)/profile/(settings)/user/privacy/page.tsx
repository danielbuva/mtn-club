import { getProfileOrRedirect } from '@/app/(site)/profile/_lib/get-profile'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'
import { PrivacySettingsFormClient } from '@/components/profile/settings/privacy-settings-form-client'
import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'

export default async function PrivacySettingsPage() {
  const { profile, userId } = await getProfileOrRedirect()

  return (
    <div className="space-y-6">
      <MobileSettingsHeader
        title="Data & Privacy"
        backHref="/profile/settings"
      />
      <SettingsPageHeader
        title="Data & Privacy"
        description="Control what you share with other members."
      />
      <PrivacySettingsFormClient initialProfile={profile} userId={userId} />
    </div>
  )
}
