'use client'

import { Analytics } from '@vercel/analytics/react'
import { usePathname } from 'next/navigation'
import { isAuthSensitiveUrl } from '@/lib/auth/analytics'

export function SiteAnalytics() {
  const pathname = usePathname()
  if (!pathname || isAuthSensitiveUrl(pathname)) return null
  return (
    <Analytics
      beforeSend={event => (isAuthSensitiveUrl(event.url) ? null : event)}
    />
  )
}
