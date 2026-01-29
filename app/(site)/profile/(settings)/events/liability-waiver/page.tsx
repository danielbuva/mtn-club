import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'
import { SettingsCard } from '@/components/profile/settings/settings-card'
import { Button } from '@/components/ui/button'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'

export default function LiabilityWaiverPage() {
  return (
    <div className="space-y-6">
      <MobileSettingsHeader title="Liability waiver" backHref="/profile/settings" />
      <SettingsPageHeader
        title="Liability waiver"
        description="Track your waiver status for upcoming events."
      />
      <SettingsCard
        title="Waiver status"
        description="Waivers are required for all club-sponsored trips."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Status: Not signed</p>
            <p className="text-xs text-muted-foreground">
              TODO: Connect document signature flow.
            </p>
          </div>
          <Button variant="outline">Upload or sign waiver</Button>
        </div>
      </SettingsCard>
    </div>
  )
}
