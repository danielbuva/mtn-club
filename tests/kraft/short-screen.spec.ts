import { expect, test } from '@playwright/test'
import { openMapCatalog } from './catalog-helpers'

const screens = [
  { project: 'mobile-320', width: 320, height: 568 },
  { project: 'mobile-390', width: 390, height: 664 },
]

for (const screen of screens) {
  test(`short ${screen.width}×${screen.height} browsing reaches the last climb and returns from its full record`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== screen.project, 'Matching mobile size')
    await page.setViewportSize(screen)
    await page.goto('/guide/kraft')
    await openMapCatalog(page, 'pearl')
    const dialog = page.getByRole('dialog', { name: 'The Pearl boulder guide' })
    const panel = dialog.getByRole('complementary', { name: 'Boulder climbs' })
    const photograph = dialog.getByRole('img')
    const photographViewport = dialog.getByRole('region', {
      name: 'Scrollable face photograph',
    })
    const climbs = panel.getByRole('region', { name: 'Climbs sorted by grade' })
    const first = climbs.getByRole('button', { name: /Clam Bumper Right/ })
    const last = climbs.getByRole('button', { name: /Pearl Necklace/ })
    await expect(photograph).toBeInViewport({ ratio: 1 })
    await expect(first).toBeInViewport({ ratio: 1 })
    const photoBounds = await photograph.boundingBox()
    const dialogScroll = await dialog.evaluate(element => element.scrollTop)
    const frame = await photographViewport.evaluate(element => ({
      height: element.clientHeight,
      contentHeight: element.scrollHeight,
    }))
    expect(frame.contentHeight).toBeLessThanOrEqual(frame.height + 1)
    expect((await panel.boundingBox())?.height).toBeGreaterThanOrEqual(120)
    expect((await first.boundingBox())?.height).toBeGreaterThanOrEqual(44)

    await first.tap()
    await expect(first).toHaveAttribute('aria-pressed', 'true')
    await expect(photograph).toBeInViewport({ ratio: 1 })
    await climbs.getByRole('button', { name: /Northeast Face Center/ }).tap()
    await expect(
      dialog.getByRole('heading', { name: 'Photograph not yet in the guide' }),
    ).toBeVisible()
    // The unavailable-image presentation must leave real room for the list.
    expect((await panel.boundingBox())?.height).toBeGreaterThanOrEqual(120)
    // A climb on an unpublished face must still leave the next climb reachable.
    await last.tap()
    await expect(last).toHaveAttribute('aria-pressed', 'true')
    await expect(photograph).toBeInViewport({ ratio: 1 })
    expect(await photograph.boundingBox()).toEqual(photoBounds)
    expect(await dialog.evaluate(element => element.scrollTop)).toBe(
      dialogScroll,
    )

    await panel.focus()
    await page.keyboard.press('Home')
    await expect
      .poll(() => panel.evaluate(element => element.scrollTop))
      .toBe(0)
    await panel
      .getByRole('button', { name: 'Open Pearl Necklace full climb record' })
      .tap()
    const summary = panel.getByLabel('View Pearl Necklace climb details', {
      exact: true,
    })
    const fullRecord = panel.getByRole('article', {
      name: 'Pearl Necklace details',
    })
    await expect(summary).toBeFocused()
    await expect(fullRecord).toBeVisible()
    await expect(fullRecord).toContainText(
      'A lower seated entry into The Pearl’s standing start.',
    )
    await expect(photograph).toBeInViewport({ ratio: 1 })
    expect(await dialog.evaluate(element => element.scrollTop)).toBe(
      dialogScroll,
    )
    const sources = fullRecord.getByText('Climb sources & grade records', {
      exact: true,
    })
    await sources.focus()
    await expect(sources).toBeInViewport({ ratio: 1 })
    await page.keyboard.press('Enter')
    const lastSource = fullRecord.getByRole('link').last()
    await lastSource.focus()
    await expect(lastSource).toBeInViewport({ ratio: 1 })
    await expect(photograph).toBeInViewport({ ratio: 1 })
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(fullRecord).toBeHidden()
    await last.focus()
    await page.keyboard.press('Enter')
    await expect(last).toHaveAttribute('aria-pressed', 'true')
    await expect(photograph).toBeInViewport({ ratio: 1 })
    await first.tap()
    await expect(first).toHaveAttribute('aria-pressed', 'true')
    await expect(photograph).toBeInViewport({ ratio: 1 })
    await testInfo.attach(`short-screen-${screen.width}-reachable-climbs`, {
      body: await page.screenshot({ scale: 'css' }),
      contentType: 'image/png',
    })
  })

  test(`short ${screen.width}×${screen.height} direct climb links keep the complete photograph and zoom controls usable`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== screen.project, 'Matching mobile size')
    await page.setViewportSize(screen)
    await page.goto(
      '/guide/kraft#boulder=pearl&climb=the-pearl&face=pearl-southeast',
    )
    const dialog = page.getByRole('dialog', { name: 'The Pearl boulder guide' })
    const panel = dialog.getByRole('complementary', { name: 'Boulder climbs' })
    const photograph = dialog.getByRole('img')
    const viewport = dialog.getByRole('region', {
      name: 'Scrollable face photograph',
    })
    await expect(
      dialog.getByRole('heading', { name: 'The Pearl' }).first(),
    ).toBeFocused()
    await expect(photograph).toBeInViewport({ ratio: 1 })
    await expect(
      panel.getByRole('button', { name: 'Open The Pearl full climb record' }),
    ).toBeInViewport({ ratio: 1 })
    await dialog.getByRole('button', { name: 'Zoom in photograph' }).tap()
    await expect(viewport).toBeInViewport({ ratio: 1 })
    await dialog.getByRole('button', { name: 'Reset photograph zoom' }).tap()
    await expect(photograph).toBeInViewport({ ratio: 1 })
    const last = panel
      .getByRole('region', { name: 'Climbs sorted by grade' })
      .getByRole('button', { name: /Pearl Necklace/ })
    await last.focus()
    await page.keyboard.press('Enter')
    await expect(last).toHaveAttribute('aria-pressed', 'true')
    await expect(photograph).toBeInViewport({ ratio: 1 })
    await testInfo.attach(`short-screen-${screen.width}-direct-climb`, {
      body: await page.screenshot({ scale: 'css' }),
      contentType: 'image/png',
    })
  })
}
