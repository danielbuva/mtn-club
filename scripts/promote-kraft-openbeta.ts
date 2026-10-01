import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { parseJsonValue } from './kraft-openbeta-serialization.ts'

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type ObjectJson = { [key: string]: Json }
const object = (value: Json | undefined): ObjectJson =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value
    : {}
const array = (value: Json | undefined): Json[] =>
  Array.isArray(value) ? value : []
const string = (value: Json | undefined): string =>
  typeof value === 'string' ? value : ''
function nilUuidV5(name: string): string {
  const bytes = createHash('sha1')
    .update(Buffer.alloc(16))
    .update(name)
    .digest()
    .subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-')
}
const ob = object(
  parseJsonValue(
    await readFile('.tmp/kraft-gauntlet/research/openbeta-kraft.json', 'utf8'),
  ),
)
const mp = object(
  parseJsonValue(await readFile('lib/kraft/mp-inventory.json', 'utf8')),
)
const mpAreas = new Map(
  array(mp.areas)
    .map(object)
    .map(area => [nilUuidV5(string(area.id)), area]),
)
const mpRoutes = new Map(
  array(mp.routes)
    .map(object)
    .map(route => [nilUuidV5(string(route.id)), route]),
)
const areas = array(ob.areas)
  .map(object)
  .map(area => {
    const metadata = object(area.metadata)
    const linkedMpArea = mpAreas.get(string(area.id))
    if (linkedMpArea) area.originalMpId = string(linkedMpArea.id)
    const clean: ObjectJson = {
      id: area.id ?? null,
      name: area.name ?? null,
      parentId: area.parentId ?? null,
      childIds: area.childIds ?? [],
      directRouteIds: array(area.climbs)
        .map(object)
        .map(route => route.id ?? null),
      kind: !area.parentId
        ? 'root'
        : metadata.leaf
          ? 'leaf-source-unit'
          : 'source-container',
      leaf: metadata.leaf ?? null,
      isBoulder: metadata.isBoulder ?? null,
      coordinates: {
        latitude: metadata.lat ?? null,
        longitude: metadata.lng ?? null,
      },
      coordinateCaution:
        'Source area centroid only; not field verified. Source bbox/polygon is synthetic extent, not physical rock footprint.',
      declaredTotal: area.totalClimbs ?? null,
      pathTokens: area.pathTokens ?? [],
      sourceUrl: area.sourceUrl ?? null,
      retrievedAt: area.retrievedAt ?? null,
      description: object(area.factualContent).description ?? '',
      areaLocation: object(area.factualContent).areaLocation ?? null,
      originalMpId: linkedMpArea?.id ?? null,
      originalMpUrl: linkedMpArea?.url ?? null,
      identifierLinkMethod: linkedMpArea
        ? 'Exact match to documented OpenBeta importer uuidv5(MP area numeric ID, NIL namespace).'
        : 'No exact current Kraft MP numeric-ID match. Do not infer identity from name.',
    }
    return clean
  })
const routes = array(ob.areas)
  .map(object)
  .flatMap(area =>
    array(area.climbs)
      .map(object)
      .map(route => {
        const linkedMpRoute = mpRoutes.get(string(route.id))
        if (linkedMpRoute) route.originalMpId = string(linkedMpRoute.id)
        const importedMpParentId =
          areas.find(parent => parent.id === route.parentId)?.originalMpId ??
          null
        return {
          id: route.id ?? null,
          name: route.name ?? null,
          parentId: route.parentId ?? null,
          grades: route.grades ?? null,
          safety: route.safety ?? null,
          firstAscent: route.fa ?? null,
          type: route.type ?? null,
          sourceOrderLeftToRight: object(route.metadata).leftRightIndex ?? null,
          description: object(route.content).description ?? '',
          location: object(route.content).location ?? null,
          protection: object(route.content).protection ?? null,
          sourceUrl: route.sourceUrl ?? null,
          retrievedAt: route.retrievedAt ?? null,
          originalMpId: linkedMpRoute?.id ?? null,
          originalMpUrl: linkedMpRoute?.url ?? null,
          identifierLinkMethod: linkedMpRoute
            ? 'Exact match to documented OpenBeta importer uuidv5(MP route numeric ID, NIL namespace).'
            : 'No exact current Kraft MP numeric-ID match. Native/other/deleted/import-fallback identity unresolved.',
          sourceDependency: linkedMpRoute
            ? 'Mountain Project import lineage; corroborating source entry does not independently verify route facts.'
            : 'Origin unresolved; do not count as independent corroboration solely because hosted by OpenBeta.',
          parentReconciliation: linkedMpRoute
            ? {
                openbetaParentMappedMpId: importedMpParentId,
                currentMpParentId: array(linkedMpRoute.parentIds)[0] ?? null,
                status: importedMpParentId
                  ? importedMpParentId === array(linkedMpRoute.parentIds)[0]
                    ? 'same-numeric-source-parent'
                    : 'source-parent-conflict'
                  : 'openbeta-parent-unmatched',
              }
            : null,
        } satisfies ObjectJson
      }),
  )
const linkedAreaCount = areas.filter(area => area.originalMpId).length
const linkedRouteCount = routes.filter(route => route.originalMpId).length
const provenance: ObjectJson = {
  sourceId: 'openbeta',
  rootId: object(ob.source).rootId ?? null,
  sourceUrl: object(ob.source).rootUrl ?? null,
  retrievedAt: ob.fetchedAt ?? null,
  licenseId: 'CC0-1.0',
  licenseScope: 'Climbing content excluding photos.',
  licenseEvidence: [
    {
      url: 'https://openbeta.io/about',
      inspectedOn: '2026-10-01',
      claim:
        'OpenBeta states all climbing content excluding photos is Creative Commons Public Domain.',
    },
    {
      url: 'https://github.com/OpenBeta/climbing-data/blob/main/LICENSE',
      inspectedOn: '2026-10-01',
      claim:
        'OpenBeta climbing-data repository has CC0 1.0 Universal legal code.',
    },
  ],
  excludedContent:
    'All photographs/media, media tagging/topo artwork, UI artwork and source code are excluded from redistributed factual seed.',
  acquisition:
    'Public OpenBeta area HTML serialized structured records, recursively following actual rendered child links. Official API fallback attempts timed out/returned 502; successful SSR traversal covers entire advertised hierarchy.',
  coverage: {
    areasIncludingRoot: areas.length,
    descendantAreas: areas.length - 1,
    leafSourceUnits: areas.filter(area => area.leaf).length,
    directRootAreas: array(
      object(ob.completeness).directRootAreaCount
        ? array(ob.areas).map(object)[0].childIds
        : [],
    ).length,
    routes: routes.length,
    rootAdvertisedRoutes:
      object(ob.completeness).rootAdvertisedTotalClimbs ?? null,
    missingAreas: object(ob.completeness).missingAreaIds ?? [],
    exactMpAreaMatches: linkedAreaCount,
    exactMpRouteMatches: linkedRouteCount,
  },
  originalSourceDependency:
    'OpenBeta USA import is historically Mountain Project-derived. Exact UUIDv5 matches establish identifier lineage, not independent real-world evidence, current agreement or physical-boulder membership.',
  importerEvidence: [
    {
      url: 'https://github.com/OpenBeta/openbeta-graphql/blob/develop/src/db/import/usa/AreaTree.ts',
      rule: 'Leaf source units use UUIDv5(MP numeric area ID, NIL); nonleaf containers use UUIDv5(pipe-delimited path, NIL).',
    },
    {
      url: 'https://github.com/OpenBeta/openbeta-graphql/blob/develop/src/db/import/ClimbTransformer.ts',
      rule: 'Routes use UUIDv5(MP route ID, NIL), with MP sector ID + dot + left-right index fallback when MP route ID is empty.',
    },
  ],
  geometryCaution:
    'Coordinates are source centroids. The OpenBeta bbox/polygon rows are generated convex coverage extents or about 100 m squares, not measured boulder footprints. Do not use them as rock outlines.',
  missingFields:
    'Public SSR route records omit original MP IDs, route coordinates, location/protection details in many cases. Recovered MP IDs are deterministic exact-importer links; absent descriptions remain absent. No coordinate or geometry filled from guesswork.',
  unresolvedIdentities: routes
    .filter(route => !route.originalMpId)
    .map(route => ({
      id: route.id,
      name: route.name,
      parentId: route.parentId,
      sourceUrl: route.sourceUrl,
    })),
}
const durable: ObjectJson = {
  schemaVersion: 1,
  source: {
    id: 'openbeta',
    name: 'OpenBeta',
    rootUrl: provenance.sourceUrl,
    licenseId: 'CC0-1.0',
    licenseEvidenceUrl: 'https://openbeta.io/about',
    photosExcluded: true,
    sourceDependency:
      'Imported Mountain Project lineage is correlated source evidence; native records not automatically independent.',
  },
  rootId: provenance.rootId,
  generatedAt: ob.fetchedAt ?? null,
  counts: provenance.coverage,
  areas,
  routes,
}
await mkdir('docs/kraft-gauntlet/source-data', { recursive: true })
await writeFile(
  'lib/kraft/openbeta-inventory.json',
  JSON.stringify(durable, null, 2) + '\n',
)
await writeFile(
  'docs/kraft-gauntlet/source-data/openbeta-provenance.json',
  JSON.stringify(provenance, null, 2) + '\n',
)
await writeFile(
  '.tmp/kraft-gauntlet/research/openbeta-kraft.json',
  JSON.stringify(ob, null, 2) + '\n',
)
await writeFile(
  '.tmp/kraft-gauntlet/research/openbeta-mp-crosswalk.json',
  JSON.stringify(
    {
      matchedAreas: linkedAreaCount,
      matchedRoutes: linkedRouteCount,
      areas: areas.map(a => ({
        id: a.id,
        name: a.name,
        originalMpId: a.originalMpId,
        originalMpUrl: a.originalMpUrl,
      })),
      routes: routes.map(r => ({
        id: r.id,
        name: r.name,
        parentId: r.parentId,
        originalMpId: r.originalMpId,
        originalMpUrl: r.originalMpUrl,
        parentReconciliation: r.parentReconciliation,
        grades: r.grades,
      })),
    },
    null,
    2,
  ) + '\n',
)
console.log(JSON.stringify(provenance.coverage, null, 2))
