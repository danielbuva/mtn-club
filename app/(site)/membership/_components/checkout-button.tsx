'use client'

import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { createCheckoutSession } from '../actions'

export type CheckoutButtonProps = {
  label: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
  showArrow?: boolean
}

export function CheckoutButton({
  label,
  variant,
  size,
  className,
  showArrow = true,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const result = await createCheckoutSession()
      if (result.success && result.url) {
        alert(
          'Checkout initiated! In production, this would redirect to Stripe.',
        )
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={handleCheckout}
      disabled={isLoading}
    >
      {isLoading ? (
        'Processing...'
      ) : (
        <>
          {label}
          {showArrow && <ArrowRight className="w-5 h-5" />}
        </>
      )}
    </Button>
  )
}
