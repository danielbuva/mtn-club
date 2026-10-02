import type {
  ContentState,
  ParentObservation,
  SourceDependency,
  SourceIdentity,
  StructuredRouteFacts,
} from './catalog-types'

import type {
  RouteContentDimensions,
  TopoEvidence,
  TopoPathReview,
} from './route-content-types'
import type { SourceFaceObservation } from './source-face-types'
import type { SourceViewObservation } from './source-view-assignments'

export type {
  ContentState,
  ParentObservation,
  RouteFactFields,
  RouteFactObservation,
  SourceDependency,
  SourceIdentity,
  StructuredRouteFacts,
} from './catalog-types'
export type {
  RouteContentDimensions,
  TopoEvidence,
  TopoPathReview,
} from './route-content-types'
export type {
  SourceFaceLedgerRow,
  SourceFaceObservation,
  SourceFaceOrientation,
} from './source-face-types'

export type EvidenceStatus = 'source-observation' | 'field-verified'
export type IdentityStatus = 'source-linked' | 'unresolved'
export type AssignmentStatus =
  | 'source-backed'
  | 'editorial-provisional'
  | 'unassigned'

/** Documented reuse grants and original asset creation supported by the publication checker. */
export type DistributionLicense =
  | 'CC-BY-2.0'
  | 'PD-USGov-BLM'
  | 'PD-USGov'
  | 'ODbL-1.0'
  | 'MTN-Club-original'

export type DistributionRights = {
  licenseIds: DistributionLicense[]
  evidenceUrl: string
}

export type SourceAlias = {
  name: string
  sourceId: string
  identityStatus: IdentityStatus
  note?: string
}

export type CoordinateReview = {
  reviewer: string
  reviewedAt: string
  accuracyMeters: number
}

export type CoordinateObservation = {
  lat: number
  lon: number
  sourceId: string
  status: EvidenceStatus
  selection: 'selected' | 'rejected' | 'comparison'
  selectionReason: string
  review?: CoordinateReview
}

export type EvidenceSource = {
  id: string
  title: string
  url: string
  publisher: string
  accessedAt: string
  /** Exact acquisition timestamp, retained separately from the display date. */
  retrievedAt?: string
  publishedAt?: string
  usage: 'factual-reference' | 'open-data' | 'licensed-media'
  license?: string
  distribution?: DistributionRights
  note?: string
}

export type GradeObservation = {
  grade: string
  system: 'V' | 'Font' | 'YDS'
  sourceId: string
  status: EvidenceStatus
  identityStatus?: IdentityStatus
  sourceName?: string
  note?: string
  reportedAt?: string
  sourceDependency?: SourceDependency
}

export type ConditionObservation = {
  condition: string
  sourceId: string
  sourceName: string
  status: EvidenceStatus
  identityStatus: IdentityStatus
  note: string
  reportedAt?: string
}

export type GuideAsset = {
  id: string
  src: string
  kind: 'map' | 'face-photo'
  license: string
  distribution?: DistributionRights
  attribution: string
  attributionUrl?: string
  licenseUrl?: string
  modificationNote?: string
  sourceIds: string[]
}

export type FaceImage =
  | { status: 'missing'; reason: string }
  | {
      status: 'available'
      src: string
      width: number
      height: number
      alt: string
      assetId: string
      representation?: 'photograph' | 'reconstruction'
    }

export type RouteGeometry =
  | { status: 'missing'; faceId: string; reason: string }
  | {
      status: 'authored'
      faceId: string
      /** Coordinates are native photo pixels, using its width and height as the SVG viewBox. */
      path: string
      labelPoint: { x: number; y: number }
      sourceIds: string[]
      reviewedAt: string
      confidenceLevel?: 'high' | 'moderate'
      /** Approximate corridor width in the base image's native coordinates. */
      corridorWidth?: number
      routePathReview?: TopoPathReview
      continuation?: { faceId: string; description: string }
    }

export type Face = {
  id: string
  name: string
  orientation: string
  orientationStatus: EvidenceStatus | 'unknown'
  image: FaceImage
  climbIds: string[]
  sourceIds: string[]
  groupingStatus?: Exclude<AssignmentStatus, 'unassigned'>
  sourceFaceObservations?: SourceFaceObservation[]
  sourceViewObservations?: SourceViewObservation[]
  photographNote?: string
  review?: { reviewer: string; reviewedAt: string }
}

export type Climb = {
  id: string
  name: string
  grade: string
  /** Lower bound of the selected source's V-grade, used with gradeMaxValue for ranges. */
  gradeValue: number | null
  gradeMaxValue?: number
  gradeObservations: GradeObservation[]
  selectedGradeSourceId?: string
  conditionObservations?: ConditionObservation[]
  aliases?: SourceAlias[]
  status: EvidenceStatus
  betaStatus?: 'source-synopsis' | 'catalog-only'
  boulderAssignmentStatus?: Exclude<AssignmentStatus, 'unassigned'>
  boulderAssignmentNote?: string
  review?: { reviewer: string; reviewedAt: string }
  description: string
  faceIds: string[]
  faceAssignmentStatus?: AssignmentStatus
  geometry: RouteGeometry[]
  sourceIds: string[]
  risk?: string
  disagreement?: string
  contentState?: ContentState
  contentDimensions?: RouteContentDimensions
  topoEvidence?: TopoEvidence
  routePathReview?: TopoPathReview
  sourceIdentity?: SourceIdentity
  routeFacts?: StructuredRouteFacts
  parentObservations?: ParentObservation[]
  coordinateObservations?: CoordinateObservation[]
  riskObservations?: {
    risk: string
    sourceId: string
    status: EvidenceStatus
    sourceDependency: SourceDependency
    note: string
  }[]
}

export type Boulder = {
  id: string
  name: string
  unitKind?: 'physical-boulder' | 'source-unit' | 'unresolved-unit'
  unitNote?: string
  contentState?: ContentState
  sourceIdentity?: SourceIdentity
  catalogMemberships?: {
    sourceId: string
    climbIds: string[]
    note: string
  }[]
  coordinateObservations?: CoordinateObservation[]
  aliases: string[]
  aliasObservations?: SourceAlias[]
  areaId: string
  areaAssignmentStatus?: Exclude<AssignmentStatus, 'unassigned'>
  coverage?: {
    status: 'partial' | 'source-catalog'
    sourceId: string
    sourceClimbCount: number
    sourceClimbIds?: string[]
  }
  location: {
    lat: number
    lon: number
    status: EvidenceStatus
    sourceIds: string[]
    note?: string
    observations?: CoordinateObservation[]
    review?: CoordinateReview
    scope?: 'boulder-point' | 'catalog-centroid'
  } | null
  description: string
  approach: string
  sourceIds: string[]
  faces: Face[]
  climbs: Climb[]
}

export type KraftArea = { id: string; name: string; sourceIds: string[] }

export type KraftGuide = {
  id: string
  name: string
  version: string
  reviewedAt: string
  status: 'content-pilot' | 'catalog' | 'field-guide'
  description: string
  areas: KraftArea[]
  boulders: Boulder[]
  sources: EvidenceSource[]
  assets: GuideAsset[]
}
