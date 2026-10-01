/** Checked source relationships are distinct from field verification. */
export type RouteContentDimensions = {
  /** Exact source-record identity, not physical coidentity or field review. */
  identity: 'verified' | 'disputed'
  grade: 'verified' | 'disputed' | 'unknown'
  /** Checked source-catalog membership; physical membership stays qualified. */
  parent: 'verified' | 'disputed'
  face: 'known' | 'provisional' | 'unknown'
  /** Actual authored SVG availability, independent of source evidence class. */
  topo: 'reviewed' | 'corridor' | 'unavailable'
  image: 'available' | 'reconstruction' | 'missing'
}

export type TopoEvidence = {
  confidenceLevel: 'high' | 'moderate' | 'face-only' | 'unresolved'
  drawingPolicy: 'reviewed-line' | 'general-corridor' | 'face-only' | 'no-draw'
  sourceIds: string[]
  reasons: string[]
}

export type TopoPathReview = {
  scope: 'specific-route-path'
  method: 'critic-route-path-review' | 'independent-source-corroboration'
  reviewer: string
  reviewedAt: string
  sourceIds: string[]
  description: string
  /** Exact SVG path covered by a visual path review, when one exists. */
  reviewedSvgPath?: string
}
