import assert from 'node:assert/strict'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { validateRouteAnnotations } from '../lib/kraft/route-annotations.ts'

const pearl = kraftGuide.boulders.find(boulder => boulder.id === 'pearl')
const face = pearl.faces.find(item => item.id === 'pearl-southeast')
const routes = ['the-pearl', 'pearl-pearl-necklace'].map(id => {
  const climb = pearl.climbs.find(item => item.id === id)
  const geometry = climb.geometry.find(item => item.status === 'authored')
  return { climb, geometry, start: geometry.annotations.start }
})

test('Pearl rules retain documented separate holds and unmatched lower sit start', () => {
  const [standing, seated] = routes
  assert.equal(standing.start.kind, 'two-required-holds')
  assert.match(
    standing.start.rule,
    /Left hand.*pocket.*right hand.*lower crimp/i,
  )
  assert.equal(seated.start.kind, 'seated-hands-low')
  assert.match(seated.start.rule, /both hands lower.*standing start/i)
  for (const { climb, start } of routes) {
    assert.equal(start.rule, climb.routeAnnotations.start.rule)
    assert.equal(climb.routeAnnotations.movement, undefined)
    for (const sourceId of start.sourceIds) {
      const observation = climb.routeFacts.observations.find(
        item => item.sourceId === sourceId,
      )
      assert.ok(observation.facts.start.includes(start.rule))
    }
  }
})

test('uncorroborated hand correspondence never splits the reviewed Pearl entry into decorative nodes', () => {
  for (const { climb, geometry, start } of routes) {
    const placement = start.placement
    assert.equal(placement.status, 'reviewed-region')
    assert.equal(placement.precision, 'region')
    for (const key of [
      'holds',
      'hands',
      'handOrder',
      'requiredHold',
      'otherHandRegion',
    ])
      assert.equal(placement[key], undefined)
    assert.deepEqual(
      validateRouteAnnotations(geometry.annotations, {
        sourceIds: climb.sourceIds,
        image: face.image,
        reviewedBefore: kraftGuide.reviewedAt,
      }),
      [],
    )
    assert.notEqual(start.kind, 'matched-hands')
    assert.equal(geometry.annotations.movement, undefined)
    assert.equal(geometry.confidenceLevel, 'moderate')
  }
  assert.ok(
    routes[1].start.placement.region.y > routes[0].start.placement.region.y,
  )
  assert.match(
    routes[0].start.placement.review.description,
    /awaits photographic confirmation/,
  )
  assert.match(
    routes[1].start.placement.review.description,
    /individual low holds.*not established/i,
  )
})
