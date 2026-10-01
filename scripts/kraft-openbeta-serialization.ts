/** Deserialize the public OpenBeta page's factual records; omit photograph/media UI data. */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | JsonObject
export type JsonObject = { [key: string]: JsonValue }

export function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(isJsonValue)
  if (typeof value === 'object') return Object.values(value).every(isJsonValue)
  return false
}

export function parseJsonValue(text: string): JsonValue {
  const value: unknown = JSON.parse(text)
  if (!isJsonValue(value))
    throw new Error('Response is not supported JSON data')
  return value
}

export function jsonString(value: JsonValue | undefined): string {
  return typeof value === 'string' ? value : ''
}

export function jsonArray(value: JsonValue | undefined): JsonValue[] {
  return Array.isArray(value) ? value : []
}

export function compactObject(value: JsonObject): JsonObject {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== '__typename' && key !== 'media')
      .map(([key, child]) => [key, compactValue(child)]),
  )
}

export function compactValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(compactValue)
  if (isJsonObject(value)) return compactObject(value)
  return value
}

function flightRecords(stream: string): {
  records: Map<string, JsonValue>
  rawTextIds: Set<string>
} {
  const records = new Map<string, JsonValue>()
  const rawTextIds = new Set<string>()
  // T records use UTF-8 byte lengths and may span lines. JSON records escape their newlines.
  const bytes = Buffer.from(stream)
  let offset = 0
  while (offset < bytes.length) {
    const colon = bytes.indexOf(58, offset)
    if (colon < 0) break
    const id = bytes.subarray(offset, colon).toString()
    if (!/^[0-9a-f]+$/.test(id)) break
    const dataOffset = colon + 1
    if (bytes[dataOffset] === 84) {
      const comma = bytes.indexOf(44, dataOffset)
      const length = Number.parseInt(
        bytes.subarray(dataOffset + 1, comma).toString(),
        16,
      )
      if (comma < 0 || !Number.isFinite(length)) break
      records.set(id, bytes.subarray(comma + 1, comma + 1 + length).toString())
      rawTextIds.add(id)
      offset = comma + 1 + length
      if (bytes[offset] === 10) offset++
      continue
    }
    const newline = bytes.indexOf(10, dataOffset)
    const end = newline < 0 ? bytes.length : newline
    const record = bytes.subarray(dataOffset, end).toString()
    if (/^[[{"]/.test(record)) {
      try {
        records.set(id, parseJsonValue(record))
      } catch {
        /* React UI module records do not represent factual JSON records. */
      }
    }
    offset = end + 1
  }
  return { records, rawTextIds }
}

export function extractOpenBetaAreas(html: string): JsonObject[] {
  const stream = [
    ...html.matchAll(/self\.__next_f\.push\(([\s\S]*?)\)<\/script>/g),
  ]
    .flatMap(match => {
      try {
        const chunk = parseJsonValue(match[1])
        return Array.isArray(chunk) && typeof chunk[1] === 'string'
          ? [chunk[1]]
          : []
      } catch {
        return []
      }
    })
    .join('')
  const { records, rawTextIds } = flightRecords(stream)
  function resolve(value: JsonValue, seen = new Set<string>()): JsonValue {
    // React Flight escapes a literal initial dollar as $$. Unescape once,
    // before interpreting references; the resulting literal is not a token.
    if (typeof value === 'string' && value.startsWith('$$'))
      return value.slice(1)
    if (typeof value === 'string' && /^\$[0-9a-f]+$/.test(value)) {
      const id = value.slice(1)
      if (!seen.has(id) && records.has(id)) {
        // Length-prefixed T records contain literal UTF-8 text, not model strings.
        if (rawTextIds.has(id)) return records.get(id) ?? null
        const next = new Set(seen)
        next.add(id)
        return resolve(records.get(id) ?? null, next)
      }
    }
    if (Array.isArray(value)) return value.map(child => resolve(child, seen))
    if (isJsonObject(value)) {
      return Object.fromEntries(
        Object.entries(value)
          .filter(
            ([key]) =>
              !['media', 'photoList', 'entityTags', 'organizations'].includes(
                key,
              ),
          )
          .map(([key, child]) => [key, resolve(child, seen)]),
      )
    }
    return value
  }
  const candidates: JsonObject[] = []
  function walk(value: JsonValue): void {
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    if (!isJsonObject(value)) return
    if (typeof value.uuid === 'string' && typeof value.areaName === 'string')
      candidates.push(value)
    for (const child of Object.values(value)) walk(child)
  }
  for (const [id, record] of records)
    walk(rawTextIds.has(id) ? record : resolve(record))
  return candidates
}
