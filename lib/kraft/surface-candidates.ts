import surfaceData from '@/public/kraft/geo-surface-candidates.json'
import type { MapPoint } from './geography'

export type SpatialConfidence = 'high' | 'medium' | 'low'

export type SurfaceCandidate = {
  id: string
  sourceUnitIds: string[]
  sourceName: string
  points: MapPoint[]
  geometryScope: 'candidate-visible-surface'
  spatialConfidence: SpatialConfidence
  visibleBoundaryConfidence: SpatialConfidence
  sourceAssociationConfidence: SpatialConfidence
  physicalIdentity: 'unresolved'
  baseBoundary: 'unobserved'
  status: 'candidate'
  closed: true
  sourceId: string
  sourceUrl: string
  rasterId: number
  acquisitionDate: string
  note: string
}

function confidence(value: string): SpatialConfidence {
  switch (value) {
    case 'high':
    case 'medium':
    case 'low':
      return value
    default:
      throw new Error(`Unsupported spatial confidence: ${value}`)
  }
}

/** Partial aerial surfaces remain independent of catalog points and rock identities. */
export const surfaceCandidates: SurfaceCandidate[] = surfaceData.candidates.map(
  candidate => {
    if (
      candidate.geometryScope !== 'candidate-visible-surface' ||
      candidate.physicalIdentity !== 'unresolved' ||
      candidate.baseBoundary !== 'unobserved' ||
      candidate.status !== 'candidate' ||
      !candidate.closed
    )
      throw new Error(`Unsupported physical claim: ${candidate.id}`)
    return {
      ...candidate,
      geometryScope: 'candidate-visible-surface',
      physicalIdentity: 'unresolved',
      baseBoundary: 'unobserved',
      status: 'candidate',
      closed: true,
      spatialConfidence: confidence(candidate.spatialConfidence),
      visibleBoundaryConfidence: confidence(
        candidate.visibleBoundaryConfidence,
      ),
      sourceAssociationConfidence: confidence(
        candidate.sourceAssociationConfidence,
      ),
    }
  },
)

export const SURFACE_CANDIDATES_DATA_URL = '/kraft/geo-surface-candidates.json'
