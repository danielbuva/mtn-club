'use client'

import { track } from '@vercel/analytics'
import Link from 'next/link'
import type { ComponentProps } from 'react'
import { withCampaignSource } from '@/components/analytics/campaign-source'

type TrackLinkProps = ComponentProps<typeof Link> & {
  eventName: string
  eventProperties?: Record<string, string | number | boolean>
}

export function TrackLink({
  eventName,
  eventProperties,
  onClick,
  ...props
}: TrackLinkProps) {
  return (
    <Link
      {...props}
      onClick={event => {
        try {
          track(eventName, withCampaignSource(eventProperties))
        } catch {
          // Analytics must never interrupt navigation.
        }
        onClick?.(event)
      }}
    />
  )
}
