import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

function moduleUrl(source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  })
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
}

const registry = readFileSync(
  new URL('../lib/editorial/editions.ts', import.meta.url),
  'utf8',
)
  .replace("export { publicationDateline } from './dateline'", '')
  .replace(
    "import greatBasinFilm from '@/public/editions/great-basin-film-2025.jpg'",
    "const greatBasinFilm = { src: '/editions/great-basin-film-2025.jpg' }",
  )
const selection = readFileSync(
  new URL('../lib/editorial/cover-editions.ts', import.meta.url),
  'utf8',
)
  .replace(
    "import { cacheLife } from 'next/cache'",
    'const cacheLife = () => {}',
  )
  .replace("from './editions'", `from '${moduleUrl(registry)}'`)
const { activeCoverEditions } = await import(moduleUrl(selection))

test('home has one Bishop event link despite the legacy registry alias', () => {
  const cards = activeCoverEditions(new Date('2026-11-10T12:00:00Z'))
  assert.equal(cards.length, 1)
  assert.deepEqual(cards[0], {
    edition: {
      label: 'Special Edition No. 01',
      headline: 'Granite & Campfires',
    },
    subline: 'Camp and Climb in Bishop · Nov 27–29',
    href: '/trips/fall-2026-camp-and-climb-in-bishop',
  })
})

test('home promotion expires at its server-selected cutoff', () => {
  assert.equal(activeCoverEditions(new Date('2026-11-30T23:59:59Z')).length, 1)
  assert.deepEqual(activeCoverEditions(new Date('2026-12-01T00:00:00Z')), [])
})
