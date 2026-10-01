import { z } from 'zod'
import mainA from '../../docs/kraft-gauntlet/source-data/route-facts-main-a.json' with {
  type: 'json',
}
import mainB from '../../docs/kraft-gauntlet/source-data/route-facts-main-b.json' with {
  type: 'json',
}
import pearlEast from '../../docs/kraft-gauntlet/source-data/route-facts-pearl-east.json' with {
  type: 'json',
}
import westCube from '../../docs/kraft-gauntlet/source-data/route-facts-west-cube.json' with {
  type: 'json',
}
import mpInventory from './mp-inventory.json' with { type: 'json' }
import obInventory from './openbeta-inventory.json' with { type: 'json' }
import nativeRecords from './runtime-native-ob-facts.json' with { type: 'json' }

const coordinates = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
  })
  .nullable()
const nullableText = z.string().nullable()
const facts = z.object({
  face: z.array(z.string()),
  start: z.array(z.string()),
  path: z.array(z.string()),
  finish: z.array(z.string()),
  constraints: z.array(z.string()),
  approach: z.array(z.string()),
})
const factObservation = z.object({
  source: z.enum(['Mountain Project', 'OpenBeta']),
  sourceId: z.string(),
  url: z.string(),
  retrievedAt: z.string(),
  sourceDependency: z.enum([
    'primary-source-page',
    'correlated-mp-import',
    'origin-unresolved',
  ]),
  sectionAvailability: z.object({
    description: z.enum(['present', 'absent']),
    location: z.enum(['present', 'absent']),
  }),
  facts,
  synopsis: z.string(),
  unresolved: z.array(z.string()),
})
const mpRoute = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  parentIds: z.array(z.string()).min(1),
  coordinates,
  retrievedAt: z.string(),
  grades: z.object({
    v: z.string(),
    yds: z.string(),
    font: z.string(),
    risk: z.string(),
  }),
  dossier: z.object({
    mpParentId: z.string(),
    observations: z.array(factObservation).min(1),
    discrepancyNotes: z.array(z.string()),
  }),
})
const obRoute = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string(),
  grades: z.record(z.string(), nullableText),
  safety: nullableText,
  sourceUrl: z.string(),
  retrievedAt: z.string(),
  originalMpId: nullableText,
  parentReconciliation: z
    .object({
      openbetaParentMappedMpId: nullableText,
      currentMpParentId: z.string(),
      status: z.enum([
        'same-numeric-source-parent',
        'openbeta-parent-unmatched',
        'source-parent-conflict',
      ]),
    })
    .nullable(),
  nativeFacts: factObservation.optional(),
})
const mpUnit = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  parentId: nullableText,
  kind: z.enum(['root', 'sector', 'subarea-or-group', 'source-boulder-unit']),
  coordinates,
  totalRoutes: z.number(),
  retrievedAt: z.string(),
})
const obUnit = z.object({
  id: z.string(),
  name: z.string(),
  parentId: nullableText,
  directRouteIds: z.array(z.string()),
  coordinates,
  sourceUrl: z.string(),
  retrievedAt: z.string(),
  originalMpId: nullableText,
})

// Zod strips all acquisition-only metadata, copied OB prose and photo
// references. Only this normalized factual catalog enters kraftGuide props.
const mpInput = z
  .object({
    areas: z.array(mpUnit),
    routes: z.array(mpRoute.omit({ dossier: true })),
  })
  .parse(mpInventory)
const obInput = z
  .object({
    areas: z.array(obUnit),
    routes: z.array(obRoute.omit({ nativeFacts: true })),
  })
  .parse(obInventory)
const dossierSchema = z.object({
  routes: z.array(mpRoute.shape.dossier.extend({ mpRouteId: z.string() })),
})
const dossiers = [westCube, mainA, mainB, pearlEast].flatMap(
  file => dossierSchema.parse(file).routes,
)
const dossierByMpId = new Map(
  dossiers.map(record => [record.mpRouteId, record]),
)
if (
  dossierByMpId.size !== dossiers.length ||
  dossiers.length !== mpInput.routes.length
)
  throw new Error('Approved dossiers must cover each MP route exactly once.')
export const runtimeMpRoutes = mpInput.routes.map(record => {
  const dossier = dossierByMpId.get(record.id)
  if (!dossier || !record.parentIds.includes(dossier.mpParentId))
    throw new Error(`Missing or conflicting approved MP dossier ${record.id}`)
  return mpRoute.parse({ ...record, dossier })
})
const native = z
  .array(
    z.object({
      id: z.string(),
      facts,
      synopsis: z.string(),
      unresolved: z.array(z.string()),
    }),
  )
  .parse(nativeRecords)
const nativeByObId = new Map(native.map(record => [record.id, record]))
if (
  nativeByObId.size !== native.length ||
  native.length !== obInput.routes.filter(record => !record.originalMpId).length
)
  throw new Error(
    'Original native synopses must cover each unresolved OB entry exactly once.',
  )
export const runtimeObRoutes = obInput.routes.map(record => {
  if (record.originalMpId) return obRoute.parse(record)
  const original = nativeByObId.get(record.id)
  if (!original)
    throw new Error(`Missing original synopsis for OB entry ${record.id}`)
  const hasFacts = Object.values(original.facts).some(
    values => values.length > 0,
  )
  return obRoute.parse({
    ...record,
    nativeFacts: {
      source: 'OpenBeta',
      sourceId: record.id,
      url: record.sourceUrl,
      retrievedAt: record.retrievedAt,
      sourceDependency: 'origin-unresolved',
      sectionAvailability: {
        description: hasFacts ? 'present' : 'absent',
        location: 'absent',
      },
      facts: original.facts,
      synopsis: original.synopsis,
      unresolved: original.unresolved,
    },
  })
})
export const runtimeUnits = { mp: mpInput.areas, openBeta: obInput.areas }

export type RuntimeMpRoute = z.infer<typeof mpRoute>
export type RuntimeObRoute = z.infer<typeof obRoute>
export type RuntimeMpUnit = z.infer<typeof mpUnit>
export type RuntimeObUnit = z.infer<typeof obUnit>
export type RuntimeFactObservation = z.infer<typeof factObservation>
