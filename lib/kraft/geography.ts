import geographicData from '@/public/kraft/geo-features.json'

export const MAP_WIDTH = 1000
export const MAP_HEIGHT = 800

/** WGS84 envelope. North stays at the top of the illustrated world. */
export const KRAFT_BOUNDS = {
  west: -115.4233,
  south: 36.1562,
  east: -115.4093,
  north: 36.16525,
} as const

const EARTH_RADIUS = 6378137
const radians = (degrees: number) => (degrees * Math.PI) / 180
const mercatorY = (latitude: number) =>
  EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + radians(latitude) / 2))
const left = EARTH_RADIUS * radians(KRAFT_BOUNDS.west)
const right = EARTH_RADIUS * radians(KRAFT_BOUNDS.east)
const top = mercatorY(KRAFT_BOUNDS.north)
const bottom = mercatorY(KRAFT_BOUNDS.south)

export type MapPoint = { x: number; y: number }
export type GeographicLocation = { lat: number; lon: number }
export type GeographicFeatureKind =
  | 'trail'
  | 'wash'
  | 'parking'
  | 'road'
  | 'contour'

export type GeographicFeature = {
  id: string
  kind: GeographicFeatureKind
  name: string
  points: MapPoint[]
  closed: boolean
  sourceId: string
  sourceUrl: string
  status: 'source-observation'
  informal: boolean
  intermittent: boolean
  elevation: number | null
  major: boolean
}

export function projectLocation(location: GeographicLocation): MapPoint {
  return {
    x:
      ((EARTH_RADIUS * radians(location.lon) - left) / (right - left)) *
      MAP_WIDTH,
    y: ((top - mercatorY(location.lat)) / (top - bottom)) * MAP_HEIGHT,
  }
}

export function unprojectLocation(point: MapPoint): GeographicLocation {
  const x = left + (point.x / MAP_WIDTH) * (right - left)
  const y = top - (point.y / MAP_HEIGHT) * (top - bottom)
  return {
    lon: (x / EARTH_RADIUS) * (180 / Math.PI),
    lat:
      (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) *
      (180 / Math.PI),
  }
}

/** Ground distance at the map's middle latitude; variation here is <0.02%. */
export function worldUnitsForMeters(meters: number): number {
  const middleLatitude = (KRAFT_BOUNDS.north + KRAFT_BOUNDS.south) / 2
  return (
    (meters * MAP_WIDTH) / ((right - left) * Math.cos(radians(middleLatitude)))
  )
}

export function mapPath(points: readonly MapPoint[], closed = false): string {
  return (
    points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
      .join(' ') + (closed ? ' Z' : '')
  )
}

function featureKind(value: string): GeographicFeatureKind {
  switch (value) {
    case 'trail':
    case 'wash':
    case 'parking':
    case 'road':
    case 'contour':
      return value
    default:
      throw new Error(`Unsupported Kraft geographic feature: ${value}`)
  }
}

/** These are source lines, not field-verified approaches or boulder outlines. */
export const geographicFeatures: GeographicFeature[] =
  geographicData.features.map(feature => ({
    ...feature,
    kind: featureKind(feature.kind),
    status: 'source-observation',
  }))

export const geographicLabels = [
  {
    id: 'kraft-mountain',
    name: 'Kraft Mountain',
    kind: 'mountain',
    ...projectLocation({ lat: 36.1641215, lon: -115.4215676 }),
    elevation: 1437,
    sourceId: 'osm-kraft-2026-09-30',
    sourceUrl: 'https://www.openstreetmap.org/node/7112921633',
    status: 'source-observation',
  },
] as const

export const GEOGRAPHY_ATTRIBUTION =
  'Trails, washes and parking © OpenStreetMap contributors, ODbL. Terrain: USGS 3DEP, public domain.'

export const GEOGRAPHY_LICENSE_URL = 'https://www.openstreetmap.org/copyright'
export const GEOGRAPHY_DATA_URL = '/kraft/geo-features.json'
