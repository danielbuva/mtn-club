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
  version: '2026-10-01-catalog-5',
  reviewedAt,
  status: 'catalog',
  description:
    'Dated Mountain Project/OpenBeta Kraft catalog: 370 MP routes and 13 distinct OpenBeta entries. Source units and importer memberships are qualified separately from physical rocks; image, line and field-review gaps remain explicit.',
  areas: runtimeAreas(kraftSources),
  boulders: kraftBoulders,
  sources: kraftSources,
  assets: [
    {
      id: 'pearl-blm-photograph',
      src: '/kraft/pearl-blm.webp',
      kind: 'face-photo',
      license: 'Public domain (U.S.) / CC BY 2.0',
      distribution: {
        licenseIds: ['PD-USGov-BLM', 'CC-BY-2.0'],
        evidenceUrl:
          'https://commons.wikimedia.org/wiki/File:Interesting_Geology_at_Kraft_Mountain_(54084251954).jpg',
      },
      attribution: 'Photo: Samantha Szesciorka / BLM Nevada',
      attributionUrl:
        'https://commons.wikimedia.org/wiki/File:Interesting_Geology_at_Kraft_Mountain_(54084251954).jpg',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
      modificationNote: 'Resized and optimized; full composition preserved.',
      sourceIds: ['blm-pearl-photograph'],
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
