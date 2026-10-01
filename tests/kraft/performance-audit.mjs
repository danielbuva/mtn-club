import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const baseURL = process.env.KRAFT_BASE_URL ?? 'http://127.0.0.1:3130'
const output = '.tmp/kraft-gauntlet/performance'
await mkdir(output, { recursive: true })
const browser = await chromium.launch()
const observations = []

for (const route of ['/welcome', '/guide/kraft']) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  const session = await context.newCDPSession(page)
  await session.send('Network.enable')
  await session.send('Network.setCacheDisabled', { cacheDisabled: true })
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await session.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 200000,
    uploadThroughput: 93750,
  })
  const failures = []
  const errors = []
  page.on('requestfailed', request =>
    failures.push({ url: request.url(), error: request.failure()?.errorText }),
  )
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    window.kraftAudit = { lcp: [], shifts: [] }
    new PerformanceObserver(list => {
      for (const entry of list.getEntries())
        window.kraftAudit.lcp.push(entry.startTime)
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.kraftAudit.shifts.push(entry.value)
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
  const started = Date.now()
  await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' })
  const loadedMs = Date.now() - started
  let gradeFilterMs
  let openBoulderMs
  if (route === '/guide/kraft') {
    const filterStart = performance.now()
    await page.getByRole('button', { name: 'V0–V2', exact: true }).click()
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll('button')).some(
        button =>
          button.textContent === 'V0–V2' &&
          button.getAttribute('aria-pressed') === 'true',
      ),
    )
    gradeFilterMs = Math.round(performance.now() - filterStart)
    const boulderStart = performance.now()
    await page
      .getByRole('button', { name: /^The Cube, .*Open boulder\.$/ })
      .click()
    await page.getByRole('dialog', { name: 'The Cube boulder guide' }).waitFor()
    openBoulderMs = Math.round(performance.now() - boulderStart)
    await page
      .getByRole('button', { name: 'Back to Kraft', exact: true })
      .click()
  }
  const timings = await page.evaluate(() => ({
    paint: performance
      .getEntriesByType('paint')
      .map(entry => ({ name: entry.name, ms: Math.round(entry.startTime) })),
    navigation: performance.getEntriesByType('navigation').map(entry => ({
      domContentLoaded: Math.round(entry.domContentLoadedEventEnd),
      load: Math.round(entry.loadEventEnd),
      transferBytes: entry.transferSize,
    })),
    lcpMs: Math.round(Math.max(0, ...window.kraftAudit.lcp)),
    cls: window.kraftAudit.shifts.reduce((sum, value) => sum + value, 0),
    resources: performance.getEntriesByType('resource').map(entry => ({
      url: entry.name,
      bytes: entry.transferSize,
      durationMs: Math.round(entry.duration),
    })),
  }))
  await page.screenshot({
    path: `${output}/constrained-${route.split('/').at(-1)}.png`,
  })
  observations.push({
    route,
    baseURL,
    emulation:
      'Chromium 390×844, CPU 4×, 150 ms RTT, 1.6 Mbps down / 750 kbps up, cold cache',
    loadedMs,
    gradeFilterMs,
    openBoulderMs,
    timings,
    failures,
    errors,
  })
  await context.close()
}

await writeFile(
  `${output}/performance-observations.json`,
  JSON.stringify(observations, null, 2),
)
console.log(
  JSON.stringify(
    observations.map(({ timings, ...observation }) => ({
      ...observation,
      paint: timings.paint,
      lcpMs: timings.lcpMs,
      cls: timings.cls,
      sameOriginTransferBytes: timings.resources
        .filter(resource => resource.url.startsWith(baseURL))
        .reduce((sum, resource) => sum + resource.bytes, 0),
    })),
    null,
    2,
  ),
)
await browser.close()
