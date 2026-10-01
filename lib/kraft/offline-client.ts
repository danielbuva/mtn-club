import {
  isOfflineProgress,
  isOfflineSnapshot,
  type OfflineCommand,
  type OfflineProgress,
  type OfflineSnapshot,
} from './offline-types'

const RECEIPT_KEY = 'mtn-kraft-offline-receipt-v1'
let workerPromise: Promise<ServiceWorker> | undefined

export function offlineSupported(): boolean {
  return (
    window.isSecureContext && 'serviceWorker' in navigator && 'caches' in window
  )
}

async function registerWorker(): Promise<ServiceWorker> {
  const registration = await navigator.serviceWorker.register(
    '/guide/kraft-sw.js',
    { scope: '/guide/', updateViaCache: 'none' },
  )
  const worker =
    registration.installing ?? registration.waiting ?? registration.active
  if (!worker)
    throw new Error('Offline storage could not start. Refresh and retry.')
  if (worker.state === 'activated') return worker
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      worker.removeEventListener('statechange', onState)
      reject(
        new Error('Offline storage took too long to start. Refresh and retry.'),
      )
    }, 30_000)
    function onState() {
      if (worker?.state === 'activated') {
        window.clearTimeout(timeout)
        worker.removeEventListener('statechange', onState)
        resolve(worker)
      } else if (worker?.state === 'redundant') {
        window.clearTimeout(timeout)
        worker.removeEventListener('statechange', onState)
        reject(new Error('Offline storage could not start. Refresh and retry.'))
      }
    }
    worker.addEventListener('statechange', onState)
    onState()
  })
}

async function getWorker(): Promise<ServiceWorker> {
  workerPromise ??= registerWorker().catch(error => {
    workerPromise = undefined
    throw error
  })
  return workerPromise
}

export async function sendOfflineCommand(
  command: OfflineCommand,
  onProgress?: (progress: OfflineProgress) => void,
): Promise<OfflineSnapshot> {
  const worker = await getWorker()
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel()
    let timeout: number
    function close() {
      window.clearTimeout(timeout)
      channel.port1.close()
    }
    function resetTimeout() {
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        close()
        reject(new Error('The download stopped responding. Connect and retry.'))
      }, 45_000)
    }
    channel.port1.onmessage = (event: MessageEvent<unknown>) => {
      resetTimeout()
      const message = event.data
      if (typeof message !== 'object' || message === null) return
      if ('progress' in message && isOfflineProgress(message.progress)) {
        onProgress?.(message.progress)
      } else if ('result' in message && isOfflineSnapshot(message.result)) {
        close()
        resolve(message.result)
      } else if ('error' in message && typeof message.error === 'string') {
        close()
        reject(new Error(message.error))
      }
    }
    resetTimeout()
    worker.postMessage(command, [channel.port2])
  })
}

export function reconcileReceipt(snapshot: OfflineSnapshot): OfflineSnapshot {
  try {
    const receipt = localStorage.getItem(RECEIPT_KEY)
    if (snapshot.status === 'ready' && snapshot.manifest) {
      localStorage.setItem(RECEIPT_KEY, snapshot.manifest.storedAt)
    } else if (snapshot.status === 'not-downloaded' && receipt) {
      return { status: 'evicted' }
    }
  } catch {
    // Cache Storage remains authoritative when localStorage is unavailable.
  }
  return snapshot
}

export function clearOfflineReceipt() {
  try {
    localStorage.removeItem(RECEIPT_KEY)
  } catch {
    // Removing the cache does not depend on the optional eviction receipt.
  }
}

export function pageStaticPaths(): string[] {
  const paths = new Set<string>()
  for (const element of document.querySelectorAll('script[src], link[href]')) {
    const value = element.getAttribute('src') ?? element.getAttribute('href')
    if (!value) continue
    const url = new URL(value, location.origin)
    if (
      url.origin === location.origin &&
      url.pathname.startsWith('/_next/static/')
    ) {
      paths.add(url.pathname)
    }
  }
  return [...paths]
}
