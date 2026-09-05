import Link from 'next/link'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'
import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'

export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-6">
      <MobileSettingsHeader
        title="Notifications"
        backHref="/profile/settings"
      />
      <SettingsPageHeader
        title="Notifications"
        description="Email choices now live with your privacy settings."
      />
      <Link
        className="inline-flex rounded-lg border px-4 py-3 font-medium underline"
        href="/profile/user/privacy"
      >
        Manage email preferences in Data & Privacy
      </Link>
    </div>
  )
}
