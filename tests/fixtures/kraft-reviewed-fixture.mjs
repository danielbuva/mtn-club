import assert from 'node:assert/strict'
import { kraftGuide } from '../../lib/kraft/data.ts'

/** Validation-only metadata and geometry; this fixture is never field evidence. */
export function syntheticReviewedGuide() {
  const guide = structuredClone(kraftGuide)
  const pearl = guide.boulders.find(rock => rock.id === 'pearl')
  const route = pearl.climbs.find(climb => climb.id === 'the-pearl')
  const face = pearl.faces.find(face => face.id === 'pearl-southeast')
  const selected = pearl.location.observations.find(
    observation => observation.selection === 'selected',
  )
  assert.equal(face.image.status, 'available')
  const review = {
    reviewer: 'SYNTHETIC VALIDATION FIXTURE; no field review performed',
    reviewedAt: '2026-10-01',
  }
  guide.id = 'synthetic-release-validation'
  guide.name = 'Synthetic validator control; never climbing beta'
  guide.status = 'field-guide'
  guide.boulders = [pearl]
  pearl.coverage.status = 'partial'
  pearl.climbs = [route]
  pearl.faces = [face]
  pearl.location.status = 'field-verified'
  pearl.location.review = { ...review, accuracyMeters: 3 }
  selected.status = 'field-verified'
  selected.review = { ...pearl.location.review }
  face.orientationStatus = 'field-verified'
  face.review = { ...review }
  face.climbIds = [route.id]
  route.status = 'field-verified'
  route.review = { ...review }
  route.geometry = [
    {
      status: 'authored',
      faceId: face.id,
      path: 'M100 100 L200 200',
      labelPoint: { x: 100, y: 100 },
      sourceIds: ['blm-pearl-photograph'],
      reviewedAt: review.reviewedAt,
    },
  ]
  return guide
}
