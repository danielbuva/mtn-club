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
    const dock = dialog.getByRole('complementary', { name: 'Boulder climbs' })
    const browse = dock.getByRole('button', {
      name: 'Browse climbs',
      exact: true,
    })
    const picker = dialog.getByRole('region', {
      name: 'Climb picker',
      exact: true,
    })
    const climbs = picker.getByRole('region', {
      name: 'Climbs sorted by grade',
    })
    const viewport = dialog.getByRole('region', {
      name: 'Scrollable face image',
    })
    const back = dialog.getByRole('button', {
      name: 'Back to Kraft',
      exact: true,
    })
    await expect(viewport).toBeInViewport({ ratio: 1 })
    await expect(browse).toBeInViewport({ ratio: 1 })
    await expect(browse).toHaveAttribute('aria-expanded', 'false')
    await expect(picker).toBeHidden()
    const dockBounds = await dock.boundingBox()
    expect(dockBounds?.height).toBeLessThan(screen.height * 0.35)
    const initialScroll = await dialog.evaluate(element => element.scrollTop)

    await browse.tap()
    await expect(browse).toHaveAttribute('aria-expanded', 'true')
    const first = climbs.getByRole('button', { name: /Clam Bumper Right/ })
    await expect(first).toBeInViewport({ ratio: 1 })
    expect((await first.boundingBox())?.height).toBeGreaterThanOrEqual(44)
    await first.tap()
    await expect(picker).toBeHidden()
    await expect(browse).toBeFocused()
    await expect(
      dock.getByRole('region', { name: 'Selected climb' }),
    ).toContainText('Clam Bumper Right')
    await expect(page).toHaveURL(/climb=pearl-clam-bumper-right/)

    await browse.tap()
    await expect(first).toHaveAttribute('aria-pressed', 'true')
    await climbs.getByRole('button', { name: /Northeast Face Center/ }).tap()
    await expect(picker).toBeHidden()
    await expect(browse).toBeFocused()
    await expect(
      dialog.getByRole('heading', { name: 'Photograph not yet in the guide' }),
    ).toBeVisible()
    await expect(page).toHaveURL(/climb=northeast-face-center/)
    await expect(page).toHaveURL(/face=pearl-northeast/)
    await expect(browse).toBeInViewport({ ratio: 1 })
    await expect(back).toBeInViewport({ ratio: 1 })

    await browse.tap()
    const last = climbs.getByRole('button', { name: /Pearl Necklace/ })
    await last.scrollIntoViewIfNeeded()
    await expect(last).toBeInViewport({ ratio: 1 })
    await last.tap()
    await expect(picker).toBeHidden()
    await expect(browse).toBeFocused()
    await expect(page).toHaveURL(/climb=pearl-pearl-necklace/)
    await expect(page).toHaveURL(/face=pearl-southeast/)
    await expect(viewport).toBeInViewport({ ratio: 1 })
    await expect(viewport.getByRole('img')).toBeVisible()
    expect(await dialog.evaluate(element => element.scrollTop)).toBe(
      initialScroll,
    )

    const openRecord = dock.getByRole('button', {
      name: 'Open Pearl Necklace full climb record',
    })
    await expect(openRecord).toBeInViewport({ ratio: 1 })
    await openRecord.tap()
    const details = dialog.getByRole('region', {
      name: 'Climb details',
      exact: true,
    })
    const fullRecord = details.getByRole('article', {
      name: 'Pearl Necklace details',
    })
    await expect(fullRecord).toBeVisible()
    await expect(fullRecord).toContainText(
      'A lower seated entry into The Pearl’s standing start.',
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
    await details.getByRole('button', { name: 'Close climb details' }).tap()
    await expect(details).toBeHidden()
    await expect(openRecord).toBeFocused()
    await expect(dialog).toBeVisible()
    await expect(viewport).toBeInViewport({ ratio: 1 })

    await browse.tap()
    await expect(last).toHaveAttribute('aria-pressed', 'true')
    await picker.getByRole('button', { name: 'Close climb picker' }).tap()
    await expect(browse).toBeFocused()
    await expect(picker).toBeHidden()
    await testInfo.attach(`short-screen-${screen.width}-reachable-climbs`, {
      body: await page.screenshot({ scale: 'css' }),
      contentType: 'image/png',
    })
  })

  test(`short ${screen.width}×${screen.height} direct links keep floating controls usable through zoom and sheets`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== screen.project, 'Matching mobile size')
    await page.setViewportSize(screen)
    await page.goto(
      '/guide/kraft#boulder=pearl&climb=the-pearl&face=pearl-southeast',
    )
    const dialog = page.getByRole('dialog', { name: 'The Pearl boulder guide' })
    const dock = dialog.getByRole('complementary', { name: 'Boulder climbs' })
    const viewport = dialog.getByRole('region', {
      name: 'Scrollable face image',
    })
    const browse = dock.getByRole('button', {
      name: 'Browse climbs',
      exact: true,
    })
    const openRecord = dock.getByRole('button', {
      name: 'Open The Pearl full climb record',
    })
    await expect(
      dialog.getByRole('heading', { name: 'The Pearl', exact: true, level: 2 }),
    ).toBeFocused()
    await expect(viewport).toBeInViewport({ ratio: 1 })
    await expect(openRecord).toBeInViewport({ ratio: 1 })
    await expect(browse).toHaveAttribute('aria-expanded', 'false')
    const zoomIn = dialog.getByRole('button', {
      name: 'Zoom in image',
      exact: true,
    })
    const reset = dialog.getByRole('button', {
      name: 'Reset image zoom',
      exact: true,
    })
    await expect(zoomIn).toBeInViewport({ ratio: 1 })
    await zoomIn.tap()
    await expect(reset).toBeEnabled()
    await expect(reset).toBeInViewport({ ratio: 1 })
    const zoomedPhoto = await viewport.getByRole('img').boundingBox()
    await openRecord.tap()
    const details = dialog.getByRole('region', {
      name: 'Climb details',
      exact: true,
    })
    await expect(
      details.getByRole('article', { name: 'The Pearl details' }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(details).toBeHidden()
    await expect(dialog).toBeVisible()
    await expect(openRecord).toBeFocused()
    expect(await viewport.getByRole('img').boundingBox()).toEqual(zoomedPhoto)
    await reset.tap()
    await expect(reset).toBeEnabled()
    await expect(
      dialog.getByRole('button', { name: 'Zoom out image', exact: true }),
    ).toBeDisabled()

    await browse.tap()
    const picker = dialog.getByRole('region', {
      name: 'Climb picker',
      exact: true,
    })
    const last = picker.getByRole('button', { name: /Pearl Necklace/ })
    await last.focus()
    await page.keyboard.press('Enter')
    await expect(picker).toBeHidden()
    await expect(browse).toBeFocused()
    await expect(page).toHaveURL(/climb=pearl-pearl-necklace/)
    await expect(
      dock.getByRole('region', { name: 'Selected climb' }),
    ).toContainText('Pearl Necklace')
    await expect(viewport).toBeInViewport({ ratio: 1 })
    await testInfo.attach(`short-screen-${screen.width}-direct-climb`, {
      body: await page.screenshot({ scale: 'css' }),
      contentType: 'image/png',
    })
  })
}
