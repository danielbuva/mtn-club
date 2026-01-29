 'use client'

import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { SettingsCard } from '@/components/profile/settings/settings-card'
import { SettingsSaveBar } from '@/components/profile/settings/settings-save-bar'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'

const mockTransactions = [
  { date: '2025-10-12', description: 'Annual membership', amount: '$25.00', status: 'Paid' },
  { date: '2024-10-12', description: 'Annual membership', amount: '$25.00', status: 'Paid' },
  { date: '2023-10-12', description: 'Annual membership', amount: '$25.00', status: 'Paid' },
]

export function BillingSettingsClient() {
  const [autoRenew, setAutoRenew] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { setIsDirty } = useSettingsDirty()
  const [isDirty, setDirty] = useState(false)

  useEffect(() => {
    setIsDirty(isDirty)
  }, [isDirty, setIsDirty])

  const handleSave = () => {
    setSaveError("Billing is not connected yet. We'll wire this soon.")
    setDirty(false)
  }

  const handleReset = () => {
    setAutoRenew(true)
    setSaveError(null)
    setDirty(false)
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Membership billing"
        description="Manage your membership renewal and payment details."
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Auto-renew membership</p>
            <p className="text-xs text-muted-foreground">
              {autoRenew ? 'Renews on Oct 12, 2026.' : 'Expires on Oct 12, 2026.'}
            </p>
          </div>
          <Switch
            checked={autoRenew}
            onCheckedChange={(checked) => {
              setAutoRenew(checked)
              setDirty(true)
            }}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Payment method"
        description="Update the card used for membership charges."
        footer={
          <Button variant="outline" className="w-full sm:w-auto">
            Update payment method
          </Button>
        }
      >
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
          <p className="font-medium text-foreground">Visa ending in 4242</p>
          <p className="text-xs text-muted-foreground">Expires 08/27</p>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Transaction history"
        description="Receipts for your last membership payments."
      >
        <div className="overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {mockTransactions.map((row) => (
                <tr key={`${row.date}-${row.description}`} className="bg-background">
                  <td className="px-4 py-3 text-muted-foreground">{row.date}</td>
                  <td className="px-4 py-3">{row.description}</td>
                  <td className="px-4 py-3">{row.amount}</td>
                  <td className="px-4 py-3 text-emerald-600">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          TODO: Connect Stripe billing for live transactions.
        </p>
      </SettingsCard>

      <SettingsSaveBar
        isDirty={isDirty}
        saveError={saveError}
        onSave={handleSave}
        onReset={handleReset}
      />
    </div>
  )
}
