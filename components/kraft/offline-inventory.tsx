import {
  formatOfflineBytes,
  type OfflineManifest,
} from '@/lib/kraft/offline-types'

export function OfflineInventory({
  manifest,
  persistent,
}: {
  manifest: OfflineManifest
  persistent: boolean | null
}) {
  const savedDate = new Date(manifest.storedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return (
    <details className="mt-3 border-t border-border/70 pt-3 text-xs">
      <summary className="flex min-h-11 cursor-pointer items-center rounded-md text-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        View verified download · {manifest.resources.length} files
      </summary>
      <p className="mt-2 leading-relaxed text-muted-foreground">
        Saved {savedDate} · edition {manifest.version}. Every file was read back
        and checked with SHA-256 before this package was made available.
      </p>
      {persistent === false && (
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Your browser may reclaim storage when your device runs low. Check for
          “This edition is saved” before leaving service.
        </p>
      )}
      <ul
        className="mt-3 max-h-60 space-y-2 overflow-y-auto rounded-lg bg-muted/40 p-3"
        aria-label="Downloaded file inventory"
      >
        {manifest.resources.map(resource => (
          <li
            key={resource.url}
            className="flex items-start justify-between gap-3"
          >
            <span className="min-w-0 break-all">
              <span className="capitalize">{resource.kind}</span> ·{' '}
              {resource.url}
            </span>
            <span className="shrink-0 tabular-nums">
              {formatOfflineBytes(resource.bytes)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-muted-foreground">
        Total saved size: {manifest.totalBytes.toLocaleString()} bytes. Account
        information and external pages are excluded.
      </p>
    </details>
  )
}
