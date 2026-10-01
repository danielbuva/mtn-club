import {
  runtimeMpRoutes,
  runtimeObRoutes,
  runtimeUnits,
} from './runtime-records.ts'
import type { EvidenceSource } from './types'

export function mpNumericId(
  url: string,
  kind: 'area' | 'route',
): string | null {
  return (
    new RegExp(
      `^https://www\\.mountainproject\\.com/${kind}/(\\d+)(?:/|$)`,
    ).exec(url)?.[1] ?? null
  )
}

export function mpSourceId(
  id: string,
  kind: 'area' | 'route',
  sources: EvidenceSource[],
): string {
  const existing = sources.find(
    source => !source.url.includes('#') && mpNumericId(source.url, kind) === id,
  )
  return existing?.id ?? `mp-${kind}-${id}`
}

export function obSourceId(id: string, kind: 'area' | 'route'): string {
  return `ob-${kind}-${id}`
}

/** Retain existing evidence IDs while adding dated exact-ID catalog sources. */
export function completeRuntimeSources(
  pilot: EvidenceSource[],
): EvidenceSource[] {
  const sources = [...pilot]
  function addMp(
    record: {
      id: string
      name: string
      url: string
      retrievedAt: string
    },
    kind: 'area' | 'route',
  ) {
    const id = mpSourceId(record.id, kind, pilot)
    const existing = sources.find(source => source.id === id)
    const metadata = {
      accessedAt: record.retrievedAt.slice(0, 10),
      retrievedAt: record.retrievedAt,
    }
    if (existing) Object.assign(existing, metadata)
    else
      sources.push({
        id,
        title: record.name,
        url: record.url,
        publisher: 'Mountain Project contributors',
        ...metadata,
        usage: 'factual-reference',
        note:
          kind === 'route'
            ? 'Dated route metadata and original factual synopsis. No copied prose, photograph or route artwork is shipped.'
            : 'Dated source catalog membership and parent point. A source unit is not a verified physical rock.',
      })
  }
  for (const record of runtimeUnits.mp) addMp(record, 'area')
  for (const record of runtimeMpRoutes) addMp(record, 'route')
  for (const record of runtimeUnits.openBeta)
    sources.push({
      id: obSourceId(record.id, 'area'),
      title: `${record.name} · OpenBeta source catalog`,
      url: record.sourceUrl,
      publisher: 'OpenBeta contributors',
      accessedAt: record.retrievedAt.slice(0, 10),
      retrievedAt: record.retrievedAt,
      usage: 'factual-reference',
      note: record.originalMpId
        ? 'Area linked by exact importer numeric ID. Imported MP lineage is correlated evidence; catalog centroids do not verify physical rocks.'
        : 'Source catalog identity is unresolved. Its centroid is not a verified physical rock position; no name-only merge is inferred.',
    })
  for (const record of runtimeObRoutes)
    sources.push({
      id: obSourceId(record.id, 'route'),
      title: `${record.name} · OpenBeta entry`,
      url: record.sourceUrl,
      publisher: 'OpenBeta contributors',
      accessedAt: record.retrievedAt.slice(0, 10),
      retrievedAt: record.retrievedAt,
      usage: 'factual-reference',
      note: record.originalMpId
        ? `Exact MP numeric-ID link ${record.originalMpId}; correlated importer evidence, not independent corroboration.`
        : 'No exact MP numeric-ID link. Original source and physical line identity are unresolved; only an original factual synopsis is shipped.',
    })
  return sources
}
