import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

const ORIGIN = 'https://mtn.example'
const scripts = ['resources', 'cache'].map(name =>
  readFileSync(
    new URL(`../public/guide/kraft-offline-${name}.js`, import.meta.url),
    'utf8',
  ),
)
const command = {
  type: 'DOWNLOAD',
  version: 'old',
  assets: [],
  staticPaths: [],
  boulders: 1,
  climbs: 2,
  photos: 1,
}

class MemoryCache {
  entries = new Map()
  corrupt = null
  key(value) {
    return new URL(typeof value === 'string' ? value : value.url, ORIGIN).href
  }
  async put(key, response) {
    const url = this.key(key)
    this.entries.set(url, this.corrupt?.(url, response) ?? response.clone())
  }
  async match(key) {
    return this.entries.get(this.key(key))?.clone()
  }
  async delete(key) {
    return this.entries.delete(this.key(key))
  }
  async keys() {
    return [...this.entries.keys()].map(url => new Request(url))
  }
}

function harness() {
  const stores = new Map()
  const requests = []
  const files = new Map([
    [
      '/_next/static/chunks/main.js',
      'self.push(["static/chunks/extra.js"]);fetch("/api/account")',
    ],
    ['/_next/static/chunks/extra.js', '/* guide */'],
    [
      '/_next/static/chunks/main.css',
      '@font-face{src:url(../media/field.woff2)}',
    ],
    ['/_next/static/media/field.woff2', 'font-bytes'],
    ['/kraft/face.jpg', 'photo-bytes'],
  ])
  const inventory = {
    version: 'edition-1',
    assets: ['/kraft/face.jpg'],
    boulders: 1,
    climbs: 2,
    photos: 1,
  }
  let failure = null
  let failureError = null
  let gate = null
  let publicHeader = true
  const cacheStorage = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new MemoryCache())
      return stores.get(name)
    },
    async has(name) {
      return stores.has(name)
    },
    async keys() {
      return [...stores.keys()]
    },
    async delete(name) {
      return stores.delete(name)
    },
  }
  async function fetchResource(path, options) {
    requests.push({ path, options })
    if (gate && path === '/guide/kraft') {
      await new Promise((resolve, reject) => {
        gate.resolve = resolve
        options.signal.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true },
        )
      })
    }
    if (path === failure)
      throw failureError ?? new Error('Network disconnected')
    if (path === '/guide/kraft')
      return new Response(
        `<html><link href="/_next/static/chunks/main.css" rel="stylesheet"><script id="kraft-offline-inventory" type="application/json">${JSON.stringify(inventory)}</script><script src="/_next/static/chunks/main.js?dpl=release"></script><a href="/account">Account</a></html>`,
        {
          headers: {
            'Content-Type': 'text/html',
            ...(publicHeader ? { 'X-Kraft-Public': '1' } : {}),
          },
        },
      )
    if (!files.has(path)) return new Response('Not found', { status: 404 })
    return new Response(files.get(path))
  }
  function startWorker() {
    const self = { location: { origin: ORIGIN } }
    const context = {
      self,
      caches: cacheStorage,
      fetch: fetchResource,
      crypto: webcrypto,
      URL,
      Response,
      Request,
      AbortController,
      setTimeout,
      clearTimeout,
      console,
    }
    for (const script of scripts) runInNewContext(script, context)
    return self.KraftOfflineCache
  }
  return {
    stores,
    requests,
    files,
    inventory,
    cacheStorage,
    startWorker,
    fail(path, error = null) {
      failure = path
      failureError = error
    },
    block() {
      gate = {}
      return gate
    },
    noPublicHeader() {
      publicHeader = false
    },
  }
}

test('explicit package discovers exact script, CSS, font and photo dependencies and survives a worker restart', async () => {
  const h = harness()
  const worker = h.startWorker()
  assert.equal((await worker.status()).status, 'not-downloaded')
  assert.equal(h.requests.length, 0, 'checking status must not download')
  const progress = []
  const result = await worker.download(command, value => progress.push(value))
  assert.equal(result.status, 'ready')
  assert.equal(
    result.manifest.version,
    'edition-1',
    'use fresh HTML inventory, not stale client metadata',
  )
  assert.deepEqual(
    [...result.manifest.resources.map(resource => resource.url)].sort(),
    [
      '/guide/kraft',
      '/kraft/face.jpg',
      '/_next/static/chunks/main.css',
      '/_next/static/chunks/main.js',
      '/_next/static/chunks/extra.js',
      '/_next/static/media/field.woff2',
    ].sort(),
  )
  assert.equal(
    result.manifest.totalBytes,
    result.manifest.resources.reduce((sum, file) => sum + file.bytes, 0),
  )
  assert.ok(
    result.manifest.resources.every(file => /^[a-f0-9]{64}$/.test(file.sha256)),
  )
  assert.ok(progress.some(item => item.phase === 'verifying'))
  assert.ok(h.requests.every(request => request.options.credentials === 'omit'))
  assert.ok(h.requests.every(request => request.options.cache === 'no-store'))
  assert.ok(h.requests.every(request => !request.path.includes('/account')))
  const requestCount = h.requests.length
  assert.equal((await h.startWorker().status()).status, 'ready')
  assert.equal(
    h.requests.length,
    requestCount,
    'rechecking a saved guide uses zero network',
  )
})

test('web manifest and installation icons are verified with a distinct manifest kind', async () => {
  const h = harness()
  h.inventory.assets.push(
    '/guide/kraft.webmanifest',
    '/kraft/icon-192.png',
    '/kraft/icon-512.png',
    '/kraft/geo-features.json',
    '/kraft/geo-license.txt',
  )
  h.files.set(
    '/guide/kraft.webmanifest',
    JSON.stringify({
      icons: [{ src: '/kraft/icon-192.png' }, { src: '/kraft/icon-512.png' }],
    }),
  )
  h.files.set('/kraft/icon-192.png', 'icon-192')
  h.files.set('/kraft/icon-512.png', 'icon-512')
  h.files.set('/kraft/geo-features.json', '{}')
  h.files.set('/kraft/geo-license.txt', 'Open geographic data attribution')
  const result = await h.startWorker().download(command, () => {})
  assert.equal(
    result.manifest.resources.find(
      item => item.url === '/guide/kraft.webmanifest',
    ).kind,
    'manifest',
  )
  assert.equal(
    result.manifest.resources.filter(item => item.kind === 'data').length,
    2,
  )
  assert.equal(
    result.manifest.resources.filter(item => item.kind === 'image').length,
    3,
  )
  assert.equal(
    result.manifest.photos,
    1,
    'installation icons do not inflate face-photo count',
  )
})

test('an interrupted network update explains that the verified previous edition is preserved', async () => {
  const h = harness()
  const worker = h.startWorker()
  await worker.download(command, () => {})
  h.fail('/kraft/face.jpg', new TypeError('Failed to fetch'))
  await assert.rejects(
    worker.download(command, () => {}),
    /previous verified download is still saved\. Reconnect and retry/,
  )
  assert.equal((await worker.status()).status, 'ready')
})

function navigationWorker(h, networkFetch) {
  const listeners = new Map()
  const self = {
    location: { origin: ORIGIN },
    addEventListener(type, listener) {
      listeners.set(type, listener)
    },
    KraftOfflineCache: h.startWorker(),
  }
  const context = {
    self,
    importScripts() {},
    URL,
    Response,
    caches: h.cacheStorage,
    fetch: networkFetch,
  }
  runInNewContext(
    readFileSync(
      new URL('../public/guide/kraft-sw.js', import.meta.url),
      'utf8',
    ),
    context,
  )
  return {
    cache: self.KraftOfflineCache,
    async navigate() {
      let result
      listeners.get('fetch')({
        request: {
          url: `${ORIGIN}/guide/kraft`,
          method: 'GET',
          mode: 'navigate',
        },
        respondWith(response) {
          result = response
        },
      })
      return result
    },
  }
}

test('partial or complete package eviction serves self-contained offline recovery and reconnect returns the fresh guide', async () => {
  const h = harness()
  let connected = false
  const browser = navigationWorker(h, async () => {
    if (!connected) throw new TypeError('Network unavailable')
    return new Response('fresh online guide')
  })
  const result = await browser.cache.download(command, () => {})
  const cache = h.stores.get(result.manifest.cacheName)
  await cache.delete('/_next/static/chunks/main.css')
  const partial = await browser.navigate()
  assert.equal(partial.headers.get('X-Kraft-Recovery'), 'incomplete')
  const html = await partial.text()
  assert.match(html, /Your saved Kraft guide needs repair/)
  assert.match(html, /Reload Kraft after reconnecting/)
  assert.match(html, /Download guide/)
  assert.doesNotMatch(html, /<script|<link|<img/)
  assert.ok(
    h.stores.has(result.manifest.cacheName),
    'recovery must preserve the package for repair',
  )
  await h.cacheStorage.delete(result.manifest.cacheName)
  assert.equal(
    (await browser.navigate()).headers.get('X-Kraft-Recovery'),
    'incomplete',
  )
  connected = true
  const online = await browser.navigate()
  assert.equal(await online.text(), 'fresh online guide')
  assert.equal(online.headers.get('X-Kraft-Recovery'), null)
})

test('never-downloaded and unavailable storage each have an actionable offline recovery state', async () => {
  const h = harness()
  const browser = navigationWorker(h, async () => {
    throw new TypeError('Network unavailable')
  })
  const missing = await browser.navigate()
  assert.equal(missing.headers.get('X-Kraft-Recovery'), 'not-downloaded')
  assert.match(await missing.text(), /Kraft is not saved on this device/)
  browser.cache.readManifest = async () => {
    throw new Error('Storage denied')
  }
  const unavailable = await browser.navigate()
  assert.equal(
    unavailable.headers.get('X-Kraft-Recovery'),
    'storage-unavailable',
  )
  assert.match(await unavailable.text(), /Offline storage is unavailable/)
})

test('a failed update rolls back the stage and preserves the complete previous package', async () => {
  const h = harness()
  const worker = h.startWorker()
  const original = await worker.download(command, () => {})
  h.inventory.version = 'edition-2'
  h.inventory.assets = ['/kraft/new-face.jpg']
  h.fail('/kraft/new-face.jpg')
  await assert.rejects(
    worker.download(command, () => {}),
    /Network disconnected/,
  )
  const recovered = await worker.status()
  assert.equal(recovered.status, 'ready')
  assert.equal(recovered.manifest.cacheName, original.manifest.cacheName)
  assert.equal(recovered.manifest.version, 'edition-1')
  assert.equal(
    [...h.stores.keys()].filter(name => name.startsWith('mtn-kraft-package-'))
      .length,
    1,
  )
})

test('corruption and missing files never report a ready guide', async () => {
  const h = harness()
  const worker = h.startWorker()
  const result = await worker.download(command, () => {})
  const cache = h.stores.get(result.manifest.cacheName)
  await cache.put('/kraft/face.jpg', new Response('PHOTO-BYTES'))
  const corrupted = await worker.status()
  assert.equal(corrupted.status, 'evicted')
  assert.ok(corrupted.missing.includes('/kraft/face.jpg'))
  await h.cacheStorage.delete(result.manifest.cacheName)
  const evicted = await worker.status()
  assert.equal(evicted.status, 'evicted')
  assert.equal(evicted.missing.length, result.manifest.resources.length)
})

test('staged read-back failure cannot publish a partial package', async () => {
  const h = harness()
  const baseOpen = h.cacheStorage.open
  h.cacheStorage.open = async name => {
    const cache = await baseOpen(name)
    if (name.startsWith('mtn-kraft-package-'))
      cache.corrupt = url =>
        url.endsWith('/face.jpg') ? new Response('bad') : null
    return cache
  }
  const worker = h.startWorker()
  await assert.rejects(
    worker.download(command, () => {}),
    /failed verification/,
  )
  assert.equal((await worker.status()).status, 'not-downloaded')
  assert.equal(
    [...h.stores.keys()].filter(name => name.startsWith('mtn-kraft-package-'))
      .length,
    0,
  )
})

test('private or external resources and unmarked HTML are rejected', async () => {
  const h = harness()
  const worker = h.startWorker()
  await assert.rejects(
    worker.download({ ...command, assets: ['/account'] }, () => {}),
    /unsupported resource/,
  )
  await assert.rejects(
    worker.download(
      { ...command, assets: ['https://other.example/kraft/photo.jpg'] },
      () => {},
    ),
    /unsupported resource/,
  )
  h.noPublicHeader()
  await assert.rejects(
    worker.download(command, () => {}),
    /public guide could not be verified/,
  )
  assert.equal((await worker.status()).status, 'not-downloaded')
})

test('parallel downloads are serialized and cancellation removes only the stage', async () => {
  const h = harness()
  const worker = h.startWorker()
  const original = await worker.download(command, () => {})
  const gate = h.block()
  const updating = worker.download(command, () => {})
  while (!gate.resolve) await new Promise(resolve => setTimeout(resolve, 1))
  await assert.rejects(
    worker.download(command, () => {}),
    /already running/,
  )
  worker.cancel()
  await assert.rejects(updating, /Download cancelled/)
  assert.equal(
    (await worker.status()).manifest.cacheName,
    original.manifest.cacheName,
  )
  assert.equal((await worker.remove()).status, 'not-downloaded')
  assert.equal((await worker.status()).status, 'not-downloaded')
})

test('the worker never substitutes guide HTML for Next RSC requests or account navigation', () => {
  const listeners = new Map()
  const self = {
    location: { origin: ORIGIN },
    addEventListener(type, listener) {
      listeners.set(type, listener)
    },
    KraftOfflineCache: {
      resourcePath(value) {
        const path = new URL(value).pathname
        return path === '/guide/kraft' || path.startsWith('/_next/static/')
          ? path
          : null
      },
    },
  }
  const worker = readFileSync(
    new URL('../public/guide/kraft-sw.js', import.meta.url),
    'utf8',
  )
  runInNewContext(worker, { self, importScripts() {}, URL })
  for (const request of [
    { url: `${ORIGIN}/guide/kraft?_rsc=abc`, method: 'GET', mode: 'cors' },
    { url: `${ORIGIN}/account`, method: 'GET', mode: 'navigate' },
    { url: `${ORIGIN}/api/account`, method: 'GET', mode: 'cors' },
    {
      url: 'https://other.example/guide/kraft',
      method: 'GET',
      mode: 'navigate',
    },
  ]) {
    let intercepted = false
    listeners.get('fetch')({
      request,
      respondWith() {
        intercepted = true
      },
    })
    assert.equal(
      intercepted,
      false,
      `${request.url} must use its normal network path`,
    )
  }
})
