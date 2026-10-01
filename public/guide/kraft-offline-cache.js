/* The package index is committed only after every staged response is verified. */
;(() => {
  const INDEX = 'mtn-kraft-index-v1'
  const PREFIX = 'mtn-kraft-package-v1-'
  const MANIFEST_KEY = '/guide/.kraft-package'
  const DOCUMENT = '/guide/kraft'
  let currentAbort = null
  let downloadBusy = false
  const {
    resourcePath,
    fingerprint,
    extractStaticPaths,
    kind,
    anonymousFetch,
  } = self.KraftOfflineResources

  async function readManifest() {
    const index = await caches.open(INDEX)
    const response = await index.match(MANIFEST_KEY)
    if (!response) return null
    try {
      const manifest = await response.json()
      if (
        typeof manifest.cacheName !== 'string' ||
        !manifest.cacheName.startsWith(PREFIX) ||
        !Array.isArray(manifest.resources) ||
        manifest.resources.length === 0 ||
        !manifest.resources.every(
          item =>
            resourcePath(item.url) === item.url &&
            typeof item.bytes === 'number' &&
            typeof item.sha256 === 'string',
        )
      )
        throw new Error('Invalid stored inventory')
      return manifest
    } catch {
      return { damaged: true }
    }
  }

  async function verify(manifest, onProgress) {
    if (!manifest || manifest.damaged) return ['/guide/kraft']
    if (!(await caches.has(manifest.cacheName))) {
      return manifest.resources.map(item => item.url)
    }
    const cache = await caches.open(manifest.cacheName)
    const missing = []
    let completed = 0
    for (const item of manifest.resources) {
      const response = await cache.match(item.url)
      if (!response || !response.ok) missing.push(item.url)
      else {
        const actual = await fingerprint(response)
        if (actual.bytes !== item.bytes || actual.sha256 !== item.sha256) {
          missing.push(item.url)
        }
      }
      completed += 1
      onProgress?.({
        phase: 'verifying',
        completed,
        total: manifest.resources.length,
        bytes: manifest.totalBytes,
      })
    }
    const keys = await cache.keys()
    if (keys.length !== manifest.resources.length)
      missing.push('Stored inventory does not match')
    return missing
  }

  async function status() {
    const manifest = await readManifest()
    if (!manifest) return { status: 'not-downloaded' }
    const missing = await verify(manifest)
    if (missing.length) {
      return {
        status: 'evicted',
        ...(manifest.damaged ? {} : { manifest }),
        missing,
      }
    }
    return { status: 'ready', manifest }
  }

  async function cleanPackages(keep) {
    for (const name of await caches.keys()) {
      if (name.startsWith(PREFIX) && name !== keep) await caches.delete(name)
    }
  }

  async function performDownload(command, onProgress, abort) {
    if (!abort) throw new Error('A Kraft download is already running.')
    if (
      !Array.isArray(command.assets) ||
      !Array.isArray(command.staticPaths) ||
      typeof command.version !== 'string'
    ) {
      throw new Error('Invalid guide inventory. Refresh and retry.')
    }
    const requested = [...command.assets]
    if (
      requested.some(path => resourcePath(path) !== path || path === DOCUMENT)
    ) {
      throw new Error(
        'The guide includes an unsupported resource. Refresh and retry.',
      )
    }
    const previous = await readManifest()
    await cleanPackages(previous?.cacheName)
    const cacheName = PREFIX + crypto.randomUUID()
    const stage = await caches.open(cacheName)
    const resources = []
    const paths = new Set([DOCUMENT])
    let inventory = command
    let bytes = 0
    let committed = false
    try {
      onProgress({
        phase: 'discovering',
        completed: 0,
        total: paths.size,
        bytes,
      })
      for (const path of paths) {
        if (abort.signal.aborted)
          throw new Error(
            'Download cancelled. Your previous download is unchanged.',
          )
        const response = await anonymousFetch(path, abort.signal)
        if (path === DOCUMENT || kind(path) === 'script') {
          const text = await response.clone().text()
          if (path === DOCUMENT) {
            const match = text.match(
              /<script\b[^>]*id=["']kraft-offline-inventory["'][^>]*>([\s\S]*?)<\/script>/,
            )
            if (!match)
              throw new Error(
                'The guide inventory is missing. Refresh online and retry.',
              )
            inventory = JSON.parse(match[1])
            if (
              typeof inventory.version !== 'string' ||
              !Array.isArray(inventory.assets) ||
              !['boulders', 'climbs', 'photos'].every(
                key => Number.isInteger(inventory[key]) && inventory[key] >= 0,
              ) ||
              inventory.assets.some(
                asset => resourcePath(asset) !== asset || asset === DOCUMENT,
              )
            )
              throw new Error(
                'The guide inventory could not be verified. Refresh online and retry.',
              )
            for (const asset of inventory.assets) paths.add(asset)
          }
          for (const dependency of extractStaticPaths(text))
            paths.add(dependency)
        } else if (kind(path) === 'style') {
          const css = await response.clone().text()
          for (const match of css.matchAll(
            /url\(\s*["']?([^\s"')]+)["']?\s*\)/g,
          )) {
            const dependency = resourcePath(
              match[1],
              new URL(path, self.location.origin),
            )
            if (dependency) paths.add(dependency)
          }
        }
        const digest = await fingerprint(response.clone())
        await stage.put(path, response)
        resources.push({ url: path, ...digest, kind: kind(path) })
        bytes += digest.bytes
        onProgress({
          phase: 'downloading',
          completed: resources.length,
          total: paths.size,
          bytes,
        })
      }
      const manifest = {
        cacheName,
        version: inventory.version,
        storedAt: new Date().toISOString(),
        boulders: inventory.boulders,
        climbs: inventory.climbs,
        photos: inventory.photos,
        resources,
        totalBytes: bytes,
      }
      const missing = await verify(manifest, onProgress)
      if (abort.signal.aborted)
        throw new Error(
          'Download cancelled. Your previous download is unchanged.',
        )
      if (missing.length)
        throw new Error('Saved files failed verification. Connect and retry.')
      const index = await caches.open(INDEX)
      await index.put(
        MANIFEST_KEY,
        new Response(JSON.stringify(manifest), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      committed = true
      await cleanPackages(cacheName)
      return { status: 'ready', manifest }
    } catch (error) {
      if (abort.signal.aborted)
        throw new Error(
          'Download cancelled. Your previous download is unchanged.',
        )
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error(
          'There is not enough device storage. Free some space and retry.',
        )
      }
      if (
        error &&
        (error.name === 'TypeError' || error.name === 'AbortError')
      ) {
        const previousReady =
          previous && !previous.damaged && (await verify(previous)).length === 0
        throw new Error(
          previousReady
            ? 'Update failed. Your previous verified download is still saved. Reconnect and retry.'
            : 'Download failed. Reconnect and retry.',
        )
      }
      throw error
    } finally {
      if (!committed) await caches.delete(cacheName)
    }
  }

  async function download(command, onProgress) {
    if (downloadBusy) throw new Error('A Kraft download is already running.')
    downloadBusy = true
    currentAbort = new AbortController()
    try {
      return await performDownload(command, onProgress, currentAbort)
    } finally {
      currentAbort = null
      downloadBusy = false
    }
  }

  async function remove() {
    if (downloadBusy)
      throw new Error('Cancel the current download before removing Kraft.')
    const index = await caches.open(INDEX)
    await index.delete(MANIFEST_KEY)
    await cleanPackages()
    return { status: 'not-downloaded' }
  }

  function cancel() {
    currentAbort?.abort()
    return { status: 'not-downloaded' }
  }

  self.KraftOfflineCache = {
    status,
    download,
    remove,
    cancel,
    readManifest,
    verify,
    resourcePath,
  }
})()
