'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createCustomerPortalSession } from '../actions'

type ManageBillingButtonProps = {
  className?: string
}

export function ManageBillingButton({ className }: ManageBillingButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const result = await createCustomerPortalSession()
      if (result.success && result.url) {
        alert('Billing portal opened! In production, this would redirect to Stripe.')
      }
    } catch (error) {
      console.error('Billing portal error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      className={className}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? 'Opening...' : 'Manage Billing'}
    </Button>
  )
}
