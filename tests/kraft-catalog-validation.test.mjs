import assert from 'node:assert/strict'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { validateGuide } from '../lib/kraft/validate.ts'
import { validateSelectedGrade } from '../lib/kraft/validate-grades.ts'

test('unlocated source catalogs remain valid only with explicit uncertainty', () => {
  const guide = structuredClone(kraftGuide)
  const unit = guide.boulders[0]
  guide.boulders = [unit]
  unit.location = null
  unit.faces = []
  unit.climbs = []
  unit.coverage = undefined
  unit.catalogMemberships = []
  unit.coordinateObservations = []
  unit.unitKind = 'unresolved-unit'
  unit.unitNote =
    'Synthetic source identity without an identified physical rock.'
  unit.contentState = {
    status: 'blocked-identity',
    confidence: 'identity-unresolved',
    reasons: ['No physical location is asserted.'],
  }
  assert.deepEqual(validateGuide(guide), [])
  delete unit.contentState
  assert.match(
    validateGuide(guide).join('\n'),
    /unlocated catalog requires an explicit evidence state/,
  )
  guide.status = 'field-guide'
  assert.match(
    validateGuide(guide).join('\n'),
    /field-guide release requires reviewed field GPS/,
  )
})

test('source catalogs validate all coverage, membership and factual references', () => {
  const guide = structuredClone(kraftGuide)
  const unit = guide.boulders[0]
  unit.coverage.sourceClimbIds = ['missing-route']
  unit.catalogMemberships = [
    {
      sourceId: 'missing-source',
      climbIds: ['missing-route'],
      note: 'Synthetic bad cross-reference.',
    },
  ]
  const climb = unit.climbs[0]
  climb.routeFacts.observations[0].sourceId = 'missing-fact-source'
  const errors = validateGuide(guide).join('\n')
  assert.match(errors, /unknown source coverage route missing-route/)
  assert.match(errors, /unknown catalog membership route missing-route/)
  assert.match(errors, /unknown evidence source missing-source/)
  assert.match(errors, /unknown evidence source missing-fact-source/)
})

test('catalog labels cannot invent field confidence or a complete route', () => {
  const guide = structuredClone(kraftGuide)
  const unit = guide.boulders[0]
  unit.contentState.confidence = 'field-verified'
  unit.climbs[0].contentState = {
    status: 'complete',
    confidence: 'field-verified',
    reasons: ['Synthetic unsupported completion claim.'],
  }
  const errors = validateGuide(guide).join('\n')
  assert.match(
    errors,
    /catalog field confidence requires reviewed physical location/,
  )
  assert.match(errors, /catalog field confidence requires reviewed field climb/)
  assert.match(
    errors,
    /complete catalog route requires reviewed physical faces and geometry/,
  )
  unit.contentState.status = 'banana'
  assert.match(
    validateGuide(guide).join('\n'),
    /invalid or missing catalog content status/,
  )
})

test('correlated facts retain acquisition identity and do not create missing sections', () => {
  const guide = structuredClone(kraftGuide)
  const climb = guide.boulders
    .flatMap(unit => unit.climbs)
    .find(route =>
      route.routeFacts.observations.some(
        observation => observation.publisher === 'OpenBeta',
      ),
    )
  const observation = climb.routeFacts.observations.find(
    item => item.publisher === 'OpenBeta',
  )
  observation.sourceDependency = 'primary-source-page'
  observation.retrievedAt = '2099-01-01T00:00:00.000Z'
  observation.sectionAvailability = {
    description: 'absent',
    location: 'absent',
  }
  observation.facts.start = ['Synthetic invented start.']
  const errors = validateGuide(guide).join('\n')
  assert.match(errors, /OpenBeta facts cannot claim primary MP evidence/)
  assert.match(errors, /invalid or future source retrieval timestamp/)
  assert.match(errors, /source retrieval contradicts referenced evidence/)
  assert.match(errors, /absent source sections cannot supply route facts/)
})

test('literal easy and non-V grades never acquire guessed V filter bounds', () => {
  const climb = structuredClone(kraftGuide.boulders[0].climbs[0])
  for (const grade of ['V-easy', 'VB']) {
    climb.grade = grade
    climb.gradeValue = -1
    climb.gradeMaxValue = undefined
    climb.gradeObservations.push({
      grade,
      system: 'V',
      sourceId: climb.selectedGradeSourceId,
      status: 'source-observation',
      identityStatus: 'source-linked',
      sourceName: climb.name,
    })
    assert.deepEqual(validateSelectedGrade(climb), [])
    climb.gradeValue = 0
    assert.match(
      validateSelectedGrade(climb).join('\n'),
      /numeric filter bounds contradict/,
    )
  }
  climb.grade = '5.9'
  climb.gradeValue = null
  climb.gradeObservations.push({
    grade: '5.9',
    system: 'YDS',
    sourceId: climb.selectedGradeSourceId,
    status: 'source-observation',
    identityStatus: 'source-linked',
    sourceName: climb.name,
  })
  assert.deepEqual(validateSelectedGrade(climb), [])
  climb.gradeMaxValue = 1
  assert.match(
    validateSelectedGrade(climb).join('\n'),
    /non-V grade cannot have numeric V filter bounds/,
  )
})
