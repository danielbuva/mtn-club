'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type BackButtonProps = {
  className?: string
  label?: string
}

export function BackButton({ className, label = '← back' }: BackButtonProps) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={cn('text-foreground/70 lowercase', className)}
    >
      {label}
    </button>
  )
}
