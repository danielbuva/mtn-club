import { applyAuthoredRouteCorridors } from './authored-route-corridors.ts'
import { cubeCatalog } from './cube-catalog.ts'
import { monkeyCatalog } from './monkey-catalog.ts'
import { pearlCatalog } from './pearl-catalog.ts'
import { deriveRouteContent } from './route-content-dimensions.ts'
import {
  runtimeMpRoutes,
  runtimeObRoutes,
  runtimeUnits,
} from './runtime-records.ts'
import { buildMpRoute, buildUnlinkedObRoute } from './runtime-route-builders.ts'
import { mpNumericId, mpSourceId, obSourceId } from './runtime-sources.ts'
import {
  buildMpUnit,
  buildUnmatchedObUnit,
  sectorIds,
} from './runtime-unit-builders.ts'
import { applySourceFaceAssignments } from './source-face-assignments.ts'
import { splitCatalog } from './split-catalog.ts'
import type { Boulder, Climb, EvidenceSource, KraftArea } from './types'

export function runtimeAreas(sources: EvidenceSource[]): KraftArea[] {
  return [
    ...runtimeUnits.mp
      .filter(unit => unit.kind === 'sector')
      .map(unit => ({
        id: sectorIds[unit.id] ?? `mp-area-${unit.id}`,
        name: unit.name,
        sourceIds: [mpSourceId(unit.id, 'area', sources)],
      })),
    {
      id: 'openbeta-unresolved',
      name: 'Unresolved OpenBeta catalogs',
      sourceIds: [obSourceId('bfc783a7-d23c-5794-84c7-d7658c387b08', 'area')],
    },
  ]
}

/** Canonical route records are keyed by exact source IDs, never by name. */
export function buildRuntimeCatalog(
  pilots: Boulder[],
  sources: EvidenceSource[],
): Boulder[] {
  const pilotClimbs = new Map(
    pilots.flatMap(unit =>
      unit.climbs.map(climb => [climb.id, climb] as const),
    ),
  )
  const pilotRouteByMp = new Map<string, Climb>()
  for (const record of [
    ...cubeCatalog,
    ...splitCatalog,
    ...pearlCatalog,
    ...monkeyCatalog,
  ]) {
    const mpId = mpNumericId(record.routeUrl, 'route')
    const climb = pilotClimbs.get(record.id)
    if (!mpId || !climb)
      throw new Error(`Missing exact pilot route mapping for ${record.id}`)
    pilotRouteByMp.set(mpId, climb)
  }
  const pilotUnitByMp = new Map<string, Boulder>()
  for (const pilot of pilots) {
    const source = sources.find(
      record => record.id === pilot.coverage?.sourceId,
    )
    const mpId = source ? mpNumericId(source.url, 'area') : null
    if (!mpId)
      throw new Error(`Missing exact pilot parent mapping for ${pilot.id}`)
    pilotUnitByMp.set(mpId, pilot)
  }
  const units = runtimeUnits.mp.filter(
    unit => unit.kind === 'source-boulder-unit',
  )
  const mpUnitIds = new Map(
    units.map(unit => [
      unit.id,
      pilotUnitByMp.get(unit.id)?.id ?? `mp-area-${unit.id}`,
    ]),
  )
  const unmatchedOb = runtimeUnits.openBeta.filter(
    unit => !unit.originalMpId && unit.directRouteIds.length > 0,
  )
  const obUnitIds = new Map(
    runtimeUnits.openBeta.map(unit => [
      unit.id,
      unit.originalMpId
        ? (mpUnitIds.get(unit.originalMpId) ?? null)
        : unmatchedOb.some(record => record.id === unit.id)
          ? `ob-area-${unit.id}`
          : null,
    ]),
  )
  const context = {
    sources,
    unitIdForMp: (id: string) => mpUnitIds.get(id) ?? null,
    unitIdForOb: (id: string) => obUnitIds.get(id) ?? null,
  }
  const routes = new Map<string, Climb>()
  for (const record of runtimeMpRoutes) {
    const parent = record.parentIds[0]
    const linked = runtimeObRoutes.filter(
      item => item.originalMpId === record.id,
    )
    const climb = buildMpRoute(
      record,
      linked,
      pilotRouteByMp.get(record.id),
      pilotUnitByMp.get(parent ?? '')?.faces ?? [],
      context,
    )
    routes.set(record.id, climb)
  }
  const unlinkedObRoutes = runtimeObRoutes.filter(
    record => !record.originalMpId,
  )
  const native = new Map(
    unlinkedObRoutes.map(record => [
      record.id,
      buildUnlinkedObRoute(record, context),
    ]),
  )
  function obClimbId(id: string): string {
    const record = runtimeObRoutes.find(item => item.id === id)
    const climb = record?.originalMpId
      ? routes.get(record.originalMpId)
      : native.get(id)
    if (!climb)
      throw new Error(`Missing canonical OpenBeta membership route ${id}`)
    return climb.id
  }
  const boulders = units.map(unit => {
    const mpClimbs = runtimeMpRoutes
      .filter(record => record.parentIds.includes(unit.id))
      .map(record => {
        const climb = routes.get(record.id)
        if (!climb) throw new Error(`Missing canonical MP route ${record.id}`)
        return climb
      })
    const linkedUnits = runtimeUnits.openBeta.filter(
      record => record.originalMpId === unit.id,
    )
    const extraClimbs = unlinkedObRoutes
      .filter(record =>
        linkedUnits.some(parent => parent.id === record.parentId),
      )
      .map(record => {
        const climb = native.get(record.id)
        if (!climb)
          throw new Error(`Missing canonical native entry ${record.id}`)
        return climb
      })
    const memberships = [
      {
        sourceId: mpSourceId(unit.id, 'area', sources),
        climbIds: mpClimbs.map(climb => climb.id),
        note: 'Exact current MP source catalog membership; physical rock boundaries are not inferred.',
      },
      ...linkedUnits.map(record => ({
        sourceId: obSourceId(record.id, 'area'),
        climbIds: record.directRouteIds.map(obClimbId),
        note: 'Exact imported source parent-ID membership. Canonical routes can have qualified conflicting source memberships.',
      })),
    ]
    return buildMpUnit(
      unit,
      pilotUnitByMp.get(unit.id),
      [...mpClimbs, ...extraClimbs],
      memberships,
      linkedUnits,
      sources,
      runtimeUnits.mp,
    )
  })
  for (const unit of unmatchedOb)
    boulders.push(
      buildUnmatchedObUnit(
        unit,
        unlinkedObRoutes
          .filter(record => record.parentId === unit.id)
          .map(record => {
            const climb = native.get(record.id)
            if (!climb)
              throw new Error(`Missing unmatched native entry ${record.id}`)
            return climb
          }),
        unit.directRouteIds.map(obClimbId),
      ),
    )
  applySourceFaceAssignments(boulders)
  applyAuthoredRouteCorridors(boulders)
  for (const unit of boulders)
    for (const climb of unit.climbs)
      Object.assign(climb, deriveRouteContent(climb, unit.faces))
  // Preserve the pilot ordering as well as its public IDs and deep links.
  return [
    ...pilots.map(pilot => {
      const boulder = boulders.find(unit => unit.id === pilot.id)
      if (!boulder) throw new Error(`Missing preserved pilot ${pilot.id}`)
      return boulder
    }),
    ...boulders.filter(unit => !pilots.some(pilot => pilot.id === unit.id)),
  ]
}
