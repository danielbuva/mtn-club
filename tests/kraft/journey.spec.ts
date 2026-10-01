import { expect, test } from '@playwright/test'

test('mobile route browsing keeps the complete face visible and preserves same-face zoom', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'desktop', 'Mobile coordinated browsing')
  await page.goto('/guide/kraft')
  await page
    .getByRole('button', { name: /^The Pearl, .*Open boulder\.$/ })
    .click()
  const dialog = page.getByRole('dialog', { name: 'The Pearl boulder guide' })
  const viewer = dialog.getByRole('region', {
    name: 'Boulder faces',
    exact: true,
  })
  const photograph = viewer.getByRole('img')
  const photographViewport = viewer.getByRole('region', {
    name: 'Scrollable face photograph',
  })
  const panel = dialog.getByRole('complementary', { name: 'Boulder climbs' })
  await expect(photograph).toBeInViewport({ ratio: 1 })
  await expect(panel).toHaveAttribute('tabindex', '0')
  const initialPhoto = await photograph.boundingBox()
  const initialDialogScroll = await dialog.evaluate(
    element => element.scrollTop,
  )
  const initialFrame = await photographViewport.evaluate(element => ({
    height: element.clientHeight,
    contentHeight: element.scrollHeight,
  }))
  expect(initialFrame.contentHeight).toBeLessThanOrEqual(
    initialFrame.height + 1,
  )

  // Browse the contained panel as a user does, before choosing a lower row.
  await panel.hover()
  await page.mouse.wheel(0, 700)
  await expect
    .poll(() => panel.evaluate(element => element.scrollTop))
    .toBeGreaterThan(0)
  const pearl = panel.getByRole('button', {
    name: '01 The Pearl SE V5',
    exact: true,
  })
  await pearl.click()
  await expect(pearl).toHaveAttribute('aria-pressed', 'true')
  await expect(pearl).toBeFocused()
  await expect(photograph).toBeInViewport({ ratio: 1 })
  await expect(
    dialog.getByRole('region', { name: 'Selected climb' }),
  ).toBeInViewport({ ratio: 1 })
  await expect(
    dialog.getByRole('region', { name: 'Selected climb' }),
  ).toContainText('Route line pending · Southeast face')
  await expect(
    dialog.getByRole('article', {
      name: 'The Pearl details',
      includeHidden: true,
    }),
  ).toBeHidden()
  expect(await dialog.evaluate(element => element.scrollTop)).toBe(
    initialDialogScroll,
  )
  expect(await photograph.boundingBox()).toEqual(initialPhoto)
  await testInfo.attach('mobile-route-with-complete-face', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })

  await viewer
    .getByRole('button', { name: 'Zoom in photograph', exact: true })
    .click()
  const zoomedPhoto = await photograph.boundingBox()
  const nextClimb = panel.getByRole('button', {
    name: '09 Pearl Necklace SE V6-',
    exact: true,
  })
  await nextClimb.click()
  await expect(nextClimb).toHaveAttribute('aria-pressed', 'true')
  await expect(nextClimb).toBeFocused()
  await expect(photographViewport).toBeInViewport({ ratio: 1 })
  await expect(
    viewer.getByRole('button', { name: 'Reset photograph zoom', exact: true }),
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
  const details = dialog.getByRole('article', {
    name: 'Monkey Bars details',
    includeHidden: true,
  })
  await expect(details).toHaveCount(1)
  await expect(details).toBeHidden()
  await expect(details).not.toBeFocused()
  await expect(
    dialog.getByRole('region', { name: 'Selected climb', exact: true }),
  ).toContainText('Monkey Bars')
  const back = dialog.getByRole('button', {
    name: 'Back to Kraft',
    exact: true,
  })
  await expect(back).toBeInViewport()
  const boulderHeading = dialog.getByRole('heading', {
    name: 'Monkey Bar Boulder',
    exact: true,
  })
  await expect(boulderHeading).toBeFocused()
  const headingBox = await boulderHeading.boundingBox()
  const backHeaderBottom = await back.evaluate(
    element =>
      (element.parentElement ?? element).getBoundingClientRect().bottom,
  )
  expect(headingBox?.y).toBeGreaterThanOrEqual(backHeaderBottom)
  await expect(
    dialog.getByRole('button', {
      name: 'Cave & roof · Unconfirmed',
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'true')
  const fullDetails = dialog.getByLabel('View Monkey Bars climb details', {
    exact: true,
  })
  await expect(fullDetails).toHaveJSProperty('tagName', 'SUMMARY')
  await expect(fullDetails).toHaveText('Full climb details & sources')
  await fullDetails.focus()
  await page.keyboard.press('Enter')
  await expect(details).toBeVisible()
  await expect(fullDetails).toBeFocused()
  await expect(details).not.toBeFocused()
  const detailsHeading = details.getByRole('heading', {
    name: 'Monkey Bars',
    exact: true,
  })
  await detailsHeading.scrollIntoViewIfNeeded()
  await expect(detailsHeading).toBeInViewport()
  await expect(back).toBeInViewport()
  const detailsHeadingBox = await detailsHeading.boundingBox()
  const expandedBackHeaderBottom = await back.evaluate(
    element =>
      (element.parentElement ?? element).getBoundingClientRect().bottom,
  )
  expect(detailsHeadingBox?.y).toBeGreaterThanOrEqual(expandedBackHeaderBottom)
  await expect(details).toContainText('Physical line identity is unresolved')
  await expect(details).toContainText(
    'no grade conversion or consensus is inferred',
  )
  await testInfo.attach('selected-climb', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })
  const northwestFace = dialog.getByRole('button', {
    name: 'Northwest face · NW',
    exact: true,
  })
  await northwestFace.click()
  await expect(northwestFace).toHaveAttribute('aria-pressed', 'true')
  await expect(northwestFace).toBeFocused()
  await expect(
    dialog.getByRole('heading', { name: 'Climbs', exact: true }),
  ).toBeVisible()
  await expect(
    dialog
      .getByRole('region', { name: 'Climbs sorted by grade', exact: true })
      .getByRole('list'),
  ).toContainText('Monkey Bars')
  await expect(details).toHaveCount(0)
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
    page.getByRole('heading', { name: 'No matching records in this pilot.' }),
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
  const cube = page.getByRole('button', {
    name: /^The Cube, .*Open boulder\.$/,
  })
  const restingStyles = await cube.evaluate(element =>
    Array.from(element.querySelectorAll('*')).map(child => {
      const style = getComputedStyle(child)
      return [style.stroke, style.fill, style.opacity]
    }),
  )
  await cube.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'The Cube boulder guide' })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('heading', { name: 'The Cube', exact: true }),
  ).toBeFocused()
  const firstClimb = dialog
    .getByRole('region', { name: 'Climbs sorted by grade', exact: true })
    .getByRole('button')
    .first()
  await firstClimb.focus()
  await page.keyboard.press('Enter')
  await expect(firstClimb).toHaveAttribute('aria-pressed', 'true')
  await expect(firstClimb).toBeFocused()
  await dialog
    .getByRole('region', { name: 'Boulders nearby', exact: true })
    .getByRole('button', { name: /^Split Boulder \d+ m$/ })
    .click()
  const nearbyDialog = page.getByRole('dialog', {
    name: 'Split Boulder boulder guide',
  })
  await expect(
    nearbyDialog.getByRole('heading', { name: 'Split Boulder', exact: true }),
  ).toBeFocused()
  expect(await nearbyDialog.evaluate(element => element.scrollTop)).toBe(0)
  await page.keyboard.press('Escape')
  await expect(cube).toBeFocused()
  const focusedStyles = await cube.evaluate(element =>
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
