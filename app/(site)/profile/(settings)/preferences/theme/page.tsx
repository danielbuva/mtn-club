import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'
import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'
import { ThemePreferencesClient } from '@/components/profile/settings/theme-preferences-client'

export default function ThemePreferencesPage() {
  return (
    <div className="space-y-6">
      <MobileSettingsHeader title="Theme" backHref="/profile/settings" />
      <SettingsPageHeader
        title="Theme"
        description="Personalize how the app looks on this device."
      />
      <ThemePreferencesClient />
    </div>
  )
}
