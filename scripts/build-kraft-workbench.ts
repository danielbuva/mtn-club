import { writeFile } from 'node:fs/promises'
import topo from '../docs/kraft-gauntlet/source-data/thetopo-research-inventory.json' with {
  type: 'json',
}
import {
  contentSourceCounts,
  reconcileContent,
} from '../lib/kraft/content-inventory.ts'
import { kraftGuide } from '../lib/kraft/data.ts'

const directory = new URL('../docs/kraft-gauntlet/', import.meta.url)
const records = reconcileContent()
const routeRecords = records.filter(record => record.kind === 'route')
const unitRecords = records.filter(record => record.kind === 'source-unit')
const existingSources = new Map(
  kraftGuide.sources.map(source => [source.id, source]),
)
const runtimeSourceUrls = new Set(
  kraftGuide.boulders
    .flatMap(boulder => [
      ...boulder.sourceIds,
      ...boulder.climbs.flatMap(climb => climb.sourceIds),
    ])
    .map(id => existingSources.get(id)?.url)
    .filter(Boolean),
)
const runtimeCanonicalIds = new Set(
  [...runtimeSourceUrls].flatMap(url => {
    const match = url?.match(/mountainproject\.com\/(area|route)\/(\d+)/)
    return match ? [`mp-${match[1]}-${match[2]}`] : []
  }),
)
const markdown = (value: string) =>
  value.replaceAll('|', '\\|').replaceAll('\n', ' ')
const csv = (value: string | number | boolean | null) =>
  `"${String(value ?? '').replaceAll('"', '""')}"`
const save = async (name: string, text: string) =>
  writeFile(new URL(name, directory), text)

const rows: (string | number | boolean | null)[][] = [
  [
    'canonical_id',
    'kind',
    'inventory_name',
    'inventory_grade_provisional',
    'source',
    'source_id',
    'source_name',
    'source_grade',
    'source_yds_grade',
    'source_font_grade',
    'source_parent_id',
    'canonical_parent_id',
    'source_url',
    'retrieved_at',
    'latitude_observation',
    'longitude_observation',
    'state',
    'runtime_record',
    'runtime_source_reference',
    'confidence',
    'discrepancy_and_blocker',
  ],
]
for (const record of records)
  for (const observation of record.observations)
    rows.push([
      record.id,
      record.kind,
      record.name,
      record.grade,
      observation.source,
      observation.id,
      observation.name,
      observation.grade,
      observation.ydsGrade,
      observation.fontGrade,
      observation.parentId,
      observation.canonicalParentId,
      observation.url,
      observation.retrievedAt,
      observation.coordinate?.latitude ?? null,
      observation.coordinate?.longitude ?? null,
      record.state,
      runtimeCanonicalIds.has(record.id),
      runtimeSourceUrls.has(observation.url),
      'attributed observation; exact importer link is not independent corroboration',
      [...record.reasons, observation.identity].join(' '),
    ])
// These are research index rows, not runtime promotion or approved identity merges.
for (const unit of topo.units)
  rows.push([
    unit.sourceId,
    'source-unit',
    unit.name,
    '',
    'TheTopo research',
    unit.sourceId,
    unit.name,
    '',
    '',
    '',
    '',
    '',
    unit.url,
    topo.retrievedAt,
    unit.coordinates?.latitude ?? null,
    unit.coordinates?.longitude ?? null,
    'BLOCKED identity/conflict',
    false,
    false,
    'single-source research observation',
    'Source unit identity/crosswalk and acquisition-policy/downstream-use review pending. No product promotion.',
  ])
for (const view of topo.views)
  rows.push([
    view.sourceId,
    'view',
    view.label,
    '',
    'TheTopo research',
    view.sourceId,
    view.label,
    '',
    '',
    '',
    view.unitSourceId,
    '',
    view.sourceUrl,
    topo.retrievedAt,
    null,
    null,
    'BLOCKED lawful image',
    false,
    false,
    'source grouping; orientation unresolved',
    'Reference-only image/artwork; geometry excluded. Acquisition-policy/downstream-use review pending.',
  ])
for (const route of topo.routes)
  rows.push([
    route.sourceId,
    'route',
    route.name,
    '',
    'TheTopo research',
    route.sourceId,
    route.name,
    '',
    '',
    route.grade,
    route.unitSourceId,
    '',
    route.url,
    topo.retrievedAt,
    null,
    null,
    'BLOCKED identity/conflict',
    false,
    false,
    'unreconciled source route identity',
    'No name-only merge. Source grade is Font. Identity and acquisition-policy/downstream-use review pending.',
  ])
for (const row of rows.slice(1))
  if (
    row.length !== rows[0].length ||
    !['Mountain Project', 'OpenBeta', 'TheTopo research'].includes(
      String(row[4]),
    ) ||
    typeof row[17] !== 'boolean' ||
    typeof row[18] !== 'boolean'
  )
    throw new Error(`Invalid inventory row: ${row[0]}`)
await save(
  'kraft-content-inventory.csv',
  `${rows.map(row => row.map(csv).join(',')).join('\n')}\n`,
)

const unitLines = unitRecords.map(record => {
  const source = record.observations[0]
  const allocation = record.name.includes('Monkey Bar')
    ? 'Reconstruction research; geometry blocked; compare field photo'
    : record.name === 'The Pearl'
      ? 'BLM southeast photo control; other views need own photo'
      : 'Lawful photo search / field photograph first; assess multi-view evidence before reconstruction'
  return `| [${markdown(record.name)}](${source.url}) | ${record.id} | ${record.state} | ${allocation} |`
})
await save(
  'kraft-boulder-status-board.md',
  [
    '# Kraft boulder and source-unit status',
    '',
    `Updated 2026-10-01. ${unitRecords.length} MP/OpenBeta source-unit identities after exact importer links; these are **not** a verified physical-rock count. TheTopo adds ${topo.units.length} separately indexed research units pending identity/policy review.`,
    '',
    'The running starting edition still has four units / 58 climbs. No real route SVG or reconstruction is approved. Every source observation, including all TheTopo units/views/routes, remains in [the inventory](kraft-content-inventory.csv). Missing imagery does not hide a unit.',
    '',
    '| Source unit | Inventory ID | State | Image allocation |',
    '| --- | --- | --- | --- |',
    ...unitLines,
    '',
    'Art Deco covers two rocks; Warm-up Boulders Main covers a pair. South of Main describes one boulder. Database units and topo views must be reconciled before physical boundaries are chosen. Field-photo allocation is a current fallback, not a claim that references were sufficient for reconstruction.',
    '',
  ].join('\n'),
)

const stateCounts = new Map<string, number>()
for (const record of routeRecords)
  stateCounts.set(record.state, (stateCounts.get(record.state) ?? 0) + 1)
await save(
  'kraft-route-status-board.md',
  [
    '# Kraft route status',
    '',
    `Updated 2026-10-01. ${routeRecords.length} route identities from MP/OpenBeta: 370 current MP IDs plus 13 unresolved OpenBeta-only IDs. The 232 exact imported overlaps retain both observations; they do not prove independent corroboration.`,
    '',
    ...[...stateCounts].map(([state, count]) => `- ${state}: ${count}`),
    '',
    `${topo.routes.length} TheTopo route IDs are separately indexed as research, pending source-use/identity review; they are neither silently merged nor counted as ${topo.routes.length} additional distinct physical problems. All route rows and states are in [the CSV](kraft-content-inventory.csv).`,
    '',
    'Only 58 original source synopses currently appear in the running edition. OpenBeta has 57 nonempty route descriptions; metadata-only entries are not start/path evidence. Source-assigned faces, general corridors, eliminates, variants and finishes must be reconciled independently before drawing SVG. A render or a source topo line cannot establish the route by itself.',
    '',
    'Five exact-ID routes have conflicting MP/OpenBeta source parents (Right V1 and four Lava/Bowling Ball entries). Further exact route links have unmatched legacy OpenBeta parents. These remain blocked on identity rather than being assigned to a convenient rock.',
    '',
    'Inventory grade labels are provisional current-source labels. Every source V/Font grade is preserved; differences are not averaged. Grade-only conflicts do not establish different route identities.',
    '',
  ].join('\n'),
)

const imageRows = [
  [
    'unit_or_view',
    'production_path',
    'rights',
    'status',
    'preferred_path',
    'evidence',
  ],
]
for (const record of unitRecords)
  imageRows.push([
    record.id,
    record.name === 'The Pearl' ? '/kraft/pearl-blm.webp' : '',
    record.name === 'The Pearl'
      ? 'PD-USGov-BLM / CC-BY-2.0'
      : 'no production face asset approved',
    record.name === 'The Pearl'
      ? 'source-matched southeast context photo; not topo-approved'
      : 'BLOCKED lawful image',
    record.name.includes('Monkey Bar')
      ? 'independent reconstruction research + field-photo comparison'
      : 'lawful photo / field photography first',
    record.observations.map(observation => observation.url).join(' '),
  ])
for (const view of topo.views)
  imageRows.push([
    view.sourceId,
    '',
    'reference-only; never distribute source pixels/art',
    'BLOCKED lawful image',
    'independent legal image or original reviewed reconstruction',
    view.sourceUrl,
  ])
await save(
  'kraft-image-rights-inventory.csv',
  `${imageRows.map(row => row.map(csv).join(',')).join('\n')}\n`,
)

function distance(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const radians = (n: number) => (n * Math.PI) / 180
  const deltaLat = radians(b.latitude - a.latitude)
  const deltaLon = radians(b.longitude - a.longitude)
  const chord =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(a.latitude)) *
      Math.cos(radians(b.latitude)) *
      Math.sin(deltaLon / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord))
}
const mapLines = unitRecords.map(record => {
  const observations = record.observations.filter(
    observation => observation.coordinate,
  )
  const selected =
    observations.find(
      observation => observation.source === 'Mountain Project',
    ) ?? observations[0]
  if (!selected?.coordinate)
    return `| ${markdown(record.name)} | Missing | — | BLOCKED coordinate evidence |`
  const discrepancies =
    observations
      .filter(observation => observation !== selected && observation.coordinate)
      .map(
        observation =>
          `${observation.source}: ${Math.round(distance(selected.coordinate!, observation.coordinate!))} m`,
      )
      .join('; ') || 'No independent point comparison'
  return `| [${markdown(record.name)}](${selected.url}) | ${selected.coordinate.latitude}, ${selected.coordinate.longitude} | ${discrepancies} | Source observation only; footprint/field audit pending |`
})
await save(
  'kraft-map-placement-audit.md',
  [
    '# Kraft map placement and shape audit',
    '',
    'Updated 2026-10-01. **Not accepted as a field map.** Current map has four source-coordinate symbols, no surveyed/recognizable footprints. Full-source candidate points below are not a claim that all are plotted.',
    '',
    'Current west envelope −115.4233 excludes West Cluster records reaching −115.42506 (MP) / −115.424139 (TheTopo). Expand geographic coverage and reproject terrain/source lines together; simply changing bounds without reprojecting existing paths would misalign the map.',
    '',
    'OpenBeta area coordinates are source centroids; its synthetic bounding polygons are excluded from physical footprints. Exact importer overlap is correlated evidence. Prefer source/aerial landmarks with uncertainty, then independently reviewed footprint outlines; otherwise clearly marked proxy geometry stays quality debt.',
    '',
    '| Source unit | Provisional source point | Source discrepancy | Audit state |',
    '| --- | --- | --- | --- |',
    ...mapLines,
    '',
    'Eight MP route-to-parent coordinate outliers are preserved in `lib/kraft/mp-inventory.json` coordinateWarnings. Front Side Crack is about 1,117 km from its parent; Black Warm Up about 17.7 km; Perfect Poser about 11.3 km. Poker Chips, Monkey Bars, Monkey Crack, Plumber’s Crack and The Spreader also differ by hundreds/thousands of metres. These route observations must not replace physical-unit points.',
    '',
    'Next: compare all source points to lawful aerial rock landmarks, record point-selection rationale and accuracy, derive observable footprints, handle rock groups and absent coordinates explicitly, then run a separate fresh placement/shape critic.',
    '',
  ].join('\n'),
)

console.log(
  JSON.stringify({
    sourceCounts: contentSourceCounts,
    identities: records.length,
    unitIdentities: unitRecords.length,
    routeIdentities: routeRecords.length,
    thetopoResearch: topo.counts,
    csvRows: rows.length - 1,
  }),
)
