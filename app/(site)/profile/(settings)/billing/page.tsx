import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'
import { BillingSettingsClient } from '@/components/profile/settings/billing-settings-client'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <MobileSettingsHeader title="Billing" backHref="/profile/settings" />
      <SettingsPageHeader
        title="Billing"
        description="Manage membership renewal and billing details."
      />
      <BillingSettingsClient />
    </div>
  )
}
