import { getProfileOrRedirect } from '@/app/(site)/profile/_lib/get-profile'
import { AccountSettingsFormClient } from '@/components/profile/settings/account-settings-form-client'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'
import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'
import { getViewer } from '@/lib/auth/viewer'

export default async function AccountSettingsPage() {
  const [{ profile, userId, email }, viewer] = await Promise.all([
    getProfileOrRedirect(),
    getViewer(),
  ])
  const isAdmin = viewer.member?.role === 'admin'

  return (
    <div className="space-y-6">
      <MobileSettingsHeader title="Account" backHref="/profile/settings" />
      <SettingsPageHeader
        title="Account"
        description="Manage your personal details and security settings."
      />
      <AccountSettingsFormClient
        initialProfile={profile}
        userId={userId}
        email={email}
        isAdmin={isAdmin}
      />
    </div>
  )
}
