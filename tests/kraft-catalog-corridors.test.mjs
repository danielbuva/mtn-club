import assert from 'node:assert/strict'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { deriveRouteContent } from '../lib/kraft/route-content-dimensions.ts'
import { validateGuide } from '../lib/kraft/validate.ts'
import { validateFieldGuideRelease } from '../lib/kraft/validate-release.ts'
import { validateRouteContent } from '../lib/kraft/validate-route-content.ts'

function sourceCatalogCorridor() {
  const guide = structuredClone(kraftGuide)
  const unit = guide.boulders.find(item => item.id === 'pearl')
  const climb = unit.climbs.find(item => item.id === 'the-pearl')
  unit.unitKind = 'source-unit'
  unit.unitNote =
    'Synthetic source-catalog corridor control; no field survey or production geometry is asserted.'
  const observation = climb.routeFacts.observations.find(
    item => item.sourceDependency === 'primary-source-page',
  )
  const sourceId = observation.sourceId
  // Explicit test-only source boundaries; the production Pearl dossier is kept
  // unchanged and does not supply this synthetic finish or corridor artwork.
  for (const facts of [climb.routeFacts, observation.facts]) {
    facts.start = [
      'Synthetic standing entry at the left of the southeast face.',
    ]
    facts.path = ['Synthetic general corridor across the face to the right.']
    facts.finish = ['Synthetic top-out at the right edge.']
  }
  climb.geometry = [
    {
      status: 'authored',
      faceId: climb.faceIds[0],
      path: 'M10,10 C20,20 30,30 40,40',
      labelPoint: { x: 20, y: 20 },
      sourceIds: [sourceId],
      reviewedAt: '2026-10-01',
      confidenceLevel: 'moderate',
    },
  ]
  Object.assign(climb, deriveRouteContent(climb, unit.faces))
  return { guide, unit, climb }
}

test('catalog source units can support moderate corridors without survey or field approval', () => {
  const { guide, unit, climb } = sourceCatalogCorridor()
  assert.equal(unit.unitKind, 'source-unit')
  assert.equal(climb.status, 'source-observation')
  assert.equal(climb.topoEvidence.confidenceLevel, 'moderate')
  assert.equal(climb.contentDimensions.parent, 'verified')
  assert.equal(climb.contentDimensions.face, 'known')
  assert.equal(climb.contentDimensions.topo, 'corridor')
  assert.deepEqual(validateGuide(guide), [])
  guide.status = 'field-guide'
  assert.ok(
    validateFieldGuideRelease(guide).some(error =>
      error.includes('identified physical boulders'),
    ),
  )
})

test('catalog artwork is unavailable and rejected for disputed parents, face-only facts and unresolved views', () => {
  for (const change of [
    climb => {
      climb.parentObservations[1].parentUnitId = 'cube'
    },
    climb => {
      climb.routeFacts.path = []
    },
    climb => {
      climb.routeFacts.finish = []
    },
    climb => {
      climb.faceIds = []
      climb.faceAssignmentStatus = 'unassigned'
    },
    climb => {
      climb.faceAssignmentStatus = 'editorial-provisional'
    },
    climb => {
      climb.boulderAssignmentStatus = 'editorial-provisional'
    },
  ]) {
    const { guide, unit, climb } = sourceCatalogCorridor()
    change(climb)
    Object.assign(climb, deriveRouteContent(climb, unit.faces))
    assert.equal(climb.contentDimensions.topo, 'unavailable')
    assert.ok(
      validateRouteContent(guide).some(error =>
        error.includes('authored catalog geometry requires'),
      ),
    )
  }
})

test('each authored catalog object needs its own image-space validity and own parent membership', () => {
  for (const change of [
    climb => {
      climb.geometry[0].path = 'M0,0L'
    },
    climb => {
      climb.geometry[0].labelPoint.x = -1
    },
    climb => {
      climb.geometry[0].reviewedAt = '9999-99-99'
    },
    (climb, unit) => {
      unit.faces.find(face => face.id === climb.faceIds[0]).image = {
        status: 'missing',
        reason: 'Synthetic missing image.',
      }
    },
    climb => {
      for (const parent of climb.parentObservations)
        parent.parentUnitId = 'cube'
    },
  ]) {
    const { guide, unit, climb } = sourceCatalogCorridor()
    change(climb, unit)
    Object.assign(climb, deriveRouteContent(climb, unit.faces))
    assert.ok(
      validateRouteContent(guide).some(error =>
        error.includes('authored catalog geometry requires'),
      ),
    )
  }
  const { guide, unit, climb } = sourceCatalogCorridor()
  climb.geometry.push({ ...climb.geometry[0], path: 'M0,0L' })
  Object.assign(climb, deriveRouteContent(climb, unit.faces))
  assert.equal(climb.contentDimensions.topo, 'corridor')
  assert.ok(
    validateRouteContent(guide).some(error =>
      error.includes('authored catalog geometry requires'),
    ),
  )
})
