import { memo } from 'react'
import { geographicFeatures } from '@/lib/kraft/geography'

type GeographicFeature = (typeof geographicFeatures)[number]

function featurePath(feature: GeographicFeature): string {
  return feature.points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(' ')
}

// Feature geometry comes from open geographic evidence; illustration changes stroke treatment only.
// Thousands of static contour vertices stay unchanged while pointer gestures move the camera.
export const MapTerrain = memo(function MapTerrain({
  idPrefix,
}: {
  idPrefix: string
}) {
  const contours = geographicFeatures.filter(
    feature => feature.kind === 'contour',
  )
  const washes = geographicFeatures.filter(feature => feature.kind === 'wash')
  const roads = geographicFeatures.filter(feature => feature.kind === 'road')
  const trails = geographicFeatures.filter(feature => feature.kind === 'trail')
  const parking = geographicFeatures.filter(
    feature => feature.kind === 'parking',
  )
  return (
    <g className="kraft-map-terrain" focusable="false">
      <defs>
        <pattern
          id={`${idPrefix}-grain`}
          width="27"
          height="23"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="3" cy="5" r="0.65" fill="#886645" opacity="0.1" />
          <circle cx="18" cy="17" r="0.45" fill="#886645" opacity="0.1" />
        </pattern>
        <pattern
          id={`${idPrefix}-parking`}
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <line y2="7" stroke="#857e5e" strokeWidth="0.6" opacity="0.3" />
        </pattern>
      </defs>
      <rect x="-1000" y="-1000" width="3000" height="2800" fill="#ede4ce" />
      <rect
        x="-1000"
        y="-1000"
        width="3000"
        height="2800"
        fill={`url(#${idPrefix}-grain)`}
      />
      <g className="kraft-map-contour-relief">
        {contours
          .filter(feature => feature.closed)
          .map(feature => (
            <path key={feature.id} d={`${featurePath(feature)}Z`} />
          ))}
      </g>
      <g className="kraft-map-contours">
        {contours.map(feature => (
          <path
            key={feature.id}
            d={featurePath(feature)}
            data-major={feature.major}
          />
        ))}
      </g>
      <g className="kraft-map-wash-beds">
        {washes.map(feature => (
          <path key={feature.id} d={featurePath(feature)} />
        ))}
      </g>
      <g className="kraft-map-wash-courses">
        {washes.map(feature => (
          <path
            key={feature.id}
            d={featurePath(feature)}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      <g className="kraft-map-road-casing">
        {roads.map(feature => (
          <path key={feature.id} d={featurePath(feature)} />
        ))}
      </g>
      <g className="kraft-map-roads">
        {roads.map(feature => (
          <path key={feature.id} d={featurePath(feature)} />
        ))}
      </g>
      <g className="kraft-map-trail-casing">
        {trails.map(feature => (
          <path key={feature.id} d={featurePath(feature)} />
        ))}
      </g>
      <g className="kraft-map-trails">
        {trails.map(feature => (
          <path
            key={feature.id}
            d={featurePath(feature)}
            data-informal={feature.informal}
            data-primary={feature.name === 'Kraft Mountain Loop Trail'}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      {parking.map(feature => {
        return (
          <g key={feature.id} className="kraft-map-parking">
            <path d={`${featurePath(feature)}Z`} />
            <path
              d={`${featurePath(feature)}Z`}
              fill={`url(#${idPrefix}-parking)`}
            />
          </g>
        )
      })}
    </g>
  )
})
