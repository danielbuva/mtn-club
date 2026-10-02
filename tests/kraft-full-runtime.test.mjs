import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { pilotBoulders } from '../lib/kraft/pilot-boulders.ts'
import {
  runtimeMpRoutes,
  runtimeObRoutes,
  runtimeUnits,
} from '../lib/kraft/runtime-records.ts'
import { validateGuide } from '../lib/kraft/validate.ts'

const mp = JSON.parse(
  await readFile(
    new URL('../lib/kraft/mp-inventory.json', import.meta.url),
    'utf8',
  ),
)
const ob = JSON.parse(
  await readFile(
    new URL('../lib/kraft/openbeta-inventory.json', import.meta.url),
    'utf8',
  ),
)
const climbs = kraftGuide.boulders.flatMap(unit => unit.climbs)
const sources = new Map(kraftGuide.sources.map(source => [source.id, source]))
const climbById = new Map(climbs.map(climb => [climb.id, climb]))
const byMp = new Map(
  climbs
    .filter(climb => climb.sourceIdentity.mpId)
    .map(climb => [climb.sourceIdentity.mpId, climb]),
)
const corridorIds = ['the-pearl', 'pearl-pearl-necklace']
const photographSourceIds = [
  'mp-pearl-view-reference',
  'mp-pearl-finish-reference',
]
const sourceViewRouteIds = new Set(
  kraftGuide.boulders.flatMap(unit =>
    unit.faces.flatMap(face =>
      (face.sourceViewObservations ?? []).map(
        observation => byMp.get(observation.mpRouteId).id,
      ),
    ),
  ),
)

test('actual runtime contains every exact MP route once and 13 distinct unresolved OB entries', () => {
  assert.equal(kraftGuide.status, 'catalog')
  assert.equal(kraftGuide.boulders.length, 78)
  assert.equal(climbs.length, 383)
  assert.equal(climbById.size, 383)
  assert.deepEqual(
    [...byMp.keys()].sort(),
    mp.routes.map(route => route.id).sort(),
  )
  const unresolved = climbs.filter(climb => !climb.sourceIdentity.mpId)
  assert.deepEqual(
    unresolved.map(climb => climb.sourceIdentity.openBetaIds[0]).sort(),
    ob.routes
      .filter(route => !route.originalMpId)
      .map(route => route.id)
      .sort(),
  )
  for (const climb of unresolved) {
    assert.equal(climb.id, `ob-route-${climb.sourceIdentity.openBetaIds[0]}`)
    assert.equal(climb.sourceIdentity.identityStatus, 'unresolved')
    assert.equal(climb.contentState.status, 'blocked-identity')
    assert.deepEqual(climb.faceIds, [])
  }
  assert.equal(
    unresolved.filter(climb => climb.betaStatus === 'source-synopsis').length,
    10,
  )
  assert.equal(
    unresolved.filter(climb => climb.betaStatus === 'catalog-only').length,
    3,
  )
  assert.deepEqual(validateGuide(kraftGuide), [])
})

test('full approved dossiers, verbatim grades and retrieval timestamps reach the actual runtime', async () => {
  const files = ['west-cube', 'main-a', 'main-b', 'pearl-east']
  const dossiers = (
    await Promise.all(
      files.map(async name =>
        JSON.parse(
          await readFile(
            new URL(
              `../docs/kraft-gauntlet/source-data/route-facts-${name}.json`,
              import.meta.url,
            ),
            'utf8',
          ),
        ),
      ),
    )
  ).flatMap(file => file.routes)
  assert.equal(dossiers.length, 370)
  for (const dossier of dossiers) {
    const climb = byMp.get(dossier.mpRouteId)
    assert.ok(climb, dossier.mpRouteId)
    assert.deepEqual(
      climb.routeFacts.discrepancyNotes,
      dossier.discrepancyNotes,
    )
    const original = climb.routeFacts.observations.slice(
      0,
      dossier.observations.length,
    )
    for (const [index, observation] of dossier.observations.entries()) {
      const runtime = original[index]
      assert.ok(runtime, `${dossier.mpRouteId} ${observation.url}`)
      assert.equal(sources.get(runtime.sourceId)?.url, observation.url)
      assert.deepEqual(runtime, {
        sourceId: runtime.sourceId,
        publisher: observation.source,
        retrievedAt: observation.retrievedAt,
        sourceDependency: observation.sourceDependency,
        sectionAvailability: observation.sectionAvailability,
        facts: observation.facts,
        synopsis: observation.synopsis,
        unresolved: observation.unresolved,
      })
    }
    const added = climb.routeFacts.observations.slice(
      dossier.observations.length,
    )
    assert.deepEqual(
      added.map(observation => observation.sourceId),
      corridorIds.includes(climb.id) ? photographSourceIds : [],
      climb.id,
    )
    for (const observation of added) {
      const source = sources.get(observation.sourceId)
      assert.ok(climb.sourceIds.includes(observation.sourceId))
      assert.equal(source.usage, 'factual-reference')
      assert.match(source.url, /mountainproject\.com\/photo\//)
      assert.equal(observation.publisher, 'Mountain Project')
      assert.equal(observation.retrievedAt, '2026-10-01')
      assert.equal(observation.sourceDependency, 'primary-source-page')
      assert.deepEqual(observation.sectionAvailability, {
        description: 'present',
        location: 'absent',
      })
      for (const field of ['face', 'start', 'constraints', 'approach'])
        assert.deepEqual(observation.facts[field], [])
      const field =
        observation.sourceId === 'mp-pearl-view-reference' ? 'path' : 'finish'
      assert.equal(observation.facts[field].length, 1)
      assert.deepEqual(
        observation.facts[field === 'path' ? 'finish' : 'path'],
        [],
      )
      assert.ok(observation.synopsis.length)
      assert.ok(observation.unresolved.length)
    }
  }
  for (const record of mp.routes) {
    const climb = byMp.get(record.id)
    for (const [system, key] of [
      ['V', 'v'],
      ['Font', 'font'],
      ['YDS', 'yds'],
    ]) {
      if (!record.grades[key]) continue
      assert.ok(
        climb.gradeObservations.some(
          observation =>
            observation.system === system &&
            observation.grade === record.grades[key] &&
            sources.get(observation.sourceId)?.retrievedAt ===
              record.retrievedAt,
        ),
        record.id,
      )
    }
    if (record.grades.risk)
      assert.ok(
        climb.riskObservations.some(item => item.risk === record.grades.risk),
        record.id,
      )
  }
})

test('pilot public IDs, curated beta, face memberships, assets and qualified provenance survive', () => {
  assert.equal(pilotBoulders.flatMap(unit => unit.climbs).length, 58)
  for (const pilot of pilotBoulders) {
    const unit = kraftGuide.boulders.find(item => item.id === pilot.id)
    assert.ok(unit, pilot.id)
    assert.equal(unit.name, pilot.name)
    for (const face of pilot.faces)
      assert.deepEqual(
        unit.faces.find(item => item.id === face.id),
        face,
      )
    for (const face of unit.faces.filter(
      item => !pilot.faces.some(original => original.id === item.id),
    ))
      assert.ok(face.sourceViewObservations.length, face.id)
    assert.equal(unit.location.lat, pilot.location.lat)
    assert.equal(unit.location.lon, pilot.location.lon)
    for (const observation of pilot.location.observations)
      assert.ok(
        unit.location.observations.some(
          item => JSON.stringify(item) === JSON.stringify(observation),
        ),
      )
    for (const original of pilot.climbs) {
      const climb = climbById.get(original.id)
      for (const key of [
        'name',
        'grade',
        'gradeValue',
        'gradeMaxValue',
        'description',
        'boulderAssignmentStatus',
        'boulderAssignmentNote',
        'selectedGradeSourceId',
      ])
        assert.deepEqual(climb[key], original[key], `${original.id}.${key}`)
      if (sourceViewRouteIds.has(original.id)) {
        assert.deepEqual(original.faceIds, [], original.id)
        assert.equal(climb.faceIds.length, 1)
        assert.equal(climb.geometry.length, 1)
        assert.equal(climb.geometry[0].status, 'missing')
        assert.equal(climb.geometry[0].faceId, climb.faceIds[0])
      } else assert.deepEqual(climb.faceIds, original.faceIds, original.id)
      if (
        !corridorIds.includes(original.id) &&
        !sourceViewRouteIds.has(original.id)
      )
        assert.deepEqual(climb.geometry, original.geometry, original.id)
      for (const id of original.sourceIds)
        assert.ok(climb.sourceIds.includes(id), `${original.id}:${id}`)
      for (const observation of original.gradeObservations)
        assert.ok(
          climb.gradeObservations.some(
            item => JSON.stringify(item) === JSON.stringify(observation),
          ),
          original.id,
        )
    }
  }
  const pearl = kraftGuide.boulders.find(unit => unit.id === 'pearl')
  assert.equal(pearl.faces[0].image.assetId, 'pearl-southeast-guide')
  assert.equal(pearl.faces[0].image.representation, 'reconstruction')
  assert.equal(pearl.faces[0].image.width, 1448)
  assert.equal(pearl.faces[0].image.height, 1086)
  assert.equal(
    climbById.get('split-leaning-wide-crack').boulderAssignmentStatus,
    'editorial-provisional',
  )
})

test('only the two Pearl routes gain moderate source-closed corridors on their original face', () => {
  const authored = climbs.filter(climb =>
    climb.geometry.some(geometry => geometry.status === 'authored'),
  )
  assert.deepEqual(
    authored.map(climb => climb.id).sort(),
    [...corridorIds].sort(),
  )
  for (const climb of authored) {
    assert.equal(climb.geometry.length, 1)
    const geometry = climb.geometry[0]
    assert.equal(geometry.faceId, 'pearl-southeast')
    assert.deepEqual(climb.faceIds, [geometry.faceId])
    assert.equal(geometry.confidenceLevel, 'moderate')
    assert.equal(geometry.reviewedAt, '2026-10-01')
    assert.ok(Number.isFinite(geometry.corridorWidth))
    assert.ok(geometry.corridorWidth > 0)
    assert.deepEqual(geometry.sourceIds, [
      climb.id === 'the-pearl' ? 'mp-pearl-route' : 'mp-route-107444907',
      ...photographSourceIds,
    ])
    for (const sourceId of geometry.sourceIds) {
      assert.ok(sources.has(sourceId), sourceId)
      assert.ok(climb.sourceIds.includes(sourceId), sourceId)
      assert.ok(
        climb.routeFacts.observations.some(item => item.sourceId === sourceId),
        sourceId,
      )
    }
    assert.equal(climb.contentDimensions.topo, 'corridor')
    assert.equal(climb.topoEvidence.confidenceLevel, 'moderate')
    assert.equal(climb.topoEvidence.drawingPolicy, 'general-corridor')
    assert.equal(geometry.routePathReview, undefined)
    assert.equal(climb.routePathReview, undefined)
    assert.equal(climb.status, 'source-observation')
  }
  const standing = climbById.get('the-pearl').geometry[0]
  const seated = climbById.get('pearl-pearl-necklace').geometry[0]
  assert.ok(seated.labelPoint.y > standing.labelPoint.y)
  assert.ok(seated.path.includes(standing.path.slice(1)))
})

test('source-unit memberships retain exact linked references without duplicating physical climbs', () => {
  assert.equal(
    kraftGuide.boulders.filter(unit => unit.sourceIdentity.mpId).length,
    74,
  )
  for (const record of mp.areas.filter(
    unit => unit.kind === 'source-boulder-unit',
  )) {
    const unit = kraftGuide.boulders.find(
      item => item.sourceIdentity.mpId === record.id,
    )
    assert.ok(unit, record.id)
    assert.equal(unit.location.lat, record.coordinates.latitude)
    assert.equal(unit.location.lon, record.coordinates.longitude)
    assert.equal(unit.coverage.sourceClimbCount, record.totalRoutes)
    assert.deepEqual(
      [...unit.coverage.sourceClimbIds].sort(),
      mp.routes
        .filter(route => route.parentIds.includes(record.id))
        .map(route => byMp.get(route.id).id)
        .sort(),
    )
    if (!pilotBoulders.some(pilot => pilot.id === unit.id)) {
      assert.equal(unit.unitKind, 'source-unit')
      assert.equal(unit.location.scope, 'catalog-centroid')
      for (const face of unit.faces) {
        assert.equal(face.image.status, 'missing')
        if (face.sourceViewObservations?.length) {
          assert.equal(
            face.orientationStatus,
            face.orientation === 'unknown' ? 'unknown' : 'source-observation',
          )
          for (const observation of face.sourceViewObservations)
            assert.equal(observation.mpParentId, record.id)
        } else {
          assert.equal(face.orientationStatus, 'source-observation')
          assert.ok(face.sourceFaceObservations.length)
        }
      }
    }
  }
  for (const area of ob.areas.filter(unit => unit.directRouteIds.length)) {
    const unit = kraftGuide.boulders.find(item =>
      item.catalogMemberships.some(
        membership => sources.get(membership.sourceId)?.url === area.sourceUrl,
      ),
    )
    assert.ok(unit, area.id)
    const membership = unit.catalogMemberships.find(
      item => sources.get(item.sourceId)?.url === area.sourceUrl,
    )
    const expected = area.directRouteIds.map(id => {
      const route = ob.routes.find(item => item.id === id)
      return route.originalMpId
        ? byMp.get(route.originalMpId).id
        : `ob-route-${id}`
    })
    assert.deepEqual([...membership.climbIds].sort(), expected.sort(), area.id)
    for (const id of membership.climbIds) assert.ok(climbById.has(id), id)
  }
  const sourceOnly = kraftGuide.boulders.filter(unit => !unit.climbs.length)
  assert.deepEqual(sourceOnly.map(unit => unit.name).sort(), [
    'Big Jugs Adjacent',
    'Black Warm Up Boulders',
  ])
  assert.equal(
    sourceOnly.reduce(
      (sum, unit) => sum + unit.catalogMemberships[0].climbIds.length,
      0,
    ),
    19,
  )
})

test('all runtime records state blockers and imported records retain their dependency and parent conflicts', () => {
  for (const item of [...kraftGuide.boulders, ...climbs]) {
    assert.ok(item.contentState.reasons.length, item.id)
    assert.notEqual(item.contentState.status, 'complete', item.id)
    assert.notEqual(item.contentState.confidence, 'field-verified', item.id)
  }
  for (const record of ob.routes.filter(route => route.originalMpId)) {
    const climb = byMp.get(record.originalMpId)
    assert.ok(climb.sourceIdentity.openBetaIds.includes(record.id), record.id)
    const observation = climb.routeFacts.observations.find(
      item => sources.get(item.sourceId)?.url === record.sourceUrl,
    )
    assert.equal(observation.sourceDependency, 'correlated-mp-import')
    if (record.parentReconciliation.status !== 'same-numeric-source-parent') {
      assert.equal(climb.contentState.status, 'blocked-identity')
      assert.equal(climb.parentObservations.length, 2)
      assert.match(
        climb.parentObservations[1].note,
        /differs from, or has no exact link/,
      )
    }
  }
})

test('server promotion strips raw descriptions, media references and acquisition-only fields', () => {
  function check(record) {
    if (!record || typeof record !== 'object') return
    for (const [key, value] of Object.entries(record)) {
      assert.ok(
        ![
          'description',
          'location',
          'protection',
          'photoReferenceUrls',
          'photoReferences',
          'identifierLinkMethod',
          'typeDetail',
        ].includes(key),
        key,
      )
      if (Array.isArray(value)) value.forEach(check)
      else if (typeof value === 'object') check(value)
    }
  }
  // Section availability uses description/location boolean labels, so remove
  // that permitted two-field observation before testing acquisition fields.
  const cleanRoutes = records =>
    records.map(record => ({
      ...record,
      dossier: record.dossier
        ? {
            ...record.dossier,
            observations: record.dossier.observations.map(
              ({ sectionAvailability, ...observation }) => observation,
            ),
          }
        : undefined,
      nativeFacts: record.nativeFacts
        ? (() => {
            const { sectionAvailability, ...observation } = record.nativeFacts
            return observation
          })()
        : undefined,
    }))
  check(cleanRoutes(runtimeMpRoutes))
  check(cleanRoutes(runtimeObRoutes))
  check(runtimeUnits)
})
