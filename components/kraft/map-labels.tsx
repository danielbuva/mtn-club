import type { MapPoint } from '@/lib/kraft/geography'
import { geographicFeatures, geographicLabels } from '@/lib/kraft/geography'

type Bounds = { minX: number; minY: number; maxX: number; maxY: number }
interface MapLabelsProps {
  pixelsPerUnit: number
  zoom: number
  bounds: Bounds
}
const primaryTrail = geographicFeatures.find(
  feature => feature.id === 'osm-315369605-0',
)
const mainWash = geographicFeatures.find(
  feature => feature.id === 'osm-315467840-0',
)
const parking = geographicFeatures.filter(feature => feature.kind === 'parking')
const secondaryTrails = geographicFeatures.filter(
  feature =>
    feature.kind === 'trail' &&
    feature.name !== 'Mapped path' &&
    feature.name !== 'Kraft Mountain Loop Trail',
)

function nearestPoint(
  points: readonly MapPoint[],
  target: MapPoint,
): MapPoint | undefined {
  return points.reduce<MapPoint | undefined>(
    (nearest, point) =>
      !nearest ||
      Math.hypot(point.x - target.x, point.y - target.y) <
        Math.hypot(nearest.x - target.x, nearest.y - target.y)
        ? point
        : nearest,
    undefined,
  )
}

export function MapLabels({ pixelsPerUnit, zoom, bounds }: MapLabelsProps) {
  function inView(point: MapPoint, padding = 0) {
    return (
      point.x >= bounds.minX + padding / pixelsPerUnit &&
      point.x <= bounds.maxX - padding / pixelsPerUnit &&
      point.y >= bounds.minY + padding / pixelsPerUnit &&
      point.y <= bounds.maxY - padding / pixelsPerUnit
    )
  }
  const compact = (bounds.maxX - bounds.minX) * pixelsPerUnit < 340
  const trailPoint =
    primaryTrail && nearestPoint(primaryTrail.points, { x: 487, y: 548 })
  const washPoint =
    mainWash && nearestPoint(mainWash.points, { x: 670, y: 640 })

  return (
    <g className="kraft-map-labels" pointerEvents="none">
      {geographicLabels
        .filter(label => inView(label, 65))
        .map(label => (
          <g
            key={label.id}
            transform={`translate(${label.x} ${label.y}) scale(${1 / pixelsPerUnit})`}
          >
            <path className="kraft-map-summit" d="M0-7 6 4-6 4Z" />
            <text className="kraft-map-landmark" x="13" y="-1">
              {label.name.toUpperCase()}
            </text>
            <text className="kraft-map-landmark-subtitle" x="13" y="12">
              {label.elevation} M
            </text>
          </g>
        ))}
      {parking.map(feature => {
        const point = {
          x:
            feature.points.reduce((total, item) => total + item.x, 0) /
            feature.points.length,
          y:
            feature.points.reduce((total, item) => total + item.y, 0) /
            feature.points.length,
        }
        return inView(point, 24) ? (
          <g
            key={feature.id}
            className="kraft-map-parking-label"
            transform={`translate(${point.x} ${point.y}) scale(${1 / pixelsPerUnit})`}
          >
            <rect x="-11" y="-13" width="22" height="25" />
            <text
              className="kraft-map-parking-letter"
              textAnchor="middle"
              y="5"
            >
              P
            </text>
            <text className="kraft-map-place-name" x="19" y="4">
              Kraft parking
            </text>
          </g>
        ) : null
      })}
      {trailPoint && inView(trailPoint, 80) && (
        <g
          className="kraft-map-primary-label"
          transform={`translate(${trailPoint.x} ${trailPoint.y}) scale(${1 / pixelsPerUnit})`}
        >
          <title>Kraft Mountain Loop Trail</title>
          <path
            className="kraft-map-label-leader"
            d={compact ? 'M0 7V38H36' : 'M0 7V35'}
          />
          <text textAnchor="middle" x={compact ? 62 : 0} y={compact ? 57 : 49}>
            {compact ? 'Kraft Loop Trail' : 'Kraft Mountain Loop Trail'}
          </text>
        </g>
      )}
      {washPoint && inView(washPoint, 60) && (
        <g
          className="kraft-map-wash-label"
          transform={`translate(${washPoint.x} ${washPoint.y}) scale(${1 / pixelsPerUnit})`}
        >
          <text textAnchor="end" x="-13" y="3">
            dry wash
          </text>
        </g>
      )}
      {zoom >= 1.7 &&
        secondaryTrails.map(feature => {
          const point = feature.points[Math.floor(feature.points.length / 2)]
          return point && inView(point, 90) ? (
            <text
              key={feature.id}
              className="kraft-map-secondary-label"
              x={point.x}
              y={point.y - 12 / pixelsPerUnit}
              fontSize={11 / pixelsPerUnit}
              textAnchor="middle"
            >
              {feature.name}
            </text>
          ) : null
        })}
    </g>
  )
}
