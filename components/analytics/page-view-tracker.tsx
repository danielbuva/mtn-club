'use client'

import { track } from '@vercel/analytics'
import { useEffect } from 'react'
import { withCampaignSource } from '@/components/analytics/campaign-source'

type AnalyticsProperties = Record<string, string | number | boolean>

export function PageViewTracker({
  eventName,
  properties,
}: {
  eventName: string
  properties?: AnalyticsProperties
}) {
  useEffect(() => {
    try {
      track(eventName, withCampaignSource(properties))
    } catch {
      // Analytics must never interrupt page rendering.
    }
  }, [eventName, properties])

  return null
}
