export type SourceFaceOrientation =
  | 'north'
  | 'northeast'
  | 'east'
  | 'southeast'
  | 'south'
  | 'southwest'
  | 'west'
  | 'northwest'

export type SourceFaceRule = {
  mpRouteId: string
  mpParentId: string
  orientation: SourceFaceOrientation
}

/** A source-observed aspect, without a surveyed face division or photo view. */
export type SourceFaceObservation = {
  mpRouteId: string
  mpParentId: string
  sourceId: string
  retrievedAt: string
  orientation: SourceFaceOrientation
  sourceFact: string
  scope: 'source-catalog-face'
  note: string
}

export type SourceFaceLedgerRow = SourceFaceObservation & {
  climbId: string
  unitId: string
  faceId: string
  clusterId: string
}
