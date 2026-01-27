'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  getReturnToFromSearchParams,
  getStoredReturnTo,
  storeReturnTo,
  sanitizeReturnTo,
} from '@/lib/auth/return-to'

export function AuthReturnTo() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const existing = getStoredReturnTo()
    if (existing) return

    const fromQuery = getReturnToFromSearchParams(searchParams)
    if (fromQuery) {
      storeReturnTo(fromQuery)
      return
    }

    const fromReferrer = sanitizeReturnTo(document.referrer)
    if (fromReferrer) {
      storeReturnTo(fromReferrer)
    }
  }, [searchParams])

  return null
}
