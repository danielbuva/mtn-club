import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import { publicationDateline } from '../lib/editorial/dateline.ts'

const source = readFileSync(
  new URL('../lib/editorial/editions.ts', import.meta.url),
  'utf8',
).replace(
  "import greatBasinFilm from '@/public/editions/great-basin-film-2025.jpg'",
  "const greatBasinFilm = { src: '/editions/great-basin-film-2025.jpg', width: 2200, height: 1458 }",
)
const registrySource = source.replace(
  "export { publicationDateline } from './dateline'",
  '',
)
const compiled = ts.transpileModule(registrySource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const { getTripEdition, nightsLabel, expeditionDateline } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
)

const overnight = {
  id: 'trip-01',
  activityType: 'camping',
  startAt: new Date('2026-11-11T06:00:00Z'),
  endAt: new Date('2026-11-11T09:00:00Z'),
}

test('both Bishop schedule keys resolve the same special edition before feature rules', () => {
  const editions = [
    'fall-2026-camp-and-climb-in-bishop',
    'fall-2026-camp-climb-bishop',
  ].map(scheduleKey =>
    getTripEdition({ ...overnight, scheduleKey, isOfficial: false }),
  )
  assert.deepEqual(editions[0], editions[1])
  assert.equal(editions[0]?.level, 'special')
  assert.equal(editions[0]?.headline, 'Granite & Campfires')
  assert.equal(editions[0]?.label, 'Special Edition No. 01')
  assert.equal(editions[0]?.tone, 'highlight')
  assert.equal(editions[0]?.photo.overlayCorner, 'top-right')
  assert.equal(
    editions[0]?.photo.credit,
    'Photo: Skylar Houchen · Great Basin, 2025 · On film',
  )
})

test('official overnight uses local calendar days rather than elapsed hours', () => {
  const edition = getTripEdition({ ...overnight, isOfficial: true })
  assert.equal(edition?.level, 'feature')
  assert.deepEqual(edition, { level: 'feature', label: 'Expedition · 1 night' })
  assert.equal(nightsLabel(overnight.startAt, overnight.endAt), '1 night')
  assert.equal(getTripEdition(overnight)?.level, 'feature')
  assert.equal(getTripEdition({ ...overnight, timeZone: 'UTC' }), null)
})

test('single-day and unofficial overnight trips have no edition', () => {
  assert.equal(
    getTripEdition({ ...overnight, endAt: new Date('2026-11-11T07:00:00Z') }),
    null,
  )
  assert.equal(getTripEdition({ ...overnight, isOfficial: false }), null)
  assert.equal(getTripEdition({ ...overnight, endAt: undefined }), null)
})

test('publication dateline uses editorial seasons without a volume', () => {
  assert.equal(publicationDateline(new Date('2026-11-10')), 'Fall 2026')
  assert.equal(publicationDateline(new Date('2026-05-31')), 'Spring 2026')
  assert.equal(publicationDateline(new Date('2026-06-01')), 'Summer 2026')
  assert.equal(publicationDateline(new Date('2026-09-01')), 'Fall 2026')
})

test('expedition marks use plural local nights across daylight-saving changes', () => {
  const edition = getTripEdition({
    ...overnight,
    startAt: new Date('2026-10-31T15:00:00Z'),
    endAt: new Date('2026-11-02T16:00:00Z'),
  })
  assert.equal(edition?.label, 'Expedition · 2 nights')
})

test('reader expedition dateline uses the trip zone and nights', () => {
  assert.equal(
    expeditionDateline(
      new Date('2026-12-05T15:00:00Z'),
      new Date('2026-12-06T23:00:00Z'),
    ),
    'Expedition · Sat, Dec 5 – Sun, Dec 6 · 1 night',
  )
})
