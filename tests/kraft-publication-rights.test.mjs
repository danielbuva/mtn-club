import assert from 'node:assert/strict'
import test from 'node:test'
import { kraftGuide } from '../lib/kraft/data.ts'
import { validateGuide } from '../lib/kraft/validate.ts'
import { syntheticReviewedGuide } from './fixtures/kraft-reviewed-fixture.mjs'

test('documented production rights and the synthetic complete-release control pass', () => {
  assert.deepEqual(validateGuide(kraftGuide), [])
  assert.deepEqual(validateGuide(syntheticReviewedGuide()), [])
})

test('redistribution prohibition cannot pass a pilot or a synthetic field release', () => {
  for (const original of [kraftGuide, syntheticReviewedGuide()]) {
    const guide = structuredClone(original)
    guide.assets[0].license = 'All rights reserved; redistribution prohibited'
    assert.match(
      validateGuide(guide).join('\n'),
      /pearl-blm-photograph: supported asset distribution rights missing/,
    )
  }
})

test('a rights label without an explicit supported grant cannot authorize publication', () => {
  const guide = structuredClone(kraftGuide)
  delete guide.assets[0].distribution
  assert.match(
    validateGuide(guide).join('\n'),
    /supported asset distribution rights missing/,
  )
  const invalid = structuredClone(kraftGuide)
  invalid.assets[0].distribution.licenseIds = ['arbitrary-permission']
  assert.match(
    validateGuide(invalid).join('\n'),
    /supported asset distribution rights missing/,
  )
  invalid.assets[0].distribution.licenseIds = ['PD-USGov-BLM', 'CC-BY-2.0']
  invalid.assets[0].distribution.evidenceUrl = 'javascript:unsupported'
  assert.match(
    validateGuide(invalid).join('\n'),
    /supported asset distribution rights missing/,
  )
  invalid.assets[0].distribution.licenseIds = 'CC-BY-2.0'
  assert.match(
    validateGuide(invalid).join('\n'),
    /supported asset distribution rights missing/,
  )
})

test('factual references and sources without grants cannot authorize shipped photographs', () => {
  for (const original of [kraftGuide, syntheticReviewedGuide()]) {
    const guide = structuredClone(original)
    const source = guide.sources.find(
      item => item.id === 'blm-pearl-photograph',
    )
    source.usage = 'factual-reference'
    delete source.license
    assert.match(
      validateGuide(guide).join('\n'),
      /blm-pearl-photograph cannot authorize face-photo distribution/,
    )
  }
  const guide = structuredClone(kraftGuide)
  const source = guide.sources.find(item => item.id === 'blm-pearl-photograph')
  delete source.distribution
  assert.match(
    validateGuide(guide).join('\n'),
    /supported source distribution rights missing/,
  )
})

test('map rights require the actual open-data grants and photo rights cannot use database permission', () => {
  const map = structuredClone(kraftGuide)
  const source = map.sources.find(item => item.id === 'usgs-3dep-2026-09-30')
  source.usage = 'factual-reference'
  assert.match(
    validateGuide(map).join('\n'),
    /cannot authorize map distribution/,
  )
  const guide = structuredClone(kraftGuide)
  const photograph = guide.assets[0]
  const mediaSource = guide.sources.find(
    item => item.id === 'blm-pearl-photograph',
  )
  for (const record of [photograph, mediaSource]) {
    record.license = 'Open Database License 1.0'
    record.distribution.licenseIds = ['ODbL-1.0']
  }
  assert.match(
    validateGuide(guide).join('\n'),
    /database rights cannot authorize a face photograph/,
  )
})
