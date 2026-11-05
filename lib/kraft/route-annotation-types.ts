/** Native image coordinates, never coordinates inferred from generated texture. */
export type NativeTopoPoint = { x: number; y: number }
export type TopoHandOrder =
  | readonly ['left', 'right']
  | readonly ['right', 'left']

export type AnnotationReview = {
  reviewer: string
  reviewedAt: string
  description: string
}

export type DocumentedAnnotation = {
  /** The actual documented rule; missing beta never means an unrestricted hand. */
  rule: string
  sourceIds: readonly [string, ...string[]]
  review: AnnotationReview
  /** Dated source statement, independent of the later editorial review. */
  reportedAt?: string
}

export type UnlocatedAnnotation = {
  status: 'unlocated'
  reason: string
}

export type ReviewedAnnotationPlacement = {
  status: 'reviewed'
  image: { assetId: string; width: number; height: number }
  /** Region placement does not identify an individual hold. */
  precision: 'region' | 'hold'
  method: 'source-landmark-correspondence' | 'field-verified'
  review: AnnotationReview
}

/** A reviewed entry region does not locate either hand's required hold. */
export type ReviewedStartRegionPlacement = Omit<
  ReviewedAnnotationPlacement,
  'status' | 'precision'
> & {
  status: 'reviewed-region'
  precision: 'region'
  region: NativeTopoPoint
}

type MatchedStart = DocumentedAnnotation & {
  kind: 'matched-hands'
  placement:
    | UnlocatedAnnotation
    | ReviewedStartRegionPlacement
    | (ReviewedAnnotationPlacement & { hold: NativeTopoPoint })
}

type TwoRequiredHoldsStart = DocumentedAnnotation & {
  kind: 'two-required-holds'
  placement:
    | UnlocatedAnnotation
    | ReviewedStartRegionPlacement
    | (ReviewedAnnotationPlacement & {
        holds: readonly [NativeTopoPoint, NativeTopoPoint]
        /** Semantic hand order is supplied only when the authored placement documents it. */
        handOrder?: TopoHandOrder
      })
}

type RequiredPlusOtherStart = DocumentedAnnotation & {
  kind: 'required-plus-other'
  /** Must be stated by a source, rather than inferred from an omitted hand. */
  otherHandRule: 'unspecified' | 'lower' | 'not-described'
  placement:
    | UnlocatedAnnotation
    | ReviewedStartRegionPlacement
    | (ReviewedAnnotationPlacement & {
        requiredHold: NativeTopoPoint
        /** Optional reviewed region; omission produces no second plotted node. */
        otherHandRegion?: NativeTopoPoint
      })
}

type SeatedHandsLowStart = DocumentedAnnotation & {
  kind: 'seated-hands-low' | 'hands-low'
  placement:
    | UnlocatedAnnotation
    | ReviewedStartRegionPlacement
    | (ReviewedAnnotationPlacement & {
        region: NativeTopoPoint
        /** Optional two reviewed hand regions; no dots are inferred from the region alone. */
        hands?: readonly [NativeTopoPoint, NativeTopoPoint]
        handOrder?: TopoHandOrder
      })
}

type TwoHandsOnFeatureStart = DocumentedAnnotation & {
  kind: 'two-hands-on-feature'
  placement:
    | UnlocatedAnnotation
    | ReviewedStartRegionPlacement
    | (Omit<ReviewedAnnotationPlacement, 'precision'> & {
        precision: 'region'
        feature: NativeTopoPoint
      })
}

/** Documented entry/posture without a claim about individual hand holds. */
type StartZone = DocumentedAnnotation & {
  kind: 'start-zone'
  posture?: 'sit' | 'stand'
  placement: UnlocatedAnnotation | ReviewedStartRegionPlacement
}

export type TopoStartAnnotation =
  | MatchedStart
  | TwoRequiredHoldsStart
  | RequiredPlusOtherStart
  | SeatedHandsLowStart
  | TwoHandsOnFeatureStart
  | StartZone

/** Alternatives stay on the parent climb; they have no separate climb ID. */
export type TopoMovementAnnotation = DocumentedAnnotation & {
  kind: 'dyno-with-static-alternative'
  placement:
    | UnlocatedAnnotation
    | (ReviewedAnnotationPlacement & {
        start: NativeTopoPoint
        target: NativeTopoPoint
        /** Optional reviewed direction, not an invented static hold sequence. */
        staticPath?: readonly [
          NativeTopoPoint,
          NativeTopoPoint,
          ...NativeTopoPoint[],
        ]
      })
}

export type RouteAnnotations = {
  start?: TopoStartAnnotation
  movement?: TopoMovementAnnotation
}
