import type { RouteAnnotations } from '../../lib/kraft/route-annotation-types'

// Synthetic rules and reviewed coordinates exercise the renderer only.
// These records are never Kraft source evidence or publication content.
const review = {
  reviewer: 'Synthetic renderer fixture',
  reviewedAt: '2026-09-30',
  description: 'Original synthetic calibration-grid coordinates.',
}
const placement = {
  status: 'reviewed',
  image: { assetId: 'test-grid', width: 1000, height: 750 },
  precision: 'hold',
  method: 'source-landmark-correspondence',
  review,
} as const

export const matchedFixtureAnnotations = {
  start: {
    kind: 'matched-hands',
    rule: 'Synthetic fixture: both hands match the same start hold',
    sourceIds: ['test-fixture'],
    review,
    placement: { ...placement, hold: { x: 260, y: 640 } },
  },
} satisfies RouteAnnotations

export const alternativeFixtureAnnotations = {
  start: {
    kind: 'required-plus-other',
    rule: 'Synthetic fixture: one required hand; the other starts lower',
    otherHandRule: 'lower',
    sourceIds: ['test-fixture'],
    review,
    placement: {
      ...placement,
      precision: 'region',
      requiredHold: { x: 750, y: 640 },
      otherHandRegion: { x: 785, y: 680 },
    },
  },
  movement: {
    kind: 'dyno-with-static-alternative',
    rule: 'Synthetic fixture: dyno and static options belong to this same climb',
    sourceIds: ['test-fixture'],
    review,
    placement: {
      ...placement,
      start: { x: 680, y: 475 },
      target: { x: 360, y: 85 },
      staticPath: [
        { x: 750, y: 640 },
        { x: 680, y: 475 },
        { x: 560, y: 330 },
        { x: 360, y: 85 },
      ],
    },
  },
} satisfies RouteAnnotations

export const annotationFixtureContext = {
  sourceIds: ['test-fixture'],
  image: { assetId: 'test-grid', width: 1000, height: 750 },
  reviewedBefore: '2026-10-01',
}

export const regionFixtureAnnotations = {
  start: {
    ...matchedFixtureAnnotations.start,
    placement: {
      status: 'reviewed-region',
      precision: 'region',
      region: { x: 260, y: 640 },
      image: placement.image,
      method: placement.method,
      review,
    },
  },
} satisfies RouteAnnotations

export const seatedFixtureAnnotations = {
  ...alternativeFixtureAnnotations,
  start: {
    kind: 'seated-hands-low',
    rule: 'Synthetic seated fixture: both hands start low in separate hand regions',
    sourceIds: ['test-fixture'],
    review,
    placement: {
      ...placement,
      precision: 'region',
      region: { x: 750, y: 640 },
      hands: [
        { x: 725, y: 640 },
        { x: 785, y: 680 },
      ],
      handOrder: ['left', 'right'],
    },
  },
} satisfies RouteAnnotations
