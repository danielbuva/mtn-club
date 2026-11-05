import { expect, test } from '@playwright/test'
import { mapCatalogTrigger, openMapCatalog } from './catalog-helpers'

test('mobile route browsing keeps the photograph immersive and preserves same-face zoom', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'desktop', 'Mobile coordinated browsing')
  await page.goto('/guide/kraft')
  await openMapCatalog(page, 'pearl')
  const dialog = page.getByRole('dialog', { name: 'The Pearl boulder guide' })
  const viewer = dialog.getByRole('region', {
    name: 'Boulder faces',
    exact: true,
  })
  const viewport = viewer.getByRole('region', { name: 'Scrollable face image' })
  const photograph = viewport.getByRole('img')
  const dock = dialog.getByRole('complementary', { name: 'Boulder climbs' })
  const browse = dock.getByRole('button', {
    name: 'Browse climbs',
    exact: true,
  })
  const picker = dialog.getByRole('region', {
    name: 'Climb picker',
    exact: true,
  })
  await expect(viewport).toBeInViewport({ ratio: 1 })
  await expect(photograph).toBeVisible()
  await expect(browse).toHaveAttribute('aria-expanded', 'false')
  await expect(picker).toBeHidden()
  const initialPhoto = await photograph.boundingBox()
  const initialDialogScroll = await dialog.evaluate(
    element => element.scrollTop,
  )

  await browse.click()
  const pearl = picker.getByRole('button', { name: /The Pearl SE.*V5/ })
  await pearl.click()
  await expect(picker).toBeHidden()
  await expect(browse).toBeFocused()
  await expect(page).toHaveURL(/climb=the-pearl/)
  await expect(page).toHaveURL(/face=pearl-southeast/)
  const selected = dock.getByRole('region', { name: 'Selected climb' })
  await expect(selected).toBeInViewport({ ratio: 1 })
  await expect(selected).toContainText(
    'Approximate corridor available · Southeast face',
  )
  await expect(
    dialog.getByRole('region', { name: 'Climb details', exact: true }),
  ).toBeHidden()
  expect(await dialog.evaluate(element => element.scrollTop)).toBe(
    initialDialogScroll,
  )
  expect(await photograph.boundingBox()).toEqual(initialPhoto)
  await testInfo.attach('mobile-route-in-immersive-view', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })

  await viewer
    .getByRole('button', { name: 'Zoom in image', exact: true })
    .click()
  const zoomedPhoto = await photograph.boundingBox()
  await browse.click()
  await expect(pearl).toHaveAttribute('aria-pressed', 'true')
  const nextClimb = picker.getByRole('button', {
    name: /Pearl Necklace SE V6-/,
  })
  await nextClimb.click()
  await expect(picker).toBeHidden()
  await expect(browse).toBeFocused()
  await expect(page).toHaveURL(/climb=pearl-pearl-necklace/)
  await expect(page).toHaveURL(/face=pearl-southeast/)
  await expect(viewport).toBeInViewport({ ratio: 1 })
  await expect(
    viewer.getByRole('button', { name: 'Reset image zoom', exact: true }),
  ).toBeEnabled()
  expect(await photograph.boundingBox()).toEqual(zoomedPhoto)
  expect(await dialog.evaluate(element => element.scrollTop)).toBe(
    initialDialogScroll,
  )
  await testInfo.attach('mobile-next-route-retains-zoom', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })
})

test('the existing club navigation opens the field guide', async ({
  page,
}, testInfo) => {
  await page.goto('/welcome')
  const openNavigation = page.getByRole('button', {
    name: 'Open navigation',
    exact: true,
  })
  if (await openNavigation.isVisible()) await openNavigation.click()
  await page
    .getByRole('button', { name: 'More', exact: true })
    .filter({ visible: true })
    .click()
  await page
    .getByRole('link', { name: 'Kraft field guide', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: /Kraft\s*Boulders/i }),
  ).toBeVisible()
  await testInfo.attach('club-to-guide', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })
})

test('known climb search, source disagreement, face switch and return stay coherent', async ({
  page,
}, testInfo) => {
  await page.goto('/guide/kraft')
  await expect(
    page.getByRole('heading', { name: /Kraft\s*Boulders/i }),
  ).toBeVisible()
  await page.getByRole('searchbox').fill('Monkey Bars')
  const searchResult = page.getByRole('button', {
    name: 'Monkey Bars V2',
    exact: true,
  })
  await expect(searchResult).toBeVisible()
  await searchResult.click()
  const dialog = page.getByRole('dialog', {
    name: 'Monkey Bar Boulder boulder guide',
  })
  await expect(dialog).toBeVisible()
  const detailsSheet = dialog.getByRole('region', {
    name: 'Climb details',
    exact: true,
  })
  const details = detailsSheet.getByRole('article', {
    name: 'Monkey Bars details',
  })
  await expect(detailsSheet).toBeHidden()
  await expect(page).toHaveURL(/boulder=monkey-bar/)
  await expect(page).toHaveURL(/climb=monkey-bars/)
  await expect(page).toHaveURL(/face=monkey-cave/)
  await expect(
    dialog.getByRole('region', { name: 'Selected climb', exact: true }),
  ).toContainText('Monkey Bars')
  const back = dialog.getByRole('button', {
    name: 'Back to Kraft',
    exact: true,
  })
  await expect(back).toBeInViewport({ ratio: 1 })
  const boulderHeading = dialog.getByRole('heading', {
    name: 'Monkey Bar Boulder',
    exact: true,
  })
  await expect(boulderHeading).toBeFocused()
  await expect(boulderHeading).toBeInViewport({ ratio: 1 })
  await expect(
    dialog.getByRole('button', {
      name: 'Cave & roof · Unconfirmed',
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'true')
  const fullDetails = dialog.getByRole('button', {
    name: 'Open Monkey Bars full climb record',
    exact: true,
  })
  await fullDetails.focus()
  await page.keyboard.press('Enter')
  await expect(detailsSheet).toBeVisible()
  await expect(details).toBeVisible()
  await expect(details).toContainText('Physical line identity is unresolved')
  await expect(details).toContainText(
    'no grade conversion or consensus is inferred',
  )
  const detailsHeading = details.getByRole('heading', {
    name: 'Monkey Bars',
    exact: true,
  })
  await detailsHeading.scrollIntoViewIfNeeded()
  await expect(detailsHeading).toBeInViewport()
  await testInfo.attach('selected-climb', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })
  await page.keyboard.press('Escape')
  await expect(detailsSheet).toBeHidden()
  await expect(dialog).toBeVisible()
  await expect(fullDetails).toBeFocused()
  const northwestFace = dialog.getByRole('button', {
    name: 'Northwest face · NW',
    exact: true,
  })
  await northwestFace.click()
  await expect(northwestFace).toHaveAttribute('aria-pressed', 'true')
  await expect(northwestFace).toBeFocused()
  await expect(page).toHaveURL(/face=monkey-northwest/)
  await expect(page).not.toHaveURL(/climb=monkey-bars/)
  const browse = dialog.getByRole('button', {
    name: 'Browse climbs',
    exact: true,
  })
  await browse.click()
  const picker = dialog.getByRole('region', {
    name: 'Climb picker',
    exact: true,
  })
  await expect(
    picker.getByRole('heading', { name: 'Climbs', exact: true }),
  ).toBeVisible()
  await expect(
    picker
      .getByRole('region', { name: 'Climbs sorted by grade', exact: true })
      .getByRole('list'),
  ).toContainText('Monkey Bars')
  await page.keyboard.press('Escape')
  await expect(picker).toBeHidden()
  await expect(browse).toBeFocused()
  await dialog
    .getByRole('button', { name: 'Back to Kraft', exact: true })
    .click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('searchbox')).toHaveValue('Monkey Bars')
  await expect(searchResult).toBeVisible()
  await searchResult.focus()
  await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(searchResult).toBeFocused()
  await page.getByRole('button', { name: 'V3–V5', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'No matching records in this edition.' }),
  ).toBeVisible()
  await expect(searchResult).toHaveCount(0)
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click()
  await expect(page.getByRole('searchbox')).toHaveValue('')
  await expect(
    page.getByRole('button', { name: 'All grades', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await testInfo.attach('reset-state', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })
})

test('a direct climb link returns focus to Kraft when it has no opening control', async ({
  page,
}) => {
  for (const closeWith of ['Escape', 'Back to Kraft']) {
    await page.goto(
      '/guide/kraft#boulder=cube&face=cube-north&climb=perfect-poser',
    )
    const dialog = page.getByRole('dialog', { name: 'The Cube boulder guide' })
    await expect(
      dialog.getByRole('heading', { name: 'The Cube', exact: true }),
    ).toBeFocused()
    if (closeWith === 'Escape') await page.keyboard.press('Escape')
    else
      await dialog.getByRole('button', { name: closeWith, exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: /Kraft\s*Boulders/i }),
    ).toBeFocused()
  }
})

test('the map is keyboard navigable and nearby boulder navigation returns to the opening trigger', async ({
  page,
}, testInfo) => {
  await page.goto('/guide/kraft')
  const map = page.getByRole('application', {
    name: 'Illustrated north-up map of Kraft Boulders',
  })
  await map.focus()
  await page.keyboard.press('+')
  await page.keyboard.press('ArrowRight')
  await testInfo.attach('keyboard-map', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })
  await page.keyboard.press('Home')
  const cube = mapCatalogTrigger(page, 'cube')
  const restingStyles = await cube.evaluate(element =>
    Array.from(element.querySelectorAll('*')).map(child => {
      const style = getComputedStyle(child)
      return [style.stroke, style.fill, style.opacity]
    }),
  )
  const openingTrigger = await openMapCatalog(page, 'cube')
  const dialog = page.getByRole('dialog', { name: 'The Cube boulder guide' })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('heading', { name: 'The Cube', exact: true }),
  ).toBeFocused()
  const browse = dialog.getByRole('button', {
    name: 'Browse climbs',
    exact: true,
  })
  await browse.click()
  const picker = dialog.getByRole('region', {
    name: 'Climb picker',
    exact: true,
  })
  const firstClimb = picker
    .getByRole('region', { name: 'Climbs sorted by grade', exact: true })
    .getByRole('button')
    .first()
  await firstClimb.focus()
  await page.keyboard.press('Enter')
  await expect(picker).toBeHidden()
  await expect(browse).toBeFocused()
  await expect(page).toHaveURL(/boulder=cube/)
  await expect(page).toHaveURL(/climb=/)
  await dialog
    .getByRole('button', { name: 'Boulder details', exact: true })
    .click()
  await dialog
    .getByRole('region', { name: 'Boulder details', exact: true })
    .getByRole('region', { name: 'Boulders nearby', exact: true })
    .getByRole('button')
    .first()
    .click()
  await expect(page).not.toHaveURL(/boulder=cube(?:&|$)/)
  const nearbyDialog = page.getByRole('dialog').filter({
    has: page.getByRole('button', { name: 'Back to Kraft', exact: true }),
  })
  await expect(nearbyDialog.locator('#kraft-boulder-title')).toBeFocused()
  expect(await nearbyDialog.evaluate(element => element.scrollTop)).toBe(0)
  await page.keyboard.press('Escape')
  await expect(openingTrigger).toBeFocused()
  const focusedStyles = await openingTrigger.evaluate(element =>
    Array.from(element.querySelectorAll('*')).map(child => {
      const style = getComputedStyle(child)
      return [style.stroke, style.fill, style.opacity]
    }),
  )
  expect(focusedStyles).not.toEqual(restingStyles)
  const pageWidth = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }))
  expect(pageWidth.content).toBeLessThanOrEqual(pageWidth.viewport)
})
