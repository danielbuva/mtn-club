import { expect, test } from '@playwright/test'
import { kraftGuide } from '../../lib/kraft/data'

test('verified production download survives zero network, reload and a reopened tab', async ({
  page,
  context,
}, testInfo) => {
  await page.goto('/guide/kraft')
  const offlineKit = page.getByRole('region', {
    name: 'Offline guide',
    exact: true,
  })
  await offlineKit
    .getByRole('button', { name: 'Download guide', exact: true })
    .click()
  await expect(
    offlineKit.getByRole('heading', {
      name: 'This edition is saved',
      exact: true,
    }),
  ).toBeVisible({ timeout: 45000 })
  const climbCount = kraftGuide.boulders.reduce(
    (total, boulder) => total + boulder.climbs.length,
    0,
  )
  const photoCount = kraftGuide.assets.filter(
    asset => asset.kind === 'face-photo',
  ).length
  await expect(offlineKit).toContainText(
    `${kraftGuide.boulders.length} boulders · ${climbCount} climbs · ${photoCount} face photo${photoCount === 1 ? '' : 's'}`,
  )
  await offlineKit.getByText(/^View verified download/).click()
  const inventory = offlineKit.getByRole('list', {
    name: 'Downloaded file inventory',
  })
  await expect(inventory).toContainText('/guide/kraft')
  await expect(inventory).toContainText('/kraft/geo-features.json')
  await expect(inventory).toContainText('/_next/static/')
  await expect(inventory).toContainText('.woff2')
  for (const asset of kraftGuide.assets)
    await expect(inventory).toContainText(asset.src)
  await expect(inventory).not.toContainText('/input-test/')
  const downloadedFiles = await inventory
    .getByRole('listitem')
    .allTextContents()
  await testInfo.attach('verified-package-inventory', {
    body: JSON.stringify(downloadedFiles, null, 2),
    contentType: 'application/json',
  })
  await testInfo.attach('online-download', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })

  await context.setOffline(true)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: /Kraft\s*Boulders/i }),
  ).toBeVisible()
  const networkReachable = await page.evaluate(async () => {
    try {
      await fetch(`/kraft-network-probe-${Date.now()}`, { cache: 'no-store' })
      return true
    } catch {
      return false
    }
  })
  expect(networkReachable).toBe(false)
  await expect(offlineKit).toContainText('This edition is saved')
  await testInfo.attach('offline-reload', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })
  const map = page.getByRole('application', {
    name: 'Illustrated north-up map of Kraft Boulders',
  })
  await map.focus()
  await page.keyboard.press('+')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Home')
  await page
    .getByRole('button', { name: /^The Cube, .*Open boulder\.$/ })
    .click()
  const cube = page.getByRole('dialog', { name: 'The Cube boulder guide' })
  await expect(
    cube.getByRole('heading', {
      name: 'Photograph not yet in the guide',
      exact: true,
    }),
  ).toBeVisible()
  await cube
    .getByRole('button', { name: 'South arête · S', exact: true })
    .click()
  await cube
    .getByRole('button', { name: /^03 Fear of a Black Hat .*V9$/ })
    .click()
  const fearDetails = cube.getByRole('article', {
    name: 'Fear of a Black Hat details',
    includeHidden: true,
  })
  await expect(fearDetails).toHaveCount(1)
  await expect(fearDetails).toBeHidden()
  await cube
    .getByLabel('View Fear of a Black Hat climb details', {
      exact: true,
    })
    .click()
  await expect(fearDetails).toBeVisible()
  await cube
    .getByRole('region', { name: 'Boulders nearby' })
    .getByRole('button', { name: /^Split Boulder / })
    .click()
  const split = page.getByRole('dialog', {
    name: 'Split Boulder boulder guide',
  })
  await expect(split).toBeVisible()
  await split
    .getByRole('region', { name: 'Boulders nearby' })
    .getByRole('button', { name: /^The Pearl / })
    .click()
  const pearl = page.getByRole('dialog', { name: 'The Pearl boulder guide' })
  const photo = pearl
    .getByRole('region', { name: 'Boulder faces', exact: true })
    .getByRole('img')
  await expect(photo).toBeVisible()
  await expect
    .poll(() =>
      photo.evaluate(
        element =>
          element instanceof HTMLImageElement &&
          element.complete &&
          element.naturalWidth > 0,
      ),
    )
    .toBe(true)
  await pearl.getByText('Photo notes & credit', { exact: true }).click()
  await expect(pearl).toContainText('No route lines have been authored')
  await pearl
    .getByRole('button', { name: 'Zoom in photograph', exact: true })
    .click()
  await testInfo.attach('offline-real-pearl-photo', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })
  await pearl
    .getByRole('button', { name: 'Back to Kraft', exact: true })
    .click()
  await page.getByRole('searchbox').fill('Monkey Bars')
  await page.getByRole('button', { name: 'V3–V5', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'No matching records in this pilot.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'All grades', exact: true }).click()
  await page
    .getByRole('button', { name: 'Monkey Bars V2', exact: true })
    .click()
  const monkey = page.getByRole('dialog', {
    name: 'Monkey Bar Boulder boulder guide',
  })
  const monkeyDetails = monkey.getByRole('article', {
    name: 'Monkey Bars details',
    includeHidden: true,
  })
  await expect(monkeyDetails).toHaveCount(1)
  await expect(monkeyDetails).toBeHidden()
  await monkey
    .getByLabel('View Monkey Bars climb details', { exact: true })
    .click()
  await expect(monkeyDetails).toBeVisible()
  await expect(monkeyDetails).toContainText(
    'Physical line identity is unresolved',
  )
  await testInfo.attach('offline-climb-details', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })
  const savedLocation = page.url()
  await page.close()
  const reopened = await context.newPage()
  await reopened.goto(savedLocation)
  await expect(
    reopened.getByRole('dialog', { name: 'Monkey Bar Boulder boulder guide' }),
  ).toBeVisible()
  await expect(
    reopened.getByLabel('View Monkey Bars climb details', { exact: true }),
  ).toBeVisible()
  const reopenedDetails = reopened.getByRole('article', {
    name: 'Monkey Bars details',
    includeHidden: true,
  })
  await expect(reopenedDetails).toHaveCount(1)
  await expect(reopenedDetails).toBeHidden()
  await reopened
    .getByLabel('View Monkey Bars climb details', { exact: true })
    .click()
  await expect(reopenedDetails).toBeVisible()
  await expect(reopenedDetails).toContainText(
    'Physical line identity is unresolved',
  )
  await testInfo.attach('offline-reopened-climb', {
    body: await reopened.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })
  await reopened
    .getByRole('button', { name: 'Back to Kraft', exact: true })
    .click()
  await expect(
    reopened.getByRole('region', { name: 'Offline guide', exact: true }),
  ).toContainText('This edition is saved')
  const brokenImages = await reopened.locator('img').evaluateAll(images =>
    images.flatMap(image => {
      if (
        image instanceof HTMLImageElement &&
        (!image.complete || image.naturalWidth === 0)
      )
        return [image.src]
      return []
    }),
  )
  expect(brokenImages).toEqual([])
  if (!(await reopened.evaluate(() => navigator.onLine)))
    await expect(
      reopened.getByRole('button', { name: 'Update download', exact: true }),
    ).toBeDisabled()
  await reopened.getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(
    reopened.getByRole('heading', { name: 'Take Kraft offline', exact: true }),
  ).toBeVisible()
  await context.setOffline(false)
})
