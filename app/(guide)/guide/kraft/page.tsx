import type { Metadata } from 'next'
import { cacheLife } from 'next/cache'
import { KraftGuide } from '@/components/kraft/kraft-guide'
import { kraftGuide } from '@/lib/kraft/data'
import { validateGuide } from '@/lib/kraft/validate'
import './kraft.css'
import './kraft-explorer.css'
import './kraft-responsive.css'

export const metadata: Metadata = {
  title: 'Kraft Boulders Field Guide | MTN Club',
  description:
    'Explore real Kraft boulders, search climbs and save the available guide for offline use. A growing field guide by MTN Club.',
  alternates: { canonical: '/guide/kraft' },
  manifest: '/guide/kraft.webmanifest',
}

export default async function KraftGuidePage() {
  'use cache'
  // Date validation runs when this public, static guide cache is filled.
  cacheLife('days')
  const contentErrors = validateGuide(kraftGuide)
  if (contentErrors.length)
    throw new Error(
      `Kraft content validation failed: ${contentErrors.join('; ')}`,
    )
  const inventory = JSON.stringify({
    version: kraftGuide.version,
    assets: [
      ...kraftGuide.assets.map(asset => asset.src),
      '/guide/kraft.webmanifest',
      '/kraft/icon-192.png',
      '/kraft/icon-512.png',
      '/kraft/geo-license.txt',
      '/kraft/pearl-photo-license.txt',
    ],
    boulders: kraftGuide.boulders.length,
    climbs: kraftGuide.boulders.reduce(
      (total, boulder) => total + boulder.climbs.length,
      0,
    ),
    photos: kraftGuide.assets.filter(asset => asset.kind === 'face-photo')
      .length,
  }).replaceAll('<', '\\u003c')
  return (
    <>
      <script id="kraft-offline-inventory" type="application/json">
        {inventory}
      </script>
      <KraftGuide guide={kraftGuide} />
    </>
  )
}
