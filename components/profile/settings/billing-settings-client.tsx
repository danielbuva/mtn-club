import Link from 'next/link'
import { SettingsCard } from '@/components/profile/settings/settings-card'
import { Button } from '@/components/ui/button'

export function BillingSettingsClient() {
  return (
    <div className="space-y-6">
      <SettingsCard
        title="Annual membership"
        description="Membership uses a one-time payment rather than a subscription."
        footer={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/membership">View membership status and payments</Link>
          </Button>
        }
      >
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
          A verified payment grants 12 calendar months. Renewal is manual, no
          card is kept here for automatic charges, and payment history is shown
          only through the safe membership page.
        </div>
      </SettingsCard>
    </div>
  )
}
