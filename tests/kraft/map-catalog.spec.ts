import { expect, test } from '@playwright/test'

test('a keyboard catalog choice returns to its surviving map cluster trigger', async ({
  page,
}) => {
  await page.goto('/guide/kraft')
  const map = page.getByRole('application', {
    name: 'Illustrated north-up map of Kraft Boulders',
  })
  await expect(map).toBeVisible()
  const trigger = map.locator('[data-cluster="true"]').first()
  const triggerIds = await trigger.getAttribute('data-catalog-ids')
  expect(triggerIds).toBeTruthy()
  await trigger.focus()
  await page.keyboard.press('Enter')
  const chooser = page.getByRole('dialog', { name: 'Choose a nearby catalog' })
  await expect(chooser).toBeVisible()
  const choice = chooser.locator('button[data-catalog-choice]').first()
  await expect(choice).toBeFocused()
  const id = await choice.getAttribute('data-boulder-id')
  expect(id).toBeTruthy()
  await page.keyboard.press('Enter')
  await expect(chooser).toHaveCount(0)
  const catalog = page.getByRole('dialog').filter({
    has: page.getByRole('button', { name: 'Back to Kraft', exact: true }),
  })
  await expect(catalog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(catalog).toHaveCount(0)
  await expect(map.locator(`[data-catalog-ids="${triggerIds}"]`)).toBeFocused()
})

test('coincident Tomahawk source records remain separate choices', async ({
  page,
}) => {
  await page.goto('/guide/kraft')
  const map = page.getByRole('application', {
    name: 'Illustrated north-up map of Kraft Boulders',
  })
  const mpId = 'mp-area-200443140'
  const obId = 'ob-area-0cc93bf5-be90-4623-a413-d6d17f480f28'
  const coincident = map.locator(
    `[data-catalog-ids*="${mpId}"][data-catalog-ids*="${obId}"]`,
  )
  await expect(coincident).toHaveCount(1)
  await coincident.focus()
  await page.keyboard.press('Enter')
  const chooser = page.getByRole('dialog', { name: 'Choose a nearby catalog' })
  await expect(chooser.locator(`[data-boulder-id="${mpId}"]`)).toContainText(
    'Mountain Project',
  )
  await expect(chooser.locator(`[data-boulder-id="${obId}"]`)).toContainText(
    'OpenBeta',
  )
  await page.keyboard.press('Escape')
  await expect(chooser).toHaveCount(0)
  await expect(coincident).toBeFocused()
})

test('every aggregate center opens its own exact source IDs despite overlapping hit targets', async ({
  page,
}) => {
  await page.goto('/guide/kraft')
  const map = page.getByRole('application', {
    name: 'Illustrated north-up map of Kraft Boulders',
  })
  const clusters = map.locator('[data-cluster="true"]')
  const count = await clusters.count()
  expect(count).toBeGreaterThan(1)
  for (let index = 0; index < count; index++) {
    const trigger = clusters.nth(index)
    const expected = (await trigger.getAttribute('data-catalog-ids'))
      ?.split(',')
      .toSorted()
    expect(expected).toBeTruthy()
    const center = await trigger.evaluate(element => {
      if (!(element instanceof SVGGraphicsElement))
        throw new Error('Source cluster must be SVG geometry')
      const matrix = element.getScreenCTM()
      if (!matrix) throw new Error('Missing source cluster screen transform')
      const point = new DOMPoint(0, 0).matrixTransform(matrix)
      return { x: point.x, y: point.y }
    })
    await page.mouse.click(center.x, center.y)
    const chooser = page.getByRole('dialog', {
      name: 'Choose a nearby catalog',
    })
    await expect(chooser).toBeVisible()
    const actual = await chooser
      .locator('[data-catalog-choice]')
      .evaluateAll(elements =>
        elements
          .map(element => element.getAttribute('data-boulder-id'))
          .toSorted(),
      )
    expect(actual).toEqual(expected)
    await page.keyboard.press('Escape')
    await expect(chooser).toHaveCount(0)
    await expect(trigger).toBeFocused()
  }
})

test('a synthesized activation opens its own cluster without pointer coordinates', async ({
  page,
}) => {
  await page.goto('/guide/kraft')
  const map = page.getByRole('application', {
    name: 'Illustrated north-up map of Kraft Boulders',
  })
  const trigger = map.locator('[data-cluster="true"]').last()
  const expected = (await trigger.getAttribute('data-catalog-ids'))
    ?.split(',')
    .toSorted()
  expect(expected).toBeTruthy()
  await trigger.dispatchEvent('click', { detail: 0, clientX: 0, clientY: 0 })
  const chooser = page.getByRole('dialog', { name: 'Choose a nearby catalog' })
  await expect(chooser).toBeVisible()
  const actual = await chooser
    .locator('[data-catalog-choice]')
    .evaluateAll(elements =>
      elements
        .map(element => element.getAttribute('data-boulder-id'))
        .toSorted(),
    )
  expect(actual).toEqual(expected)
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})
