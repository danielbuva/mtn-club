import { catalogSources } from './catalog-records.ts'
import { cubeCatalog } from './cube-catalog.ts'
import { monkeyCatalog } from './monkey-catalog.ts'
import { pearlCatalog } from './pearl-catalog.ts'
import { completeRuntimeSources } from './runtime-sources.ts'
import { splitCatalog } from './split-catalog.ts'
import type { EvidenceSource } from './types'

export const kraftReviewedAt = '2026-09-30'
const reviewedAt = kraftReviewedAt
const mp = 'https://www.mountainproject.com'

function source(id: string, title: string, url: string): EvidenceSource {
  return {
    id,
    title,
    url,
    publisher: 'Mountain Project contributors',
    accessedAt: reviewedAt,
    usage: 'factual-reference',
  }
}

const pilotSources: EvidenceSource[] = [
  {
    id: 'mp-monkey-direct-scott-2023',
    title: 'Monkey Bar Direct — Scott B post-break opinion, April 21, 2023',
    url: 'https://www.mountainproject.com/route/107378329/monkey-bar-direct#Comment-124063243',
    publisher: 'Scott B / Mountain Project',
    accessedAt: '2026-10-01',
    publishedAt: '2023-04-21',
    usage: 'factual-reference',
    note: 'Dated public route comment. Original factual paraphrase of a break report and approximate V10 opinion; no current-condition or consensus assertion.',
  },
  {
    id: 'mp-monkey-direct-radke-2024',
    title:
      'Monkey Bar Direct — Zachary Radke post-break opinion, March 28, 2024',
    url: 'https://www.mountainproject.com/route/107378329/monkey-bar-direct#Comment-125879656',
    publisher: 'Zachary Radke / Mountain Project',
    accessedAt: '2026-10-01',
    publishedAt: '2024-03-28',
    usage: 'factual-reference',
    note: 'Dated public route comment. Original factual paraphrase of a post-break V8 opinion; no current-condition or consensus assertion.',
  },
  {
    id: 'mtn-club-pearl-southeast-guide',
    title: 'The Pearl southeast guide image · original MTN Club reconstruction',
    publisher: 'MTN Club',
    url: 'https://github.com/danielbuva/mtn-club/blob/feat/kraft-offline-guidebook/public/kraft/pearl-southeast-guide-provenance.json',
    accessedAt: '2026-10-01',
    usage: 'licensed-media',
    license: 'Original MTN Club guide asset',
    distribution: {
      licenseIds: ['MTN-Club-original'],
      evidenceUrl:
        'https://github.com/danielbuva/mtn-club/blob/feat/kraft-offline-guidebook/public/kraft/pearl-southeast-guide-provenance.json',
    },
    note: 'User-directed original guide asset with a new near-frontal camera. Only the lawful BLM reference and our own first candidate were generator pixel inputs; MP photos were consulted for factual geometry only. Original creation record, exact prompt, hashes and review scope are retained. Human and field verification remain pending.',
  },
  {
    id: 'blm-pearl-photograph',
    title: 'Interesting Geology at Kraft Mountain · BLM photograph',
    publisher: 'Samantha Szesciorka / BLM Nevada',
    url: 'https://commons.wikimedia.org/wiki/File:Interesting_Geology_at_Kraft_Mountain_(54084251954).jpg',
    accessedAt: reviewedAt,
    usage: 'licensed-media',
    license: 'Public domain (U.S.) / CC BY 2.0',
    distribution: {
      licenseIds: ['PD-USGov-BLM', 'CC-BY-2.0'],
      evidenceUrl:
        'https://commons.wikimedia.org/wiki/File:Interesting_Geology_at_Kraft_Mountain_(54084251954).jpg',
    },
    note: 'BLM official-duty photograph taken 8 March 2024. Commons PD-US-BLM and Flickr CC BY 2.0 checked; user identifies The Pearl. Retained as a lawful reference; its local derivative is no longer an active guide asset. These source reuse terms do not label the original MTN Club reconstruction.',
  },
  {
    id: 'mp-pearl-finish-reference',
    title: 'The Pearl · named-route finishing lip photograph',
    publisher: 'Mountain Project contributors',
    url: 'https://www.mountainproject.com/photo/112437405/random-guy-named-kevin-hangs-off-the-topout-jugs-of-the-pearl-v5',
    accessedAt: '2026-10-01',
    usage: 'factual-reference',
    note: 'Reference-only actual pixels and route-linked caption inspected for the general finishing lip. Independently matched with the full-face reference and lawful BLM reference; no source photograph, composition or topo artwork is distributed.',
  },
  {
    id: 'mp-pearl-view-reference',
    title: 'The Pearl southeast view · photographic identification reference',
    publisher: 'Chris Tregge / Mountain Project',
    url: 'https://www.mountainproject.com/photo/106120934',
    accessedAt: reviewedAt,
    usage: 'factual-reference',
    note: 'Published Pearl seam and adjacent Clam Bumper ramp identify the face in the lawful BLM reference. Physical features informed the independently composed original guide reconstruction; no Mountain Project pixels or route artwork are shipped. Field verification remains separate.',
  },
  ...catalogSources([
    ...cubeCatalog,
    ...splitCatalog,
    ...pearlCatalog,
    ...monkeyCatalog,
  ]),
  {
    id: 'osm-kraft-2026-09-30',
    title: 'Kraft trails, parking and washes',
    publisher: 'OpenStreetMap contributors',
    url: 'https://www.openstreetmap.org/copyright',
    accessedAt: reviewedAt,
    usage: 'open-data',
    license: 'Open Database License 1.0',
    distribution: {
      licenseIds: ['ODbL-1.0'],
      evidenceUrl: 'https://www.openstreetmap.org/copyright',
    },
    note: 'Community observations; not field verified. Original extract and projected derivative shipped.',
  },
  {
    id: 'osm-kraft-west-2026-10-01',
    title: 'Kraft western trails and roads · OpenStreetMap supplement',
    publisher: 'OpenStreetMap contributors',
    url: 'https://api.openstreetmap.org/api/0.6/map?bbox=-115.4265,36.156,-115.424,36.166',
    accessedAt: '2026-10-01',
    usage: 'open-data',
    license: 'Open Database License 1.0',
    distribution: {
      licenseIds: ['ODbL-1.0'],
      evidenceUrl: 'https://www.openstreetmap.org/copyright',
    },
    note: 'Official OSM API XML supplement for the expanded western envelope. Geometry merged by exact way ID with source provenance retained; final boulder approaches are not field verified.',
  },
  {
    id: 'usgs-3dep-2026-10-01',
    title: 'Expanded Kraft terrain elevation · 3DEP',
    publisher: 'U.S. Geological Survey',
    url: 'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer',
    accessedAt: '2026-10-01',
    usage: 'open-data',
    license: 'U.S. federal government public domain',
    distribution: {
      licenseIds: ['PD-USGov'],
      evidenceUrl:
        'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',
    },
    note: '596 × 400 DEM acquisition for the expanded Kraft envelope. Export request and processing provenance are retained with the geographic assets; terrain contours do not identify physical rocks.',
  },
  {
    id: 'usgs-naip-2026-10-01',
    title: 'Expanded Kraft aerial context · locked 2022 NAIP raster',
    publisher: 'U.S. Geological Survey / USDA',
    url: 'https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer/134873?f=pjson',
    accessedAt: '2026-10-01',
    publishedAt: '2022-06-11',
    usage: 'open-data',
    license: 'U.S. federal government public domain',
    distribution: {
      licenseIds: ['PD-USGov'],
      evidenceUrl:
        'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',
    },
    note: 'Context source input locked to raster 134873, acquired June 11, 2022. Low-confidence partial visible-surface vectors preserve uncertain named associations and unobserved base boundaries. The aerial image remains a provenance input and is not included in the field download.',
  },
  {
    id: 'usgs-3dep-2026-09-30',
    title: '3DEP terrain elevation',
    publisher: 'U.S. Geological Survey',
    url: 'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer',
    accessedAt: reviewedAt,
    usage: 'open-data',
    license: 'U.S. federal government public domain',
    distribution: {
      licenseIds: ['PD-USGov'],
      evidenceUrl:
        'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',
    },
    note: 'DEM source and extraction metadata are retained with the map assets.',
  },
  {
    id: 'usgs-naip-2026-09-30',
    title: 'National Agriculture Imagery Program orthophotography',
    publisher: 'U.S. Geological Survey / USDA',
    url: 'https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer',
    accessedAt: reviewedAt,
    usage: 'open-data',
    license: 'U.S. federal government public domain',
    distribution: {
      licenseIds: ['PD-USGov'],
      evidenceUrl:
        'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',
    },
    note: 'Aerial imagery provides geographic context, not licensed boulder face photography.',
  },
  source('mp-kraft', 'Kraft Boulders', `${mp}/area/105937608/kraft-boulders`),
  source('mp-cube', 'The Cube', `${mp}/area/105959355/the-cube`),
  source(
    'mp-split',
    'The Split Boulder',
    `${mp}/area/105959392/the-split-boulder`,
  ),
  source('mp-pearl', 'The Pearl boulder', `${mp}/area/106056258/the-pearl`),
  source(
    'mp-monkey',
    'Monkey Bar Boulder',
    `${mp}/area/105937674/monkey-bar-boulder`,
  ),
  source(
    'mp-west-face-left',
    'West Face Left',
    `${mp}/route/107004813/west-face-left`,
  ),
  source(
    'mp-perfect-poser',
    'Perfect Poser',
    `${mp}/route/105959433/perfect-poser`,
  ),
  source(
    'mp-black-hat',
    'Fear of a Black Hat',
    `${mp}/route/107004045/fear-of-a-black-hat`,
  ),
  source(
    'mp-front-crack',
    'Front Side Crack',
    `${mp}/route/106617793/front-side-crack`,
  ),
  source(
    'mp-plumbers',
    "Plumber's Crack",
    `${mp}/route/107185645/plumbers-crack`,
  ),
  source(
    'mp-split-decision',
    'Split Decision',
    `${mp}/route/110174865/split-decision`,
  ),
  source(
    'mp-pearl-route',
    'The Pearl climb',
    `${mp}/route/106056281/the-pearl`,
  ),
  source(
    'mp-pearl-ne',
    'Northeast Face Center',
    `${mp}/route/110224533/northeast-face-center`,
  ),
  source('mp-six-pack', 'Six Pack', `${mp}/route/107030486/six-pack`),
  source(
    'mp-jennas',
    "Jenna's Jewelry",
    `${mp}/route/106652010/jennas-jewelry`,
  ),
  source('mp-monkey-bars', 'Monkey Bars', `${mp}/route/106657521/monkey-bars`),
  source('mp-hyperglide', 'Hyperglide', `${mp}/route/107074342/hyperglide`),
  source(
    'mp-monkey-direct',
    'Monkey Bar Direct',
    `${mp}/route/107378329/monkey-bar-direct`,
  ),
  source(
    'mp-monkey-right',
    'Monkey Bar Right',
    `${mp}/route/106683440/monkey-bar-right`,
  ),
  source(
    'mp-monkey-ne',
    'Northeast Face Left',
    `${mp}/route/113880181/northeast-face-left`,
  ),
  {
    id: 'thetopo-monkey',
    title: 'Monkey Bar Boulder topo index',
    publisher: 'theTopo contributors',
    url: 'https://thetopo.com/crags/kraft-wash-red-rock/topos/monkey-bar-boulder',
    accessedAt: reviewedAt,
    usage: 'factual-reference',
    note: 'Published names, grades and coordinates only. No photographs or topo artwork are reproduced.',
  },
  {
    id: 'thetopo-split',
    title: "Plumber's Crack boulder topo index",
    publisher: 'theTopo contributors',
    url: 'https://thetopo.com/crags/kraft-wash-red-rock/topos/plumber-s-crack',
    accessedAt: reviewedAt,
    usage: 'factual-reference',
    note: 'Candidate boulder alias and coordinate comparison; physical identity is unresolved.',
  },
  {
    id: 'kaya-plumbers',
    title: "Plumber's Crack V1",
    publisher: 'KAYA',
    url: 'https://kaya-app.kayaclimb.com/climb/Plumbers-Crack-v1-Red-Rocks-121118',
    accessedAt: reviewedAt,
    usage: 'factual-reference',
    note: 'Describes a chimney without identifying its cardinal face. Identity with the MP south-side offwidth is unresolved.',
  },
  {
    id: 'mp-monkey-onx-link',
    title: 'Monkey Bars outbound onX map link',
    publisher: 'Mountain Project / onX',
    url: `${mp}/route/106657521/monkey-bars`,
    accessedAt: reviewedAt,
    usage: 'factual-reference',
    note: 'The outbound onX link fragment is #15/36.16154/-115.41099/0/60. This repeats the parent coordinate; it is not an independent field measurement.',
  },
  {
    id: 'kaya-kraft',
    title: 'Kraft public climb list',
    publisher: 'KAYA',
    url: 'https://kaya-app.kayaclimb.com/location/Kraft-Boulders-331388',
    accessedAt: reviewedAt,
    usage: 'factual-reference',
    note: 'Public list observations only; copyrighted descriptions, media and topo geometry are excluded.',
  },
]

export const kraftSources = completeRuntimeSources(pilotSources)
