/**
 * Run from the repository root with Node >=22.18:
 * node scripts/acquire-kraft-openbeta.ts
 *
 * Resumes from ignored public-HTML cache. Writes a factual source checkpoint to
 * .tmp/kraft-gauntlet/research/openbeta-kraft.json; never publishes photographs.
 * This source hierarchy does not establish physical boulder membership.
 */
import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import {
  compactObject,
  compactValue,
  extractOpenBetaAreas,
  isJsonObject,
  type JsonObject,
  jsonArray,
  jsonString,
  parseJsonValue,
} from './kraft-openbeta-serialization.ts'

const execute = promisify(execFile)
const folder = '.tmp/kraft-gauntlet/research'
const rootId = 'bfc783a7-d23c-5794-84c7-d7658c387b08'
const errors: JsonObject[] = []
type SourceRequest = {
  id: string
  name: string
  parentId: string
  parentName: string
  url?: string
}
type CachedResponse = { html: string; retrievedAt: string; sourceUrl: string }
const rawCachePath = `${folder}/openbeta-ssr-area-cache.json`
const cacheOnly = process.argv.includes('--cache-only')
const refresh = process.argv.includes('--refresh')
if (cacheOnly && refresh) throw new Error('Cannot refresh in cache-only mode')
const rawCache = new Map<string, CachedResponse>()
try {
  const cache = parseJsonValue(await readFile(rawCachePath, 'utf8'))
  if (isJsonObject(cache))
    for (const [id, value] of Object.entries(cache)) {
      if (
        isJsonObject(value) &&
        typeof value.html === 'string' &&
        typeof value.retrievedAt === 'string' &&
        typeof value.sourceUrl === 'string'
      ) {
        rawCache.set(id, {
          html: value.html,
          retrievedAt: value.retrievedAt,
          sourceUrl: value.sourceUrl,
        })
      }
    }
} catch {
  /* A fresh acquisition has no local response cache. */
}
const queue: SourceRequest[] = [
  { id: rootId, name: 'Kraft Boulders', parentId: '', parentName: '' },
]
const processed = new Set<string>()
const areas = new Map<string, JsonObject>()
const slug = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

async function fetchArea(item: SourceRequest): Promise<void> {
  if (processed.has(item.id)) return
  processed.add(item.id)
  const url =
    item.url ?? `https://openbeta.io/area/${item.id}/${slug(item.name)}`
  let entry = rawCache.get(item.id)
  if (
    entry &&
    !cacheOnly &&
    (refresh ||
      !Number.isFinite(Date.parse(entry.retrievedAt)) ||
      Date.now() - Date.parse(entry.retrievedAt) > 86_400_000)
  )
    entry = undefined
  if (!entry && cacheOnly) {
    errors.push({
      entityId: item.id,
      sourceUrl: url,
      error: 'Required cache missing',
    })
    return
  }
  if (!entry)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { stdout } = await execute(
          'curl',
          ['-fsSL', '--max-time', '45', url],
          { maxBuffer: 16 * 1024 * 1024 },
        )
        const parsed = extractOpenBetaAreas(stdout)
        if (
          !parsed.some(
            area => area.uuid === item.id && isJsonObject(area.metadata),
          )
        )
          throw new Error('No matching structured area in response')
        entry = {
          html: stdout,
          retrievedAt: new Date().toISOString(),
          sourceUrl: url,
        }
        rawCache.set(item.id, entry)
        break
      } catch (error) {
        errors.push({
          entityId: item.id,
          sourceUrl: url,
          attempt,
          at: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  if (!entry) return
  const response = entry
  const candidates = extractOpenBetaAreas(response.html).filter(
    area => area.uuid === item.id,
  )
  candidates.sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length)
  const chosen = candidates.find(
    area => isJsonObject(area.metadata) && Array.isArray(area.climbs),
  )
  if (!chosen) {
    errors.push({
      entityId: item.id,
      sourceUrl: url,
      error: 'No complete structured area',
    })
    return
  }
  const children = jsonArray(chosen.children).filter(isJsonObject)
  const childLinks = new Map(
    [...response.html.matchAll(/href="(\/area\/([a-z0-9-]+)\/[^" ]+)"/g)].map(
      match => [match[2], `https://openbeta.io${match[1]}`],
    ),
  )
  const climbLinks = new Map(
    [...response.html.matchAll(/href="(\/climb\/([a-z0-9-]+)\/[^" ]+)"/g)].map(
      match => [match[2], `https://openbeta.io${match[1]}`],
    ),
  )
  const climbs = jsonArray(chosen.climbs)
    .filter(isJsonObject)
    .map(climb => {
      const id = jsonString(climb.uuid) || jsonString(climb.id)
      return {
        ...compactObject(climb),
        sourceUrl:
          climbLinks.get(id) ??
          `https://openbeta.io/climb/${id}/${slug(jsonString(climb.name))}`,
        parentId: item.id,
        parentName: jsonString(chosen.areaName),
        sourceId: 'openbeta',
        retrievedAt: response.retrievedAt,
      }
    })
  areas.set(item.id, {
    sourceId: 'openbeta',
    sourceUrl: response.sourceUrl,
    retrievedAt: response.retrievedAt,
    parentId: item.parentId || null,
    parentName: item.parentName || null,
    id: item.id,
    name: jsonString(chosen.areaName),
    metadata: compactValue(chosen.metadata),
    ancestors: compactValue(chosen.ancestors ?? null),
    pathTokens: compactValue(chosen.pathTokens ?? null),
    gradeContext: jsonString(chosen.gradeContext),
    totalClimbs: chosen.totalClimbs ?? null,
    childIds: children.map(child => jsonString(child.uuid)),
    climbs,
    sourceEntityKind:
      'OpenBeta source area; not necessarily one physical boulder',
    acquisition: 'Public SSR structured data',
    factualContent: compactValue(chosen.content ?? null),
  })
  for (const child of children)
    if (jsonString(child.uuid))
      queue.push({
        id: jsonString(child.uuid),
        name: jsonString(child.areaName),
        parentId: item.id,
        parentName: jsonString(chosen.areaName),
        url: childLinks.get(jsonString(child.uuid)),
      })
  console.log(
    `OpenBeta ${areas.size}: ${jsonString(chosen.areaName)}, ${climbs.length} direct climbs`,
  )
}

async function checkpoint(): Promise<void> {
  const areaList = [...areas.values()]
  const climbs = areaList.flatMap(area => jsonArray(area.climbs))
  const inventory: JsonObject = {
    schemaVersion: 1,
    source: {
      id: 'openbeta',
      rootId,
      rootUrl: `https://openbeta.io/area/${rootId}/kraft-boulders`,
      licenseEvidenceUrl: 'https://openbeta.io/about',
      licenseId: 'CC0-1.0',
      photosExcluded: true,
      officialApiSource: 'https://github.com/OpenBeta/openbeta-graphql',
      apiEndpoint: 'https://api.openbeta.io',
      importedSourceCaution:
        'Historically imported MP records are correlated evidence. Exact import IDs must be reconciled separately; names do not establish physical identity.',
    },
    fetchedAt:
      areaList
        .map(area => jsonString(area.retrievedAt))
        .sort()
        .at(-1) ?? null,
    generatedAt: new Date().toISOString(),
    completeness: {
      fetchedAreasIncludingRoot: areaList.length,
      directRootAreaCount: jsonArray(areas.get(rootId)?.childIds).length,
      directClimbCount: climbs.length,
      uniqueClimbCount: new Set(
        climbs.filter(isJsonObject).map(climb => jsonString(climb.id)),
      ).size,
      rootAdvertisedTotalClimbs: areas.get(rootId)?.totalClimbs ?? null,
      missingAreaIds: [...processed].filter(id => !areas.has(id)),
      queuedAreaCount: queue.length,
      processedAreaCount: processed.size,
    },
    areas: areaList,
    errors,
  }
  await writeFile(
    `${folder}/openbeta-kraft.json`,
    `${JSON.stringify(inventory, null, 2)}\n`,
  )
  await writeFile(rawCachePath, JSON.stringify(Object.fromEntries(rawCache)))
}
await mkdir(folder, { recursive: true })
while (queue.length) {
  const results = await Promise.allSettled(queue.splice(0, 5).map(fetchArea))
  for (const result of results)
    if (result.status === 'rejected')
      errors.push({
        error: String(result.reason),
        at: new Date().toISOString(),
      })
  await checkpoint()
}
await checkpoint()
if ([...processed].some(id => !areas.has(id))) process.exitCode = 1
