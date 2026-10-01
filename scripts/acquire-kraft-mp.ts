import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import { buildMpInventory, verifyCachedMpGrades } from './kraft-mp-inventory.ts'
import { parseMpPage, verifyMpGradeParsing } from './kraft-mp-parser.ts'
import type {
  AcquisitionError,
  AreaRecord,
  RouteRecord,
} from './kraft-mp-schema.ts'

const rootUrl = 'https://www.mountainproject.com/area/105937608/kraft-boulders'
const rootId = '105937608'
// Reference HTML remains in ignored research scratch, never in the shipped guide.
const outputDirectory = new URL(
  '../.tmp/kraft-gauntlet/research/',
  import.meta.url,
)
const cacheDirectory = new URL('./mp-html/', outputDirectory)
const refresh = process.argv.includes('--refresh')
const verifyCache = process.argv.includes('--verify-cache')
const cacheOnly = verifyCache || process.argv.includes('--cache-only')
if (refresh && cacheOnly) throw new Error('Cannot refresh in cache-only mode')
await mkdir(cacheDirectory, { recursive: true })

const errors: AcquisitionError[] = []
const areas = new Map<string, AreaRecord>()
const routes = new Map<string, RouteRecord>()
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const parsedCacheIds = new Set<string>()
if (verifyCache) await verifyMpGradeParsing(page)

async function acquire(
  url: string,
): Promise<{ html: string; retrievedAt: string }> {
  const id = url.match(/\/(?:area|route)\/(\d+)/)?.[1]
  if (!id) throw new Error(`URL has no source id: ${url}`)
  const cachePath = new URL(`${id}.html`, cacheDirectory)
  try {
    if (refresh) throw new Error('Fresh retrieval requested')
    const retrievedAt = await readFile(
      new URL(`${id}.date`, cacheDirectory),
      'utf8',
    )
    if (!cacheOnly && Date.now() - Date.parse(retrievedAt) > 86_400_000)
      throw new Error('Checkpoint is older than one day')
    const html = await readFile(cachePath, 'utf8')
    return { html, retrievedAt }
  } catch {
    /* A missing checkpoint is fetched below. */
  }
  if (cacheOnly) throw new Error(`Required cached HTML/date missing: ${id}`)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const html = await response.text()
      if (!html.includes('<h1>') || !html.includes('description-details'))
        throw new Error('Unexpected document; no title/details')
      const retrievedAt = new Date().toISOString()
      await writeFile(cachePath, html)
      await writeFile(new URL(`${id}.date`, cacheDirectory), retrievedAt)
      return { html, retrievedAt }
    } catch (error) {
      errors.push({
        url,
        attempt,
        at: new Date().toISOString(),
        message: error instanceof Error ? error.message : String(error),
      })
      if (attempt < 3)
        await new Promise(resolve => setTimeout(resolve, attempt * 1_000))
    }
  }
  throw new Error(`Failed after three attempts: ${url}`)
}

async function checkpoint(): Promise<void> {
  const result = {
    schemaVersion: 2,
    source: 'Mountain Project',
    root: { id: rootId, url: rootUrl },
    generatedAt: new Date().toISOString(),
    rights: {
      usage:
        'Factual reference only; names, grades, hierarchy and coordinates retained. Source HTML/prose/photos are not production assets.',
      htmlCache: 'Ignored scratch only',
      physicalUnitCaveat:
        'A leaf Mountain Project area can contain multiple physical rocks; source units are not automatically canonical physical boulders.',
    },
    counts: {
      areas: areas.size,
      sectors: [...areas.values()].filter(area => area.kind === 'sector')
        .length,
      sourceBoulderUnits: [...areas.values()].filter(
        area => area.kind === 'source-boulder-unit',
      ).length,
      routes: routes.size,
      routeDetailsRetrieved: [...routes.values()].filter(
        route => route.detailStatus === 'retrieved',
      ).length,
      routeDetailsFailed: [...routes.values()].filter(
        route => route.detailStatus === 'failed',
      ).length,
    },
    areas: [...areas.values()],
    routes: [...routes.values()],
    acquisitionErrors: errors,
  }
  await writeFile(
    new URL('mp-kraft.json', outputDirectory),
    `${JSON.stringify(result, null, 2)}\n`,
  )
}

const queue: { url: string; parentId: string | null }[] = [
  { url: rootUrl, parentId: null },
]
const seen = new Set<string>()
while (queue.length > 0) {
  const batch = queue.splice(0, 4).filter(item => !seen.has(item.url))
  batch.forEach(item => seen.add(item.url))
  const results = await Promise.allSettled(
    batch.map(async item => ({ ...item, ...(await acquire(item.url)) })),
  )
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error(result.reason)
      continue
    }
    const item = result.value
    const parsed = await parseMpPage(page, item.html)
    const id = item.url.match(/\/area\/(\d+)/)?.[1]
    if (!id) continue
    parsedCacheIds.add(id)
    const kind =
      id === rootId
        ? 'root'
        : item.parentId === rootId
          ? 'sector'
          : parsed.children.length > 0
            ? 'subarea-or-group'
            : 'source-boulder-unit'
    areas.set(id, {
      id,
      url: item.url,
      name: parsed.name,
      parentId: item.parentId,
      kind,
      retrievedAt: item.retrievedAt,
      coordinates: parsed.coordinates,
      declaredTotal: parsed.declaredTotal,
      childIds: parsed.children.map(child => child.id),
      directRouteIds: parsed.routeListings.map(route => route.id),
      breadcrumb: parsed.breadcrumb,
      detailSections: parsed.sections,
      photoReferences: parsed.photoReferences,
    })
    for (const route of parsed.routeListings) {
      const existing = routes.get(route.id)
      if (existing) {
        if (!existing.parentIds.includes(id)) existing.parentIds.push(id)
        continue
      }
      routes.set(route.id, {
        ...route,
        parentId: id,
        parentIds: [id],
        retrievedAt: item.retrievedAt,
        detailRetrievedAt: null,
        coordinates: null,
        detailGrade: null,
        detailType: null,
        breadcrumb: [],
        detailSections: [],
        photoReferences: [],
        commentCount: null,
        detailStatus: 'pending',
      })
    }
    queue.push(
      ...parsed.children.map(child => ({ url: child.url, parentId: id })),
    )
    console.log(
      `Area ${areas.size}: ${parsed.name} (${parsed.declaredTotal}; ${parsed.routeListings.length} direct routes)`,
    )
  }
  await checkpoint()
}

const pending = [...routes.values()]
while (pending.length > 0) {
  const batch = pending.splice(0, 4)
  const results = await Promise.allSettled(
    batch.map(async route => ({ route, ...(await acquire(route.url)) })),
  )
  for (let index = 0; index < results.length; index++) {
    const result = results[index]
    if (result.status === 'rejected') {
      batch[index].detailStatus = 'failed'
      continue
    }
    const item = result.value
    const parsed = await parseMpPage(page, item.html)
    parsedCacheIds.add(item.route.id)
    Object.assign(item.route, {
      detailRetrievedAt: item.retrievedAt,
      coordinates: parsed.coordinates,
      detailGrade: parsed.grades,
      detailType: parsed.typeText,
      breadcrumb: parsed.breadcrumb,
      detailSections: parsed.sections,
      photoReferences: parsed.photoReferences,
      commentCount: parsed.commentCount,
      detailStatus: 'retrieved',
    })
  }
  await checkpoint()
  if (pending.length % 20 < 4)
    console.log(
      `Route details ${routes.size - pending.length}/${routes.size}; ${errors.length} acquisition errors`,
    )
}
if (verifyCache) {
  const cachedIds = (await readdir(cacheDirectory))
    .filter(name => name.endsWith('.html'))
    .map(name => name.slice(0, -'.html'.length))
  if (
    cachedIds.length !== 451 ||
    cachedIds.some(id => !parsedCacheIds.has(id)) ||
    areas.size !== 81 ||
    routes.size !== 370
  )
    throw new Error(
      `Cache coverage regression: parsed ${parsedCacheIds.size} of ${cachedIds.length} pages; ${areas.size} areas, ${routes.size} routes`,
    )
  verifyCachedMpGrades([...routes.values()])
  console.log(
    'Verified 451 cached pages, 370 literal V grades and 3 mixed YDS/V grades.',
  )
}
await browser.close()
const retrievedAt = [...areas.values(), ...routes.values()]
  .map(record =>
    'detailRetrievedAt' in record
      ? (record.detailRetrievedAt ?? record.retrievedAt)
      : record.retrievedAt,
  )
  .sort()
  .at(-1)
if (!retrievedAt) throw new Error('No source retrieval dates available')
const inventory = buildMpInventory(
  [...areas.values()],
  [...routes.values()],
  { id: rootId, url: rootUrl },
  retrievedAt,
)
await writeFile(
  new URL('mp-inventory.json', outputDirectory),
  `${JSON.stringify(inventory, null, 2)}\n`,
)
if (cacheOnly)
  await writeFile(
    new URL('../lib/kraft/mp-inventory.json', import.meta.url),
    `${JSON.stringify(inventory, null, 2)}\n`,
  )
console.log(`Complete: ${areas.size} areas, ${routes.size} unique routes.`)
