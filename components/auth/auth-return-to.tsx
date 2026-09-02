'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import {
  getReturnToFromReferrer,
  getReturnToFromSearchParams,
  getStoredReturnTo,
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

    const fromReferrer = getReturnToFromReferrer(
      document.referrer,
      window.location.origin,
    )
    if (fromReferrer) {
      storeReturnTo(fromReferrer)
    }
  }, [searchParams])

  return null
}
