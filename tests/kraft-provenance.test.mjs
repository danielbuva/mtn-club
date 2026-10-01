import assert from 'node:assert/strict'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { validateGuide } from '../lib/kraft/validate.ts'

test('published coordinate disagreements remain structured and excluded from placement', () => {
  const rejected = kraftGuide.boulders.flatMap(boulder =>
    boulder.location.observations.filter(
      observation => observation.selection === 'rejected',
    ),
  )
  assert.deepEqual(
    rejected.map(({ sourceId, lat, lon }) => [sourceId, lat, lon]),
    [
      ['mp-perfect-poser', 36.09296, -115.3238],
      ['mp-front-crack', 45.64115, -111.00098],
      ['mp-plumbers', 36.15675, -115.42212],
      ['mp-route-107849034', 36.15693, -115.42073],
      ['mp-monkey-bars', 36.15044, -115.41981],
    ],
  )
  assert.deepEqual(validateGuide(kraftGuide), [])
  const guide = structuredClone(kraftGuide)
  guide.boulders[0].location.lat = 36.09296
  assert.match(
    validateGuide(guide).join('\n'),
    /plotted coordinate contradicts selected observation/,
  )
})

test('unknown coordinate sources and ambiguous coordinate choices block publication', () => {
  const guide = structuredClone(kraftGuide)
  const observations = guide.boulders[0].location.observations
  observations[1].sourceId = 'unknown-source'
  observations[1].selection = 'selected'
  observations[1].selectionReason = ''
  const errors = validateGuide(guide).join('\n')
  assert.match(errors, /unknown evidence source unknown-source/)
  assert.match(errors, /exactly one selected coordinate/)
  assert.match(errors, /coordinate selection rationale missing/)
})

test('same-name grades carry unresolved identity rather than an asserted south-side match', () => {
  const guide = structuredClone(kraftGuide)
  const plumbers = guide.boulders
    .flatMap(boulder => boulder.climbs)
    .find(climb => climb.id === 'plumbers-crack')
  const comparison = plumbers.gradeObservations.find(
    observation => observation.sourceId === 'kaya-plumbers',
  )
  assert.equal(comparison.identityStatus, 'unresolved')
  assert.deepEqual(plumbers.faceIds, ['split-south'])
  delete comparison.identityStatus
  assert.match(
    validateGuide(guide).join('\n'),
    /grade identity qualifier missing/,
  )
})

test('every included Monkey Bar comparison retains both publisher Font grades', () => {
  const monkey = kraftGuide.boulders.find(
    boulder => boulder.id === 'monkey-bar',
  )
  for (const [id, mpFont, topoFont] of [
    ['monkey-bars', '5+', '6B+'],
    ['hyperglide', '6C', '6C+'],
    ['monkey-bar-direct', '7B', '7B+'],
    ['monkey-bar-right', '7A', '7A+'],
    ['monkey-northeast-left', '6A', '6B'],
  ]) {
    const climb = monkey.climbs.find(climb => climb.id === id)
    assert.ok(climb, id)
    assert.ok(
      climb.gradeObservations.some(
        observation =>
          observation.system === 'Font' &&
          observation.grade === mpFont &&
          observation.sourceId.startsWith('mp-') &&
          observation.identityStatus === 'source-linked',
      ),
      id,
    )
    assert.ok(
      climb.gradeObservations.some(
        observation =>
          observation.system === 'Font' &&
          observation.grade === topoFont &&
          observation.sourceId === 'thetopo-monkey' &&
          observation.identityStatus === 'unresolved',
      ),
      id,
    )
  }
})

test('candidate boulder names cannot become canonical aliases without a linked source', () => {
  const guide = structuredClone(kraftGuide)
  const split = guide.boulders.find(boulder => boulder.id === 'split-boulder')
  split.aliasObservations.push({
    name: 'Unverified Split north rock',
    sourceId: 'thetopo-split',
    identityStatus: 'unresolved',
    note: 'Synthetic unresolved candidate; no exact identity link.',
  })
  split.aliases.push('Unverified Split north rock')
  assert.match(
    validateGuide(guide).join('\n'),
    /canonical alias has no linked source/,
  )
})

test('selected grades cannot replace a linked source grade or use unresolved comparisons', () => {
  const guide = structuredClone(kraftGuide)
  const west = guide.boulders[0].climbs.find(
    climb => climb.id === 'west-face-left',
  )
  west.grade = 'V99'
  west.gradeValue = 99
  assert.match(
    validateGuide(guide).join('\n'),
    /selected V grade has no linked source observation/,
  )

  const plumbers = guide.boulders
    .flatMap(rock => rock.climbs)
    .find(climb => climb.id === 'plumbers-crack')
  plumbers.grade = 'V1'
  plumbers.gradeValue = 1
  assert.match(
    validateGuide(guide).join('\n'),
    /plumbers-crack: selected V grade has no linked source observation/,
  )
})

test('numeric filter bounds must match the published single grade and range upper bound', () => {
  const guide = structuredClone(kraftGuide)
  const west = guide.boulders[0].climbs.find(
    climb => climb.id === 'west-face-left',
  )
  west.gradeValue = 99
  const phazed = guide.boulders
    .flatMap(rock => rock.climbs)
    .find(climb => climb.id === 'split-phazed-aka-the-hole')
  phazed.gradeMaxValue = 10
  const errors = validateGuide(guide).join('\n')
  assert.match(
    errors,
    /west-face-left: numeric filter bounds contradict selected V grade/,
  )
  assert.match(
    errors,
    /split-phazed-aka-the-hole: numeric filter bounds contradict selected V grade/,
  )
})

test('source-grade selection requires an attached source and area assignment stays explicit', () => {
  const guide = structuredClone(kraftGuide)
  const rock = guide.boulders[0]
  const west = rock.climbs.find(climb => climb.id === 'west-face-left')
  west.sourceIds = []
  delete rock.areaAssignmentStatus
  const errors = validateGuide(guide).join('\n')
  assert.match(errors, /selected V grade has no linked source observation/)
  assert.match(errors, /cube: area assignment qualifier missing or invalid/)
})

test('source catalogs retain physical membership contradictions with rationale', () => {
  const provisional = kraftGuide.boulders
    .flatMap(rock => rock.climbs)
    .filter(climb => climb.boulderAssignmentStatus === 'editorial-provisional')
  for (const id of [
    'split-leaning-wide-crack',
    'monkey-darwin-award',
    'monkey-glory-hole',
    'monkey-umpa-lumpa',
  ])
    assert.ok(
      provisional.some(climb => climb.id === id),
      id,
    )
  for (const climb of provisional) {
    assert.ok(climb.boulderAssignmentNote.trim())
    assert.deepEqual(climb.faceIds, [])
  }
  const guide = structuredClone(kraftGuide)
  const uncertain = guide.boulders
    .flatMap(rock => rock.climbs)
    .find(climb => climb.id === 'split-leaning-wide-crack')
  delete uncertain.boulderAssignmentNote
  const west = guide.boulders[0].climbs.find(
    climb => climb.id === 'west-face-left',
  )
  delete west.boulderAssignmentStatus
  const errors = validateGuide(guide).join('\n')
  assert.match(errors, /unresolved physical boulder rationale missing/)
  assert.match(
    errors,
    /physical boulder assignment qualifier missing or invalid/,
  )
})

test('undated candidate condition reports cannot be presented without identity qualifier', () => {
  const guide = structuredClone(kraftGuide)
  const mole = guide.boulders
    .flatMap(rock => rock.climbs)
    .find(climb => climb.id === 'split-the-mole')
  const observation = mole.conditionObservations[0]
  assert.equal(observation.identityStatus, 'unresolved')
  assert.equal(observation.sourceId, 'thetopo-split')
  assert.match(observation.note, /Undated/)
  delete observation.identityStatus
  assert.match(
    validateGuide(guide).join('\n'),
    /condition identity qualifier or rationale missing/,
  )
})

test('a field-guide release label requires physical review, legal photographs and authored lines', () => {
  const guide = structuredClone(kraftGuide)
  guide.status = 'field-guide'
  const errors = validateGuide(guide).join('\n')
  assert.match(
    errors,
    /field-guide release requires a reviewed legal face photograph/,
  )
  assert.match(
    errors,
    /field-guide release requires reviewed physical membership, beta and face assignment/,
  )
  assert.match(
    errors,
    /field-guide release requires reviewed authored geometry/,
  )
  assert.match(
    errors,
    /field-guide release requires reviewed field GPS with measured uncertainty/,
  )
  const rock = guide.boulders[0]
  rock.location.status = 'field-verified'
  rock.location.review = {
    reviewer: 'Synthetic fixture reviewer',
    reviewedAt: '2026-09-30',
    accuracyMeters: 3,
  }
  assert.match(
    validateGuide(guide).join('\n'),
    /cube: field-guide release requires reviewed field GPS with measured uncertainty/,
  )
})
