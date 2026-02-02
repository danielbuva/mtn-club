import { MobileSettingsIndex } from '@/components/profile/settings/mobile-settings-index'
import { SettingsCard } from '@/components/profile/settings/settings-card'
import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'

export default function SettingsIndexPage() {
  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Settings"
        description="Manage your account, preferences, and event details."
      />
      <MobileSettingsIndex />
      <div className="hidden md:block">
        <SettingsCard
          title="Select a setting"
          description="Choose a category from the left to edit your profile."
        >
          <p className="text-sm text-muted-foreground">
            Tip: use the sidebar to navigate between sections without losing
            your place.
          </p>
        </SettingsCard>
      </div>
    </div>
  )
}
