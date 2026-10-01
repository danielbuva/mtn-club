import type { Climb, KraftGuide } from '../lib/kraft/types.ts'

export const routeDimensionKeys = [
  'identity',
  'grade',
  'parent',
  'face',
  'topo',
  'image',
] as const

type RuntimeWorkbench = {
  runtimeSourceUrls: Set<string>
  runtimeCanonicalIds: Set<string>
  runtimeRouteStates: Map<string, Climb>
  runtimeRouteCount: number
}

/** Runtime presence follows exact source IDs, independently of topo readiness. */
export function runtimeWorkbench(guide: KraftGuide): RuntimeWorkbench {
  const sources = new Map(guide.sources.map(source => [source.id, source]))
  const sourceIds = [
    ...guide.areas.flatMap(area => area.sourceIds),
    ...guide.boulders.flatMap(boulder => [
      ...boulder.sourceIds,
      ...boulder.climbs.flatMap(climb => climb.sourceIds),
    ]),
  ]
  const runtimeSourceUrls = new Set(
    sourceIds.flatMap(id => {
      const source = sources.get(id)
      return source ? [source.url] : []
    }),
  )
  const runtimeCanonicalIds = new Set(
    guide.areas.flatMap(area =>
      area.sourceIds.flatMap(id => {
        const match = sources
          .get(id)
          ?.url.match(/mountainproject\.com\/area\/(\d+)/)
        return match ? [`mp-area-${match[1]}`] : []
      }),
    ),
  )
  const runtimeRouteStates = new Map<string, Climb>()
  for (const boulder of guide.boulders) {
    const identity = boulder.sourceIdentity
    const unitKeys = identity?.mpId
      ? [`mp-area-${identity.mpId}`]
      : (identity?.openBetaIds.map(id => `ob-area-${id}`) ?? [])
    for (const key of unitKeys) runtimeCanonicalIds.add(key)
    for (const climb of boulder.climbs) {
      const routeIdentity = climb.sourceIdentity
      const keys = routeIdentity?.mpId
        ? [`mp-route-${routeIdentity.mpId}`]
        : (routeIdentity?.openBetaIds.map(id => `ob-route-${id}`) ?? [])
      for (const key of keys) {
        runtimeCanonicalIds.add(key)
        runtimeRouteStates.set(key, climb)
      }
    }
  }
  return {
    runtimeSourceUrls,
    runtimeCanonicalIds,
    runtimeRouteStates,
    runtimeRouteCount: guide.boulders.reduce(
      (count, boulder) => count + boulder.climbs.length,
      0,
    ),
  }
}
