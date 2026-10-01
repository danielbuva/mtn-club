import assert from 'node:assert/strict'
import test from 'node:test'
import { isDrawableSvgPath } from '../lib/kraft/route-svg-path.ts'

test('SVG guard accepts supported drawing commands, relative paths and implicit lines', () => {
  for (const path of [
    'm1,1 l2,2 h3 v4 q1,1 2,2 t3,3 c1,1 2,2 3,3 s2,2 3,3 z',
    'M0,0 10,10 20,20',
    'M.5-.5 L1e1,+2.5 A5,5,0,1,0,10,10',
  ])
    assert.equal(isDrawableSvgPath(path), true, path)
})

test('SVG guard rejects incomplete commands, illegal text, invalid arc flags and empty shapes', () => {
  for (const path of [
    '',
    'L0,0',
    'M0',
    'M0,0',
    'M0,0Z',
    'M0,0L',
    'M0,0X1,1',
    'M0,0L1,2,3',
    'M0,0L1e309,1',
    'M0,0A5,5,0,2,0,10,10',
    'M0,0A-5,5,0,1,0,10,10',
    'M0,,0L1,1',
    'M,0,0L1,1',
    'M0,0L1,1,',
  ])
    assert.equal(isDrawableSvgPath(path), false, path)
})
