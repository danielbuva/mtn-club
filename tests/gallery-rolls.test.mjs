import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import { groupIntoRolls } from '../lib/gallery/rolls.ts'

const photo = (id, taken_on) => ({
  id,
  taken_on,
  title: `Photo ${id}`,
  alt_text: `View ${id}`,
  caption: null,
  trip_id: null,
  imageUrl: `/photos/${id}.jpg`,
})

test('groups editorial seasons newest first and preserves incoming photo order', () => {
  const photos = [
    photo('spring-end', '2026-05-31'),
    photo('fall-start', '2026-09-01'),
    photo('summer-start', '2026-06-01'),
    photo('old-fall', '2025-12-31'),
    photo('spring-start', '2026-01-01'),
    photo('fall-end', '2026-12-31'),
    photo('summer-end', '2026-08-31'),
  ]
  const rolls = groupIntoRolls(photos)
  assert.deepEqual(
    rolls.map(roll => roll.label),
    ['Fall 2026', 'Summer 2026', 'Spring 2026', 'Fall 2025'],
  )
  assert.deepEqual(
    rolls.map(roll => roll.number),
    ['04', '03', '02', '01'],
  )
  assert.deepEqual(
    rolls.map(roll => roll.photos.map(frame => frame.id)),
    [
      ['fall-start', 'fall-end'],
      ['summer-start', 'summer-end'],
      ['spring-end', 'spring-start'],
      ['old-fall'],
    ],
  )
  assert.equal(rolls[0].id, 'fall-2026')
  assert.deepEqual(
    rolls.flatMap(roll => roll.photos.map(frame => frame.frameNumber)),
    ['01', '02', '01', '02', '01', '02', '01'],
  )
})

test('undated and invalid dates form the final roll without mutating input', () => {
  const photos = Object.freeze([
    Object.freeze(photo('unknown', null)),
    Object.freeze(photo('dated', '2026-11-08')),
    Object.freeze(photo('invalid', 'not-a-date')),
  ])
  const rolls = groupIntoRolls(photos)
  assert.deepEqual(
    rolls.map(roll => [roll.label, roll.number]),
    [
      ['Fall 2026', '02'],
      ['Undated', '01'],
    ],
  )
  assert.deepEqual(
    rolls[1].photos.map(frame => frame.id),
    ['unknown', 'invalid'],
  )
  assert.equal(rolls[0].photos[0].frameNumber, '01')
  assert.equal(rolls[1].photos[1].frameNumber, '02')
  assert.equal(Object.hasOwn(photos[0], 'frameNumber'), false)
  assert.deepEqual(groupIntoRolls(photos), rolls)
})

test('handles empty and entirely undated collections', () => {
  assert.deepEqual(groupIntoRolls([]), [])
  const [roll] = groupIntoRolls([photo('a', null), photo('b', null)])
  assert.equal(roll.id, 'undated')
  assert.equal(roll.label, 'Undated')
  assert.equal(roll.number, '01')
  assert.deepEqual(
    roll.photos.map(frame => frame.frameNumber),
    ['01', '02'],
  )
})

test('frame numbers restart per roll and support more than 99 frames', () => {
  const photos = Array.from({ length: 103 }, (_, index) =>
    photo(String(index), index < 101 ? '2026-11-08' : '2025-01-01'),
  )
  const rolls = groupIntoRolls(photos)
  assert.equal(rolls[0].photos[100].frameNumber, '101')
  assert.deepEqual(
    rolls[1].photos.map(frame => frame.frameNumber),
    ['01', '02'],
  )
})

function galleryQuery(result, throws = false) {
  const source = readFileSync(
    new URL('../lib/gallery/queries.ts', import.meta.url),
    'utf8',
  )
  const exports = {}
  const builder = {
    select() {
      return builder
    },
    eq() {
      return builder
    },
    order() {
      return builder
    },
    // biome-ignore lint/suspicious/noThenProperty: Supabase builders resolve after filters are chained.
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject)
    },
  }
  const client = { from: () => builder }
  new Function(
    'require',
    'exports',
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  )(name => {
    assert.equal(name, '@/lib/supabase/public')
    return {
      createPublicClient: () => {
        if (throws) throw new Error('Unavailable')
        return client
      },
    }
  }, exports)
  return exports.fetchPublishedGalleryPhotos()
}

test('gallery reads distinguish empty, published photos, and failed requests', async () => {
  assert.deepEqual(await galleryQuery({ data: [], error: null }), {
    status: 'ok',
    photos: [],
  })
  assert.deepEqual(
    await galleryQuery({ data: null, error: { message: 'Unavailable' } }),
    { status: 'error' },
  )
  assert.deepEqual(await galleryQuery(null, true), { status: 'error' })
  const row = {
    ...photo('published', '2026-11-08'),
    storage_path: 'https://example.com/photo.jpg',
  }
  const result = await galleryQuery({ data: [row], error: null })
  assert.equal(result.status, 'ok')
  assert.equal(result.photos[0].id, 'published')
  assert.equal(result.photos[0].imageUrl, row.storage_path)
})
