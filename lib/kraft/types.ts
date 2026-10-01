export type EvidenceStatus = 'source-observation' | 'field-verified'
export type IdentityStatus = 'source-linked' | 'unresolved'
export type AssignmentStatus =
  | 'source-backed'
  | 'editorial-provisional'
  | 'unassigned'

/** Only documented redistribution grants supported by the publication checker. */
export type DistributionLicense =
  | 'CC-BY-2.0'
  | 'PD-USGov-BLM'
  | 'PD-USGov'
  | 'ODbL-1.0'

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
  photographNote?: string
  review?: { reviewer: string; reviewedAt: string }
}

export type Climb = {
  id: string
  name: string
  grade: string
  /** Lower bound of the selected source's V-grade, used with gradeMaxValue for ranges. */
  gradeValue: number
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
}

export type Boulder = {
  id: string
  name: string
  aliases: string[]
  aliasObservations?: SourceAlias[]
  areaId: string
  areaAssignmentStatus?: Exclude<AssignmentStatus, 'unassigned'>
  coverage?: {
    status: 'partial' | 'source-catalog'
    sourceId: string
    sourceClimbCount: number
  }
  location: {
    lat: number
    lon: number
    status: EvidenceStatus
    sourceIds: string[]
    note?: string
    observations?: CoordinateObservation[]
    review?: CoordinateReview
  }
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
  status: 'content-pilot' | 'field-guide'
  description: string
  areas: KraftArea[]
  boulders: Boulder[]
  sources: EvidenceSource[]
  assets: GuideAsset[]
}
