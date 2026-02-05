'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type BackButtonProps = {
  className?: string
  label?: string
  fallbackHref?: string
}

export function BackButton({
  className,
  label = '← back',
  fallbackHref = '/',
}: BackButtonProps) {
  const router = useRouter()

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
      {label}
    </button>
  )
}
