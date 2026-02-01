'use client'

import { useState } from 'react'
import { Check, CreditCard, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CheckoutButton } from './checkout-button'

const features = [
  'Access to Upcoming Trips in our Trips Calendar',
  'Access to Guidebook Library',
  'Access to Gear Room',
  'Bring a guest once per quarter',
]

type MembershipCheckoutCardProps = {
  ctaLabel: string
}

export function MembershipCheckoutCard({ ctaLabel }: MembershipCheckoutCardProps) {
  const [autoRenew, setAutoRenew] = useState(true)

  return (
    <div className="max-w-lg mx-auto">
      <Card className="border-primary/20 shadow-xl overflow-hidden">
        <div className="bg-primary text-primary-foreground p-6 text-center">
          <h2 className="font-semibold text-lg mb-1">Annual Membership</h2>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold">$25</span>
            <span className="text-primary-foreground/80">/year</span>
          </div>
        </div>
        <CardContent className="p-6">
          <ul className="space-y-3 mb-6">
            {features.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary mb-6">
            <div className="flex items-center gap-3">
              <Label htmlFor="auto-renew" className="text-sm font-medium cursor-pointer">
                Auto-renew annually
              </Label>
            </div>
            <Switch id="auto-renew" checked={autoRenew} onCheckedChange={setAutoRenew} />
          </div>

          <CheckoutButton
            label={ctaLabel}
            size="lg"
            className="w-full rounded-xl text-lg gap-2"
          />

          <div className="mt-4 flex items-center justify-center gap-3">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Visa, Mastercard, Amex, Apple Pay, Google Pay
            </span>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>Stripe checkout coming soon</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
