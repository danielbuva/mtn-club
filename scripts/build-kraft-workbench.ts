import { writeFile } from 'node:fs/promises'
import surfaceEvidence from '../docs/kraft-gauntlet/source-data/geo-surface-candidates-2026-10-01.json' with {
  type: 'json',
}
import topo from '../docs/kraft-gauntlet/source-data/thetopo-research-inventory.json' with {
  type: 'json',
}
import {
  contentSourceCounts,
  reconcileContent,
} from '../lib/kraft/content-inventory.ts'
import { kraftGuide } from '../lib/kraft/data.ts'
import {
  routeDimensionKeys,
  runtimeWorkbench,
} from './kraft-workbench-runtime.ts'

const directory = new URL('../docs/kraft-gauntlet/', import.meta.url)
const records = reconcileContent()
const routeRecords = records.filter(record => record.kind === 'route')
const unitRecords = records.filter(record => record.kind === 'source-unit')
const {
  runtimeSourceUrls,
  runtimeCanonicalIds,
  runtimeRouteStates,
  runtimeRouteCount,
} = runtimeWorkbench(kraftGuide)
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
    'topo_workflow_state',
    'runtime_record',
    'runtime_source_reference',
    'identity_state',
    'grade_state',
    'parent_state',
    'face_state',
    'topo_state',
    'image_state',
    'topo_evidence_confidence',
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
      ...routeDimensionKeys.map(
        key =>
          runtimeRouteStates.get(record.id)?.contentDimensions?.[key] ?? '',
      ),
      runtimeRouteStates.get(record.id)?.topoEvidence?.confidenceLevel ?? '',
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
    '',
    '',
    '',
    '',
    '',
    '',
    '',
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
    '',
    '',
    '',
    '',
    '',
    '',
    '',
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
    '',
    '',
    '',
    '',
    '',
    '',
    '',
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
      ? 'Original near-frontal southeast guide control; human/field review pending; other views need independent images'
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
    `The running ${kraftGuide.version} edition includes all ${kraftGuide.boulders.length} reconciled source catalogs and ${runtimeRouteCount} canonical route records. The Pearl has an original guide reconstruction and two moderate source corridors; human/field image review and exact route-path review remain pending. Every source observation, including all TheTopo units/views/routes, remains in [the inventory](kraft-content-inventory.csv). Missing imagery, faces, lines and field verification do not hide a catalog or route.`,
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
    `All ${runtimeRouteCount} canonical records are searchable, filterable and listable in the runtime. Original factual dossiers cover all 370 MP routes, with 13 native OpenBeta records retaining factual summaries where evidence exists. Topo workflow states above do not gate inclusion. Face assignments, image availability, source disagreements and authored geometry remain independent dimensions.`,
    '',
    'For route visualization, corroborated paths support narrow corridors; documented starts, general features/direction and finishes support broader moderate-confidence corridors. Exact hold sequences are not required. Face-only records remain visible without a line; unresolved paths are not drawn. A generated image or source topo line cannot establish a route by itself.',
    '',
    'Five exact-ID routes have conflicting MP/OpenBeta source parents (Right V1 and four Lava/Bowling Ball entries). Further exact route links have unmatched legacy OpenBeta parents. Their canonical records remain visible under the selected attributed source catalog, and alternate memberships/conflicts are preserved for review.',
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
    record.name === 'The Pearl' ? '/kraft/pearl-southeast-guide.webp' : '',
    record.name === 'The Pearl'
      ? 'MTN-Club-original / Original MTN Club guide asset'
      : 'no production face asset approved',
    record.name === 'The Pearl'
      ? 'original near-frontal southeast reconstruction; human/field review pending'
      : 'BLOCKED lawful image',
    record.name === 'The Pearl'
      ? 'original reconstruction quality control; human/field review pending'
      : record.name.includes('Monkey Bar')
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
  const candidate = surfaceEvidence.candidates.find(surface =>
    surface.sourceUnitIds.includes(record.id),
  )
  const audit = candidate
    ? `${candidate.spatialConfidence} confidence partial aerial surface candidate; named identity/base/field unresolved`
    : 'Source observation retained; candidate physical geometry pending'
  return `| [${markdown(record.name)}](${selected.url}) | ${selected.coordinate.latitude}, ${selected.coordinate.longitude} | ${discrepancies} | ${audit} |`
})
await save(
  'kraft-map-placement-audit.md',
  [
    '# Kraft map placement and shape audit',
    '',
    `Updated 2026-10-01. All ${kraftGuide.boulders.length} reconciled source catalogs are plotted with neutral points and local cluster choosers. Source points and catalog centroids remain qualified; no surveyed physical footprints are accepted.`,
    '',
    'The expanded west envelope −115.4260 encloses all 78 selected MP/OpenBeta source points. Terrain and source vectors were regenerated for the same geographic extent. The independent 78-record source/placement receipt is in source-data/geo-placement-review-2026-10-01.json; rendered interaction findings are in current-map-review.md.',
    '',
    'OpenBeta area coordinates are source centroids; its synthetic bounding polygons are excluded from physical footprints. Exact importer overlap is correlated evidence. Prefer source/aerial landmarks with uncertainty, then independently reviewed footprint outlines; otherwise clearly marked proxy geometry stays quality debt.',
    '',
    '| Source unit | Provisional source point | Source discrepancy | Audit state |',
    '| --- | --- | --- | --- |',
    ...mapLines,
    '',
    'Eight MP route-to-parent coordinate outliers are preserved in `lib/kraft/mp-inventory.json` coordinateWarnings. Front Side Crack is about 1,117 km from its parent; Black Warm Up about 17.7 km; Perfect Poser about 11.3 km. Poker Chips, Monkey Bars, Monkey Crack, Plumber’s Crack and The Spreader also differ by hundreds/thousands of metres. These route observations must not replace physical-unit points.',
    '',
    `${surfaceEvidence.candidates.length} low-confidence visible-surface candidates are independently source-reviewed; zero complete physical footprints or named physical identities are accepted. The separate dashed candidate layer preserves unobserved bases/shadow boundaries and tentative source association. Exact source points remain unchanged. Field verification improves candidates later and does not prevent evidence-backed geometry from appearing now. Groups, centroids and exact coincident source IDs remain distinct. See current-footprint-review.md for source and rendered review scopes.`,
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
