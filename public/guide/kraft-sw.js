/* Scope: /guide/. Only explicit public Kraft packages are stored. */
importScripts(
  '/guide/kraft-offline-resources.js',
  '/guide/kraft-offline-cache.js',
)

/* Stored with the service worker itself, independent of guide package caches. */
;(() => {
  function recoveryResponse(state) {
    const incomplete = state === 'incomplete'
    const unavailable = state === 'storage-unavailable'
    const title = incomplete
      ? 'Your saved Kraft guide needs repair'
      : unavailable
        ? 'Offline storage is unavailable'
        : 'Kraft is not saved on this device'
    const explanation = incomplete
      ? 'Some saved files are missing or damaged. The guide cannot be opened safely while the network is unavailable.'
      : unavailable
        ? 'This browser cannot read its saved guide right now. Reconnect to open Kraft and check your download.'
        : 'No complete offline download was found. It may not have been downloaded, or your browser may have cleared its storage.'
    return new Response(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#F8F1DF"><title>Kraft · MTN Club offline recovery</title><style>
      *{box-sizing:border-box}html{background:#F8F1DF;color:#28211D;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{margin:0;padding:32px 20px}main{max-width:480px;margin:8vh auto}.wordmark{font-size:15px;font-weight:800;letter-spacing:.16em}.eyebrow{margin-top:42px;font-size:13px;font-weight:650;letter-spacing:.1em;text-transform:uppercase;color:#596045}svg{width:64px;height:48px;display:block;margin:24px 0;color:#36503E}h1{margin:0;font-size:clamp(28px,7vw,38px);line-height:1.15;letter-spacing:-.04em}p,li{font-size:16px;line-height:1.65}p{margin:18px 0;color:#59534A}ol{margin:24px 0;padding-left:24px}li{padding:5px 0}.action{display:flex;min-height:52px;align-items:center;justify-content:center;margin-top:28px;border-radius:12px;background:#36503E;color:#fff;text-decoration:none;font-weight:650}.action:focus-visible{outline:3px solid #28211D;outline-offset:4px}.note{border-top:1px solid #CFC7B6;margin-top:28px;padding-top:18px;font-size:13px}strong{font-weight:650}
      </style></head><body><main><div class="wordmark">MTN CLUB</div><div class="eyebrow">Kraft field guide · offline recovery</div><svg viewBox="0 0 80 60" aria-hidden="true"><path d="M4 52 28 13l13 22 10-16 25 33H4Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="m21 25 7 5 6-5m11 4 6 6 5-5" fill="none" stroke="currentColor" stroke-width="2"/></svg><h1>${title}</h1><p>${explanation}</p><ol><li>Reconnect to Wi-Fi or cellular service.</li><li>Reload Kraft using the button below.</li><li>Choose <strong>Download guide</strong> and wait for <strong>This edition is saved</strong> before going offline.</li></ol><a class="action" href="/guide/kraft">Reload Kraft after reconnecting</a><p class="note">This recovery screen works without the saved guide files. ${incomplete ? 'The incomplete package has not been marked ready or erased.' : 'A complete, verified download is required to use Kraft offline.'}</p></main></body></html>`,
      {
        status: 503,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Kraft-Recovery': state,
          'Content-Security-Policy':
            "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
        },
      },
    )
  }
  self.KraftOfflineRecovery = { recoveryResponse }
})()

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', event => {
  const port = event.ports[0]
  if (!port || !event.data || typeof event.data.type !== 'string') return
  const command = event.data
  async function respond() {
    try {
      const cache = self.KraftOfflineCache
      let result
      switch (command.type) {
        case 'STATUS':
          result = await cache.status()
          break
        case 'DOWNLOAD':
          result = await cache.download(command, progress =>
            port.postMessage({ progress }),
          )
          break
        case 'REMOVE':
          result = await cache.remove()
          break
        case 'CANCEL':
          result = cache.cancel()
          break
        default:
          throw new Error('Unknown offline command.')
      }
      port.postMessage({ result })
    } catch (error) {
      port.postMessage({
        error:
          error instanceof Error
            ? error.message
            : 'Offline storage failed. Refresh and retry.',
      })
    }
  }
  event.waitUntil(respond())
})

self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  const navigation =
    request.mode === 'navigate' && url.pathname === '/guide/kraft'
  // Next's RSC prefetches need their own network response, never cached HTML.
  if (url.pathname === '/guide/kraft' && !navigation) return
  if (!navigation && !self.KraftOfflineCache.resourcePath(url.href)) return
  async function serve() {
    let recoveryState = 'not-downloaded'
    try {
      const manifest = await self.KraftOfflineCache.readManifest()
      if (manifest) recoveryState = 'incomplete'
      if (manifest && !manifest.damaged) {
        const resource = manifest.resources.find(
          item => item.url === url.pathname,
        )
        if (
          resource &&
          (!navigation ||
            (await self.KraftOfflineCache.verify(manifest)).length === 0)
        ) {
          const cache = await caches.open(manifest.cacheName)
          const response = await cache.match(resource.url)
          if (response) return response
        }
      }
    } catch {
      recoveryState = 'storage-unavailable'
    }
    try {
      // An incomplete package recovers normally as soon as the network returns.
      return await fetch(request, navigation ? { cache: 'no-store' } : {})
    } catch (error) {
      if (navigation) {
        return self.KraftOfflineRecovery.recoveryResponse(recoveryState)
      }
      throw error
    }
  }
  event.respondWith(serve())
})
