import { mapPath } from '@/lib/kraft/geography'
import { surfaceCandidates } from '@/lib/kraft/surface-candidates'

export function MapSurfaceCandidates() {
  return (
    <g
      className="kraft-map-surface-candidates"
      focusable="false"
      pointerEvents="none"
    >
      {surfaceCandidates.map(candidate => (
        <path
          key={candidate.id}
          data-surface-candidate={candidate.id}
          data-source-unit-ids={candidate.sourceUnitIds.join(',')}
          data-spatial-confidence={candidate.spatialConfidence}
          data-geometry-scope={candidate.geometryScope}
          d={mapPath(candidate.points, true)}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  )
}
