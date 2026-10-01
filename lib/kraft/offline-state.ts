'use client'

import { useEffect, useRef, useState } from 'react'
import {
  clearOfflineReceipt,
  offlineSupported,
  pageStaticPaths,
  reconcileReceipt,
  sendOfflineCommand,
} from './offline-client'
import type { OfflineProgress, OfflineSnapshot } from './offline-types'
import type { KraftGuide } from './types'

export function useOfflineGuide(guide: KraftGuide) {
  const [snapshot, setSnapshot] = useState<OfflineSnapshot>({
    status: 'not-downloaded',
  })
  const [checking, setChecking] = useState(true)
  const [supported, setSupported] = useState(true)
  const [online, setOnline] = useState(true)
  const [progress, setProgress] = useState<OfflineProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [persistent, setPersistent] = useState<boolean | null>(null)
  const busy = useRef(false)

  useEffect(() => {
    let mounted = true
    setSupported(offlineSupported())
    setOnline(navigator.onLine)
    async function check() {
      if (!offlineSupported() || busy.current) {
        setChecking(false)
        return
      }
      try {
        const status = await sendOfflineCommand({ type: 'STATUS' })
        const persisted = navigator.storage?.persisted
          ? await navigator.storage.persisted()
          : false
        if (mounted) {
          setSnapshot(reconcileReceipt(status))
          setPersistent(persisted)
          setError(null)
        }
      } catch (failure) {
        if (mounted)
          setError(
            failure instanceof Error
              ? failure.message
              : 'Could not check your download. Refresh and retry.',
          )
      } finally {
        if (mounted) setChecking(false)
      }
    }
    function connectivity() {
      setOnline(navigator.onLine)
      check().catch(() =>
        setError('Could not check your download. Refresh and retry.'),
      )
    }
    function visibility() {
      if (document.visibilityState === 'visible') connectivity()
    }
    check().catch(() =>
      setError('Could not check your download. Refresh and retry.'),
    )
    window.addEventListener('online', connectivity)
    window.addEventListener('offline', connectivity)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      mounted = false
      window.removeEventListener('online', connectivity)
      window.removeEventListener('offline', connectivity)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])

  async function download() {
    if (busy.current) return
    busy.current = true
    setError(null)
    setProgress({ phase: 'discovering', completed: 0, total: 1, bytes: 0 })
    try {
      if (navigator.storage?.persist) {
        setPersistent(await navigator.storage.persist().catch(() => false))
      }
      const status = await sendOfflineCommand(
        {
          type: 'DOWNLOAD',
          version: guide.version,
          assets: guide.assets.map(asset => asset.src),
          staticPaths: pageStaticPaths(),
          boulders: guide.boulders.length,
          climbs: guide.boulders.reduce(
            (total, boulder) => total + boulder.climbs.length,
            0,
          ),
          photos: guide.assets.filter(asset => asset.kind === 'face-photo')
            .length,
        },
        setProgress,
      )
      setSnapshot(reconcileReceipt(status))
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Download failed. Connect and retry.',
      )
      try {
        setSnapshot(
          reconcileReceipt(await sendOfflineCommand({ type: 'STATUS' })),
        )
      } catch {
        // Keep the last known package while showing the actionable download error.
      }
    } finally {
      busy.current = false
      setProgress(null)
    }
  }

  async function remove() {
    if (busy.current) return
    busy.current = true
    setChecking(true)
    setError(null)
    try {
      const status = await sendOfflineCommand({ type: 'REMOVE' })
      clearOfflineReceipt()
      setSnapshot(status)
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not remove the download. Retry.',
      )
    } finally {
      busy.current = false
      setChecking(false)
    }
  }

  async function cancel() {
    try {
      await sendOfflineCommand({ type: 'CANCEL' })
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not cancel. Please retry.',
      )
    }
  }

  return {
    snapshot,
    checking,
    supported,
    online,
    progress,
    error,
    persistent,
    download,
    remove,
    cancel,
  }
}
