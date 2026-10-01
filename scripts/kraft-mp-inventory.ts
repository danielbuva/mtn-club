import type {
  AreaRecord,
  Coordinate,
  ParsedGrades,
  RouteRecord,
} from './kraft-mp-schema.ts'

const radians = (degrees: number): number => (degrees * Math.PI) / 180
function distanceMeters(a: Coordinate, b: Coordinate): number {
  const dLat = radians(b.latitude - a.latitude)
  const dLon = radians(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.latitude)) *
      Math.cos(radians(b.latitude)) *
      Math.sin(dLon / 2) ** 2
  return Math.round(6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)))
}

function sourceGrades(route: RouteRecord): ParsedGrades {
  return (
    route.detailGrade ?? {
      text: route.gradeText,
      v: route.vGrade,
      yds: route.ydsGrade,
      font: route.fontGrade,
      risk: route.risk,
      observations: route.gradeObservations,
    }
  )
}

/** Check actual cached details, including the three routes with both systems. */
export function verifyCachedMpGrades(routes: RouteRecord[]): void {
  const expected = [
    { id: '106617793', yds: '5.8', v: 'V0', font: '4', risk: 'R' },
    { id: '106629920', yds: '5.9', v: 'V1', font: '5', risk: '' },
    { id: '107185645', yds: '5.9', v: 'V2', font: '5+', risk: 'R' },
  ]
  const mixed = routes.filter(
    route => route.detailGrade?.v && route.detailGrade.yds,
  )
  if (mixed.length !== expected.length)
    throw new Error(
      `Expected 3 mixed-grade cached details, found ${mixed.length}`,
    )
  for (const grade of expected) {
    const route = routes.find(route => route.id === grade.id)
    const detail = route?.detailGrade
    if (
      !detail ||
      detail.v !== grade.v ||
      detail.yds !== grade.yds ||
      detail.font !== grade.font ||
      detail.risk !== grade.risk ||
      detail.observations.length !== 8 ||
      route?.vGrade !== grade.v ||
      route.ydsGrade !== grade.yds
    )
      throw new Error(`Cached mixed-grade regression failed for ${grade.id}`)
  }
  for (const route of routes) {
    const grade = route.detailGrade
    if (!grade || grade.yds.startsWith('V') || !grade.v)
      throw new Error(
        `Missing or misclassified literal V grade for ${route.id}`,
      )
    if (
      grade.v !== route.vGrade ||
      grade.yds !== route.ydsGrade ||
      grade.font !== route.fontGrade ||
      grade.risk !== route.risk
    )
      throw new Error(`Listing/detail grade mismatch for ${route.id}`)
  }
}

/** Keep source identities and conflicting coordinates; this does not resolve physical boulder identity. */
export function buildMpInventory(
  areas: AreaRecord[],
  routes: RouteRecord[],
  root: { id: string; url: string },
  retrievedAt: string,
) {
  const byAreaId = new Map(areas.map(area => [area.id, area]))
  const coordinateWarnings = routes.flatMap(route => {
    const parent = byAreaId.get(route.parentId)
    if (!route.coordinates || !parent?.coordinates) return []
    const distance = distanceMeters(route.coordinates, parent.coordinates)
    return distance > 15
      ? [
          {
            routeId: route.id,
            parentId: parent.id,
            distanceMeters: distance,
            reviewStatus: 'unresolved',
          },
        ]
      : []
  })
  return {
    schemaVersion: 2,
    source: 'Mountain Project',
    root,
    retrievedAt,
    usage: 'factual-reference',
    physicalUnitCaveat:
      'A leaf Mountain Project area can contain multiple physical rocks; source units are not automatically canonical physical boulders.',
    counts: {
      areas: areas.length,
      sectors: areas.filter(area => area.kind === 'sector').length,
      sourceBoulderUnits: areas.filter(
        area => area.kind === 'source-boulder-unit',
      ).length,
      routes: routes.length,
      routeDetailsRetrieved: routes.filter(
        route => route.detailStatus === 'retrieved',
      ).length,
      routeDetailsFailed: routes.filter(
        route => route.detailStatus === 'failed',
      ).length,
    },
    areas: areas.map((area, sourceIndex) => ({
      id: area.id,
      name: area.name,
      url: area.url,
      parentId: area.parentId,
      kind: area.kind,
      coordinates: area.coordinates,
      totalRoutes: area.declaredTotal,
      sourceIndex,
      retrievedAt: area.retrievedAt,
      photoReferenceUrls: area.photoReferences,
    })),
    routes: routes.map(route => ({
      id: route.id,
      name: route.name,
      url: route.url,
      parentIds: route.parentIds,
      grades: sourceGrades(route),
      types: route.routeTypes,
      coordinates: route.coordinates,
      sourceIndex: route.sourceOrderLeftToRight,
      retrievedAt: route.detailRetrievedAt,
      typeDetail: route.detailType,
    })),
    coordinateWarnings,
  }
}
