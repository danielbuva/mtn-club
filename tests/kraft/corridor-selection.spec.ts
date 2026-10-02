import { expect, test } from '@playwright/test'

test('shared corridors leave both numbered badges independently tappable', async ({
  page,
}) => {
  await page.goto(
    '/guide/kraft#boulder=pearl&climb=the-pearl&face=pearl-southeast&view=list',
  )
  const dialog = page.getByRole('dialog', {
    name: 'The Pearl boulder guide',
    exact: true,
  })
  const selected = dialog.getByRole('region', { name: 'Selected climb' })
  await expect(selected).toContainText('The Pearl')
  for (const name of ['Pearl Necklace', 'The Pearl', 'Pearl Necklace']) {
    const route = dialog.getByRole('button', {
      name: new RegExp(`^Route \\d+: ${name}, `),
    })
    const badge = route.locator('circle')
    await expect(badge).toBeVisible()
    const bounds = await badge.boundingBox()
    expect(bounds).not.toBeNull()
    if (!bounds) throw new Error(`Missing ${name} route badge`)
    // Physical coordinates exercise SVG stacking; a forced locator click would
    // bypass the overlapping hit target that previously selected the wrong route.
    await page.mouse.click(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    )
    await expect(route).toHaveAttribute('aria-pressed', 'true')
    await expect(selected).toContainText(name)
    await expect(selected).toContainText('Approximate corridor available')
  }
  await dialog.getByRole('button', { name: 'Clean image', exact: true }).click()
  await expect(dialog.locator('g[data-confidence="moderate"]')).toHaveCount(0)
  await expect(selected).toContainText('Approximate corridor available')
  await expect(selected).not.toContainText('highlighted')
  await dialog.getByRole('button', { name: 'All lines', exact: true }).click()
  await expect(dialog.locator('g[data-confidence="moderate"]')).toHaveCount(2)
})

test('zoom reveals rock detail while route annotations stay restrained', async ({
  page,
}) => {
  await page.goto(
    '/guide/kraft#boulder=pearl&climb=the-pearl&face=pearl-southeast&view=list',
  )
  const dialog = page.getByRole('dialog', {
    name: 'The Pearl boulder guide',
    exact: true,
  })
  const viewport = dialog.getByRole('region', { name: 'Scrollable face image' })
  const route = viewport.getByRole('button', {
    name: /^Route \d+: The Pearl, /,
  })
  const marker = route.locator('circle')
  await expect(marker).toBeVisible()
  const initialMarker = await marker.boundingBox()
  const initialRock = await viewport.locator('img').boundingBox()
  if (!initialMarker || !initialRock) throw new Error('Face has not rendered')

  const imageCenter = () =>
    viewport.evaluate(element => {
      const image = element.querySelector('img')
      if (!image) throw new Error('Face image is missing')
      const frame = element.getBoundingClientRect()
      const bounds = image.getBoundingClientRect()
      return {
        x:
          (frame.left +
            element.clientLeft +
            element.clientWidth / 2 -
            bounds.left) /
          bounds.width,
        y:
          (frame.top +
            element.clientTop +
            element.clientHeight / 2 -
            bounds.top) /
          bounds.height,
        width: bounds.width,
        height: bounds.height,
      }
    })
  const initialCenter = await imageCenter()
  const expectCenter = async (expected: { x: number; y: number }) => {
    const current = await imageCenter()
    // Compare the actual image point under the frame center, allowing only
    // browser layout rounding rather than accepting a zoom toward an edge.
    expect(
      Math.abs(current.x - expected.x) * current.width,
    ).toBeLessThanOrEqual(2)
    expect(
      Math.abs(current.y - expected.y) * current.height,
    ).toBeLessThanOrEqual(2)
  }

  const visiblePaths = () =>
    route.locator('path').evaluateAll(paths =>
      paths.flatMap(path => {
        const style = getComputedStyle(path)
        // A large invisible touch target is useful; only painted strokes
        // should compete with the rock or become wider during zoom.
        if (style.stroke === 'rgba(0, 0, 0, 0)' || style.stroke === 'none')
          return []
        return [
          {
            width: Number.parseFloat(style.strokeWidth),
            dashes: style.strokeDasharray,
            scaling: style.vectorEffect,
          },
        ]
      }),
    )
  const initialPaths = await visiblePaths()
  expect(initialPaths).toHaveLength(1)
  expect(initialPaths[0].width).toBeLessThanOrEqual(2)
  expect(initialPaths[0].dashes).toBe('none')
  expect(initialPaths[0].scaling).toBe('non-scaling-stroke')

  const zoomIn = dialog.getByRole('button', {
    name: 'Zoom in image',
    exact: true,
  })
  await zoomIn.click()
  const fadedMarker = await marker.boundingBox()
  const largerRock = await viewport.locator('img').boundingBox()
  if (!fadedMarker || !largerRock)
    throw new Error('Zoomed face has not rendered')
  expect(largerRock.width).toBeGreaterThan(initialRock.width * 1.4)
  await expectCenter(initialCenter)
  expect(fadedMarker.width).toBeLessThan(initialMarker.width)
  expect(
    await marker.evaluate(circle =>
      Number.parseFloat(
        getComputedStyle(circle.parentElement ?? circle).opacity,
      ),
    ),
  ).toBeLessThan(0.4)
  expect(await visiblePaths()).toEqual(initialPaths)

  await zoomIn.click()
  await expectCenter(initialCenter)
  await expect(route.locator('circle, text')).toHaveCount(0)
  await zoomIn.click()
  await zoomIn.click()
  await expect(zoomIn).toBeDisabled()
  await expectCenter(initialCenter)
  expect(await visiblePaths()).toEqual(initialPaths)
  await expect(route.locator('circle, text')).toHaveCount(0)

  await viewport.evaluate(element => {
    element.scrollLeft += element.clientWidth * 0.2
    element.scrollTop += element.clientHeight * 0.15
  })
  const pannedCenter = await imageCenter()
  expect(pannedCenter.x).toBeGreaterThan(initialCenter.x + 0.04)
  expect(pannedCenter.y).toBeGreaterThan(initialCenter.y + 0.03)
  const zoomOut = dialog.getByRole('button', {
    name: 'Zoom out image',
    exact: true,
  })
  await zoomOut.click()
  await expectCenter(pannedCenter)
  await zoomOut.click()
  await expectCenter(pannedCenter)

  await dialog.getByRole('button', { name: 'Reset image zoom' }).click()
  await expect(marker).toBeVisible()
  await expectCenter(initialCenter)
  const resetRock = await viewport.locator('img').boundingBox()
  if (!resetRock) throw new Error('Reset face has not rendered')
  expect(resetRock.width).toBeCloseTo(initialRock.width, 0)
  expect(resetRock.height).toBeCloseTo(initialRock.height, 0)
  expect(
    await viewport.evaluate(element => ({
      left: element.scrollLeft,
      top: element.scrollTop,
    })),
  ).toEqual({ left: 0, top: 0 })
  expect(await visiblePaths()).toEqual(initialPaths)
})
