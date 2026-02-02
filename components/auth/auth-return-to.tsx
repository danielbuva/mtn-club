'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import {
  getReturnToFromSearchParams,
  getStoredReturnTo,
  sanitizeReturnTo,
  storeReturnTo,
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
