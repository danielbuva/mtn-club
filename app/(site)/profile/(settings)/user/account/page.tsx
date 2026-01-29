import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'
import { AccountSettingsFormClient } from '@/components/profile/settings/account-settings-form-client'
import { getProfileOrRedirect } from '@/app/(site)/profile/_lib/get-profile'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'

export default async function AccountSettingsPage() {
  const { profile, userId, email } = await getProfileOrRedirect()

  return (
    <div className="space-y-6">
      <MobileSettingsHeader title="Account" backHref="/profile/settings" />
      <SettingsPageHeader
        title="Account"
        description="Manage your personal details and security settings."
      />
      <AccountSettingsFormClient initialProfile={profile} userId={userId} email={email} />
    </div>
  )
}
