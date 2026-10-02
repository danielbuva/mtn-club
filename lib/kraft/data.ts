import { pilotBoulders } from './pilot-boulders.ts'
import { buildRuntimeCatalog, runtimeAreas } from './runtime-catalog.ts'
import { kraftSources } from './sources.ts'
import type { KraftGuide } from './types'

export { kraftSources } from './sources.ts'

const reviewedAt = '2026-10-01'
export const kraftBoulders = buildRuntimeCatalog(pilotBoulders, kraftSources)

export const kraftGuide: KraftGuide = {
  id: 'kraft',
  name: 'Kraft Boulders',
  version: '2026-10-01-catalog-7',
  reviewedAt,
  status: 'catalog',
  description:
    'Dated Mountain Project/OpenBeta Kraft catalog: 370 MP routes and 13 distinct OpenBeta entries. Source units and importer memberships are qualified separately from physical rocks; image, line and field-review gaps remain explicit.',
  areas: runtimeAreas(kraftSources),
  boulders: kraftBoulders,
  sources: kraftSources,
  assets: [
    {
      id: 'pearl-southeast-guide',
      src: '/kraft/pearl-southeast-guide.webp',
      kind: 'face-photo',
      license: 'Original MTN Club guide asset',
      distribution: {
        licenseIds: ['MTN-Club-original'],
        evidenceUrl:
          'https://github.com/danielbuva/mtn-club/blob/feat/kraft-offline-guidebook/public/kraft/pearl-southeast-guide-provenance.json',
      },
      attribution: 'Original MTN Club guide reconstruction',
      attributionUrl:
        'https://github.com/danielbuva/mtn-club/blob/feat/kraft-offline-guidebook/public/kraft/pearl-southeast-guide-provenance.json',
      modificationNote:
        'Original near-frontal camera composed from factual references. Native 1448 × 1086 raster optimized as WebP; human and field verification pending.',
      sourceIds: ['mtn-club-pearl-southeast-guide'],
    },
    {
      id: 'kraft-geographic-layer',
      src: '/kraft/geo-features.json',
      kind: 'map',
      license:
        'Open Database License 1.0 / U.S. federal government public domain',
      distribution: {
        licenseIds: ['ODbL-1.0', 'PD-USGov'],
        evidenceUrl: 'https://www.openstreetmap.org/copyright',
      },
      attribution:
        '© OpenStreetMap contributors; USGS National Map 3DEP. Full terms: /kraft/geo-license.txt',
      sourceIds: [
        'osm-kraft-2026-09-30',
        'osm-kraft-west-2026-10-01',
        'usgs-3dep-2026-10-01',
      ],
    },
    {
      id: 'kraft-candidate-surfaces',
      src: '/kraft/geo-surface-candidates.json',
      kind: 'map',
      license: 'U.S. federal government public domain',
      distribution: {
        licenseIds: ['PD-USGov'],
        evidenceUrl:
          'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',
      },
      attribution:
        'Partial surface vectors from locked 2022 USGS/USDA NAIP imagery. Low-confidence candidates; physical identities and base boundaries unresolved. Full terms: /kraft/geo-license.txt',
      sourceIds: ['usgs-naip-2026-10-01'],
    },
  ],
}
