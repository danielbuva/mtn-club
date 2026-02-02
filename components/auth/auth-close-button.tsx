'use client'

import { X } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  getReturnToFromSearchParams,
  getStoredReturnTo,
} from '@/lib/auth/return-to'

export function AuthCloseButton() {
  const searchParams = useSearchParams()

  const href = useMemo(() => {
    return (
      getReturnToFromSearchParams(searchParams) ?? getStoredReturnTo() ?? '/'
    )
  }, [searchParams])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed left-4 top-4 z-50 rounded-full"
      asChild
    >
      <Link href={href} aria-label="Back">
        <X className="h-4 w-4" />
      </Link>
    </Button>
  )
}

export function AuthCloseFallback() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed left-4 top-4 z-50 rounded-full"
      asChild
    >
      <Link href="/" aria-label="Back to home">
        <X className="h-4 w-4" />
      </Link>
    </Button>
  )
}
