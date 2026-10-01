export type OfflineResource = {
  url: string
  bytes: number
  sha256: string
  kind: 'document' | 'script' | 'style' | 'font' | 'image' | 'manifest' | 'data'
}

export type OfflineManifest = {
  cacheName: string
  version: string
  storedAt: string
  totalBytes: number
  boulders: number
  climbs: number
  photos: number
  resources: OfflineResource[]
}

export type OfflineSnapshot = {
  status: 'not-downloaded' | 'ready' | 'evicted'
  manifest?: OfflineManifest
  missing?: string[]
}

export type OfflineProgress = {
  phase: 'discovering' | 'downloading' | 'verifying'
  completed: number
  total: number
  bytes: number
}

export type OfflineCommand =
  | { type: 'STATUS' }
  | { type: 'REMOVE' }
  | { type: 'CANCEL' }
  | {
      type: 'DOWNLOAD'
      version: string
      assets: string[]
      staticPaths: string[]
      boulders: number
      climbs: number
      photos: number
    }

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isOfflineProgress(value: unknown): value is OfflineProgress {
  return (
    record(value) &&
    ['discovering', 'downloading', 'verifying'].includes(String(value.phase)) &&
    typeof value.completed === 'number' &&
    typeof value.total === 'number' &&
    typeof value.bytes === 'number'
  )
}

function isResource(value: unknown): value is OfflineResource {
  return (
    record(value) &&
    typeof value.url === 'string' &&
    typeof value.bytes === 'number' &&
    typeof value.sha256 === 'string' &&
    [
      'document',
      'script',
      'style',
      'font',
      'image',
      'manifest',
      'data',
    ].includes(String(value.kind))
  )
}

export function isOfflineManifest(value: unknown): value is OfflineManifest {
  return (
    record(value) &&
    typeof value.cacheName === 'string' &&
    typeof value.version === 'string' &&
    typeof value.storedAt === 'string' &&
    typeof value.totalBytes === 'number' &&
    typeof value.boulders === 'number' &&
    typeof value.climbs === 'number' &&
    typeof value.photos === 'number' &&
    Array.isArray(value.resources) &&
    value.resources.every(isResource)
  )
}

export function isOfflineSnapshot(value: unknown): value is OfflineSnapshot {
  return (
    record(value) &&
    ['not-downloaded', 'ready', 'evicted'].includes(String(value.status)) &&
    (value.manifest === undefined || isOfflineManifest(value.manifest)) &&
    (value.missing === undefined ||
      (Array.isArray(value.missing) &&
        value.missing.every(item => typeof item === 'string')))
  )
}

export function formatOfflineBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
