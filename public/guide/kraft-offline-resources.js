/* Same-origin anonymous resource discovery for the Kraft package. */
;(() => {
  const DOCUMENT = '/guide/kraft'
  function resourcePath(value, base = self.location.origin) {
    const url = new URL(value, base)
    if (url.origin !== self.location.origin) return null
    if (url.search && !url.pathname.startsWith('/_next/static/')) return null
    if (
      url.pathname === DOCUMENT ||
      url.pathname === '/guide/kraft.webmanifest' ||
      url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/kraft/') ||
      url.pathname.startsWith('/guide/assets/')
    )
      return url.pathname
    return null
  }

  async function fingerprint(response) {
    const body = await response.arrayBuffer()
    const hash = await crypto.subtle.digest('SHA-256', body)
    return {
      bytes: body.byteLength,
      sha256: Array.from(new Uint8Array(hash), byte =>
        byte.toString(16).padStart(2, '0'),
      ).join(''),
    }
  }

  function extractStaticPaths(text) {
    return [
      ...text.matchAll(
        /(?:\/?_next\/)?static\/(?:chunks|media|css)\/[^\s"'<>\\)]+/g,
      ),
    ]
      .map(match =>
        match[0].startsWith('/_next/')
          ? match[0]
          : `/_next/${match[0].replace(/^_next\//, '')}`,
      )
      .map(value => resourcePath(value))
      .filter(Boolean)
  }

  function kind(path) {
    if (path === DOCUMENT) return 'document'
    if (path === '/guide/kraft.webmanifest') return 'manifest'
    if (/\.css$/.test(path)) return 'style'
    if (/\.js$/.test(path)) return 'script'
    if (/\.(woff2?|ttf|otf)$/.test(path)) return 'font'
    if (/\.(json|txt)$/.test(path)) return 'data'
    return 'image'
  }

  async function anonymousFetch(path, signal) {
    const timeout = new AbortController()
    const timer = setTimeout(() => timeout.abort(), 30_000)
    const abort = () => timeout.abort()
    signal.addEventListener('abort', abort, { once: true })
    try {
      if (signal.aborted)
        throw new Error(
          'Download cancelled. Your previous download is unchanged.',
        )
      const response = await fetch(path, {
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'error',
        signal: timeout.signal,
        headers:
          path === DOCUMENT
            ? { Accept: 'text/html', 'X-Mtn-Public-Guide': '1' }
            : {},
      })
      if (!response.ok || response.type === 'opaque')
        throw new Error(`Could not download ${path}. Connect and retry.`)
      if (
        path === DOCUMENT &&
        (response.headers.get('X-Kraft-Public') !== '1' ||
          !response.headers.get('Content-Type')?.includes('text/html'))
      )
        throw new Error(
          'The public guide could not be verified. Refresh online and retry.',
        )
      // Finish reading the body under the timeout; partial responses never enter a package.
      await response.clone().arrayBuffer()
      return response
    } finally {
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
    }
  }

  self.KraftOfflineResources = {
    resourcePath,
    fingerprint,
    extractStaticPaths,
    kind,
    anonymousFetch,
  }
})()
