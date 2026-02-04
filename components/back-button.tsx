'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type BackButtonProps = {
  className?: string
  label?: string
  fallbackHref?: string
  fallbackLabel?: string
}

export function BackButton({
  className,
  label = '← back',
  fallbackLabel = 'home',
  fallbackHref = '/',
}: BackButtonProps) {
  const router = useRouter()
  const [canGoBack, setCanGoBack] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setCanGoBack(window.history.length > 1)
  }, [])

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back()
          return
        }
        router.push(fallbackHref)
      }}
      className={cn('text-foreground/70 lowercase', className)}
    >
      {canGoBack ? label : fallbackLabel}
    </button>
  )
}
