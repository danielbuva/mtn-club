import type { MapPoint } from './geography'
import type { Boulder } from './types'

export type CatalogMapPoint = { id: string; point: MapPoint }
export type CatalogMapCluster = { ids: string[]; point: MapPoint }

/** Overlapping hit targets activate the nearest visible aggregate center. */
export function nearestCatalogCluster(
  clusters: readonly CatalogMapCluster[],
  point: MapPoint,
): CatalogMapCluster | undefined {
  return clusters.reduce<CatalogMapCluster | undefined>(
    (nearest, cluster) =>
      !nearest ||
      Math.hypot(cluster.point.x - point.x, cluster.point.y - point.y) <
        Math.hypot(nearest.point.x - point.x, nearest.point.y - point.y)
        ? cluster
        : nearest,
    undefined,
  )
}

/** Screen-space aggregates have no physical-rock identity or footprint meaning. */
export function clusterCatalogPoints(
  points: readonly CatalogMapPoint[],
  pixelsPerUnit: number,
  targetPixels = 44,
): CatalogMapCluster[] {
  const remaining = new Set(points.map(point => point.id))
  const byId = new Map(points.map(point => [point.id, point]))
  const clusters: CatalogMapCluster[] = []
  for (const candidate of points) {
    if (!remaining.delete(candidate.id)) continue
    const members = [candidate]
    for (const id of remaining) {
      const next = byId.get(id)
      // Every pair stays within the screen diameter; proximity chains cannot
      // collapse catalogs from opposite ends of Kraft into one average point.
      if (
        next &&
        members.every(
          member =>
            Math.hypot(
              next.point.x - member.point.x,
              next.point.y - member.point.y,
            ) *
              pixelsPerUnit <
            targetPixels,
        )
      ) {
        remaining.delete(id)
        members.push(next)
      }
    }
    clusters.push({
      ids: members.map(member => member.id),
      point: {
        x:
          members.reduce((sum, member) => sum + member.point.x, 0) /
          members.length,
        y:
          members.reduce((sum, member) => sum + member.point.y, 0) /
          members.length,
      },
    })
  }
  return clusters
}

export function catalogClimbCount(boulder: Boulder): number {
  return boulder.coverage?.sourceClimbCount ?? boulder.climbs.length
}
