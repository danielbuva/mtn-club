import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'
import { NotificationsSettingsFormClient } from '@/components/profile/settings/notifications-settings-form-client'
import { getProfileOrRedirect } from '@/app/(site)/profile/_lib/get-profile'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'

export default async function NotificationsSettingsPage() {
  const { profile, userId } = await getProfileOrRedirect()

  return (
    <div className="space-y-6">
      <MobileSettingsHeader title="Notifications" backHref="/profile/settings" />
      <SettingsPageHeader
        title="Notifications"
        description="Choose how the club should contact you."
      />
      <NotificationsSettingsFormClient initialProfile={profile} userId={userId} />
    </div>
  )
}
