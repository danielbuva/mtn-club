import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const baseUrl = process.env.KRAFT_TEST_URL ?? 'http://127.0.0.1:3001'
const directory = await mkdtemp(join(tmpdir(), 'kraft-recovery-'))
const profile = join(directory, 'profile')
const outcomes = { baseUrl, directory, tests: [] }
let context

async function open(offline = false) {
  context = await chromium.launchPersistentContext(profile, {
    headless: true,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'allow',
    offline,
    // Block browser-level network for cold service workers as well as page targets.
    ...(offline
      ? {
          proxy: { server: 'http://127.0.0.1:9' },
          args: ['--proxy-bypass-list=<-loopback>'],
        }
      : {}),
  })
  await context.setOffline(offline)
  const page = context.pages()[0] ?? (await context.newPage())
  return page
}

async function inventory(page) {
  return page.evaluate(async () => {
    const index = await caches.open('mtn-kraft-index-v1')
    const response = await index.match('/guide/.kraft-package')
    return response ? response.json() : null
  })
}

async function assertRecovery(page, kind, heading, screenshot) {
  const response = await page.reload({ waitUntil: 'domcontentloaded' })
  if (response.headers()['x-kraft-recovery'] !== kind) {
    outcomes.unexpectedNavigation = {
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
      headers: response.headers(),
      body: (await page.locator('body').innerText()).slice(0, 1000),
    }
  }
  assert.equal(response.headers()['x-kraft-recovery'], kind)
  await page.getByRole('heading', { name: heading }).waitFor()
  await page
    .getByRole('link', { name: 'Reload Kraft after reconnecting' })
    .waitFor()
  const assets = await page.locator('script[src], link[href], img').count()
  assert.equal(assets, 0, 'recovery must have no network-dependent assets')
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).backgroundColor,
    ),
    'rgb(248, 241, 223)',
  )
  await page.screenshot({ path: join(directory, screenshot), fullPage: true })
  outcomes.tests.push({
    kind,
    status: response.status(),
    screenshot,
    externalAssets: assets,
  })
}

try {
  let page = await open()
  await page.goto(`${baseUrl}/guide/kraft`, { waitUntil: 'networkidle' })
  await page
    .getByRole('button', { name: 'Download guide', exact: true })
    .click()
  await page
    .getByRole('heading', { name: 'This edition is saved' })
    .waitFor({ timeout: 60_000 })
  const saved = await inventory(page)
  outcomes.inventory = {
    files: saved.resources.length,
    totalBytes: saved.totalBytes,
    version: saved.version,
  }
  await page.evaluate(async manifest => {
    const cache = await caches.open(manifest.cacheName)
    const stylesheet = manifest.resources.find(file => file.kind === 'style')
    if (!stylesheet) throw new Error('No cached stylesheet to evict')
    await cache.delete(stylesheet.url)
  }, saved)
  await context.setOffline(true)
  await assertRecovery(
    page,
    'incomplete',
    'Your saved Kraft guide needs repair',
    'partial-eviction-refresh.png',
  )
  await context.close()
  page = await open(true)
  const reopened = await page.goto(`${baseUrl}/guide/kraft`, {
    waitUntil: 'domcontentloaded',
  })
  assert.equal(reopened.headers()['x-kraft-recovery'], 'incomplete')
  await page
    .getByRole('heading', { name: 'Your saved Kraft guide needs repair' })
    .waitFor()
  await page.screenshot({
    path: join(directory, 'partial-eviction-browser-relaunch.png'),
    fullPage: true,
  })
  outcomes.tests.push({
    kind: 'incomplete-browser-relaunch',
    status: reopened.status(),
  })
  await context.setOffline(true)
  outcomes.coldNetworkProbe = await page.evaluate(async () => {
    try {
      await fetch('/kraft/offline-connectivity-probe', { cache: 'no-store' })
      return { failed: false }
    } catch (error) {
      return {
        failed: true,
        message: error instanceof Error ? error.message : String(error),
      }
    }
  })
  assert.equal(
    outcomes.coldNetworkProbe.failed,
    true,
    'uncached worker requests must fail before testing total eviction',
  )
  outcomes.beforeWholeEviction = await page.evaluate(
    async cacheName => ({
      online: navigator.onLine,
      controller: navigator.serviceWorker.controller?.scriptURL,
      deleted: await caches.delete(cacheName),
      remaining: await caches.keys(),
    }),
    saved.cacheName,
  )
  await assertRecovery(
    page,
    'incomplete',
    'Your saved Kraft guide needs repair',
    'whole-package-eviction.png',
  )
  await context.close()
  page = await open()
  await page.goto(`${baseUrl}/guide/kraft`, { waitUntil: 'networkidle' })
  await page
    .getByRole('button', { name: 'Download guide', exact: true })
    .click()
  await page
    .getByRole('heading', { name: 'This edition is saved' })
    .waitFor({ timeout: 60_000 })
  const repaired = await inventory(page)
  assert.notEqual(repaired.cacheName, saved.cacheName)
  await context.setOffline(true)
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'This edition is saved' }).waitFor()
  outcomes.tests.push({
    kind: 'reconnect-redownload-offline-refresh',
    files: repaired.resources.length,
    totalBytes: repaired.totalBytes,
  })
  await page.getByRole('button', { name: 'Remove', exact: true }).click()
  await page
    .getByRole('button', { name: 'Download guide', exact: true })
    .waitFor()
  await assertRecovery(
    page,
    'not-downloaded',
    'Kraft is not saved on this device',
    'removed-guide-recovery.png',
  )
  outcomes.result = 'passed'
} catch (error) {
  outcomes.result = 'failed'
  outcomes.error = error instanceof Error ? error.message : String(error)
  throw error
} finally {
  await context?.close()
  await writeFile(
    join(directory, 'results.json'),
    JSON.stringify(outcomes, null, 2),
  )
  console.log(JSON.stringify(outcomes, null, 2))
}
