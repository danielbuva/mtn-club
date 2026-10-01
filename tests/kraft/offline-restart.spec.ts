import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, expect, test } from '@playwright/test'

// Persistent contexts are traced explicitly across their separate lifetimes.
test.use({ trace: 'off' })

test('the saved package survives a complete browser process restart while offline', async ({
  baseURL,
}, testInfo) => {
  const profile = await mkdtemp(join(tmpdir(), 'kraft-offline-regression-'))
  const contextOptions = {
    viewport: testInfo.project.use.viewport,
    isMobile: testInfo.project.use.isMobile,
    hasTouch: testInfo.project.use.hasTouch,
    serviceWorkers: 'allow' as const,
  }
  const online = await chromium.launchPersistentContext(profile, contextOptions)
  try {
    await online.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    })
    const page = online.pages()[0] ?? (await online.newPage())
    await page.goto(`${baseURL}/guide/kraft`)
    await page
      .getByRole('button', { name: 'Download guide', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { name: 'This edition is saved', exact: true }),
    ).toBeVisible({ timeout: 45000 })
  } finally {
    const onlineTrace = testInfo.outputPath('download-before-browser-close.zip')
    await online.tracing.stop({ path: onlineTrace })
    await testInfo.attach('download-before-browser-close', {
      path: onlineTrace,
      contentType: 'application/zip',
    })
    await online.close()
  }

  const offline = await chromium.launchPersistentContext(profile, {
    ...contextOptions,
    offline: true,
  })
  try {
    await offline.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    })
    const reopened = offline.pages()[0] ?? (await offline.newPage())
    await reopened.goto(`${baseURL}/guide/kraft`)
    await expect(
      reopened.getByRole('heading', { name: /Kraft\s*Boulders/i }),
    ).toBeVisible()
    await expect(
      reopened.getByRole('region', { name: 'Offline guide', exact: true }),
    ).toContainText('This edition is saved')
    const networkReachable = await reopened.evaluate(async () => {
      try {
        await fetch(`/kraft-network-probe-${Date.now()}`, { cache: 'no-store' })
        return true
      } catch {
        return false
      }
    })
    expect(networkReachable).toBe(false)
    await reopened.getByRole('searchbox').fill('Monkey Bars')
    await reopened
      .getByRole('button', { name: 'Monkey Bars V2', exact: true })
      .click()
    const dialog = reopened.getByRole('dialog', {
      name: 'Monkey Bar Boulder boulder guide',
    })
    await expect(dialog).toBeVisible()
    const climbDetails = dialog.getByRole('article', {
      name: 'Monkey Bars details',
      includeHidden: true,
    })
    await expect(climbDetails).toHaveCount(1)
    await expect(climbDetails).toBeHidden()
    await dialog
      .getByLabel('View Monkey Bars climb details', { exact: true })
      .click()
    await expect(climbDetails).toBeVisible()
    await expect(climbDetails).toContainText(
      'Physical line identity is unresolved',
    )
    await testInfo.attach('after-offline-browser-restart', {
      body: await reopened.screenshot({ scale: 'css' }),
      contentType: 'image/png',
    })
  } finally {
    const offlineTrace = testInfo.outputPath('offline-browser-restart.zip')
    await offline.tracing.stop({ path: offlineTrace })
    await testInfo.attach('offline-browser-restart', {
      path: offlineTrace,
      contentType: 'application/zip',
    })
    await offline.close()
    await rm(profile, { recursive: true, force: true })
  }
})
