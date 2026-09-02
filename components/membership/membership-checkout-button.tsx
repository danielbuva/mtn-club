'use client'

import { track } from '@vercel/analytics'
import { useState } from 'react'
import { createMembershipCheckout } from '@/app/(site)/membership/actions'
import { Button } from '@/components/ui/button'

export function MembershipCheckoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = async () => {
    setIsLoading(true)
    setError(null)
    try {
      track('membership_checkout_start')
    } catch {
      // Analytics must never block checkout.
    }
    const result = await createMembershipCheckout()
    if (!result.ok) {
      setError(result.error)
      setIsLoading(false)
      return
    }
    window.location.assign(result.url)
  }

  return (
    <div>
      <Button
        type="button"
        size="lg"
        className="w-full rounded-full sm:w-auto"
        disabled={isLoading}
        onClick={startCheckout}
      >
        {isLoading ? 'Opening secure checkout…' : 'Pay $25 with Stripe'}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
