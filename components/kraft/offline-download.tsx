'use client'

import { Check, Download, HardDrive, LoaderCircle, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOfflineGuide } from '@/lib/kraft/offline-state'
import { formatOfflineBytes } from '@/lib/kraft/offline-types'
import type { KraftGuide } from '@/lib/kraft/types'
import { OfflineInventory } from './offline-inventory'

export function OfflineDownload({ guide }: { guide: KraftGuide }) {
  const offline = useOfflineGuide(guide)
  const ready = offline.snapshot.status === 'ready'
  const manifest = offline.snapshot.manifest
  const differentEdition = Boolean(
    manifest && manifest.version !== guide.version,
  )
  const climbs = guide.boulders.reduce(
    (total, boulder) => total + boulder.climbs.length,
    0,
  )
  const photos = guide.assets.filter(
    asset => asset.kind === 'face-photo',
  ).length
  const progress = offline.progress
  const progressLabel =
    progress?.phase === 'verifying'
      ? 'Verifying saved files'
      : progress?.phase === 'discovering'
        ? 'Preparing guide'
        : 'Saving guide'
  const label = offline.checking
    ? 'Checking saved guide'
    : ready
      ? differentEdition
        ? 'Saved edition differs'
        : 'This edition is saved'
      : 'Take Kraft offline'

  return (
    <section
      aria-label="Offline guide"
      className="w-full max-w-lg border border-foreground/20 bg-transparent p-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {ready ? (
            <Check aria-hidden="true" className="size-5" />
          ) : (
            <HardDrive aria-hidden="true" className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-brand text-xl font-semibold">{label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ready && manifest
              ? `${manifest.boulders} rock catalogs · ${manifest.climbs} climbs · ${manifest.photos} face photo${manifest.photos === 1 ? '' : 's'} · ${formatOfflineBytes(manifest.totalBytes)}`
              : `${guide.status === 'content-pilot' ? 'Pilot guide' : 'Source catalog'} · ${guide.boulders.length} rock catalogs · ${climbs} climbs · ${photos} face photo${photos === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>
      {!offline.supported ? (
        <p className="mt-3 text-sm text-muted-foreground">
          This browser cannot save an offline guide. Open MTN Club in a browser
          with offline storage over HTTPS.
        </p>
      ) : (
        <>
          {!offline.online && (
            <p className="mt-3 flex items-center gap-2 text-sm">
              <WifiOff aria-hidden="true" className="size-4" />
              {ready
                ? 'Offline · your saved guide is available.'
                : 'You are offline. Connect to download the guide.'}
            </p>
          )}
          {offline.snapshot.status === 'evicted' && (
            <output className="mt-3 block text-sm text-destructive">
              The saved guide is incomplete or was removed by your browser.
              Connect and download it again before going offline.
            </output>
          )}
          {offline.error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {offline.error}
            </p>
          )}
          {progress ? (
            <div className="mt-4" aria-live="polite" aria-atomic="true">
              <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  {progressLabel}
                </span>
                <span>
                  {progress.completed}/{progress.total} files
                </span>
              </div>
              <progress
                aria-label={progressLabel}
                value={progress.completed}
                max={Math.max(1, progress.total)}
                className="h-2 w-full accent-primary"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {formatOfflineBytes(progress.bytes)} · keep this page open
                  until verified
                </p>
                <Button
                  className="min-h-11"
                  variant="ghost"
                  onClick={offline.cancel}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                className="min-h-11 flex-1"
                disabled={offline.checking || !offline.online}
                onClick={offline.download}
              >
                <Download aria-hidden="true" />
                {ready
                  ? 'Update download'
                  : offline.error
                    ? 'Retry download'
                    : 'Download guide'}
              </Button>
              {(manifest || offline.snapshot.status === 'evicted') && (
                <Button
                  className="min-h-11"
                  variant="outline"
                  disabled={offline.checking}
                  onClick={offline.remove}
                >
                  Remove
                </Button>
              )}
            </div>
          )}
          {ready && manifest && (
            <OfflineInventory
              manifest={manifest}
              persistent={offline.persistent}
            />
          )}
          {ready && differentEdition && (
            <p className="mt-3 text-sm">
              The saved edition differs from the one open.{' '}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="min-h-11 rounded-md font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Refresh to open the saved edition
              </button>
              .
            </p>
          )}
          {!ready && !progress && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Saves the map, local search, climb details, and available imagery.
              Content gaps remain clearly marked in the guide.
            </p>
          )}
        </>
      )}
    </section>
  )
}
