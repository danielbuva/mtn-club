import { expect, test } from '@playwright/test'
import { bounds, expectCameraSettled, expectFixed } from './immersive-helpers'

test('whole-face overview reveals the complete image and aligned topo before returning to filled framing', async ({
  page,
}, testInfo) => {
  await page.goto(
    '/guide/kraft#boulder=pearl&climb=the-pearl&face=pearl-southeast',
  )
  const dialog = page.getByRole('dialog', { name: 'The Pearl boulder guide' })
  const viewport = dialog.getByRole('region', { name: 'Scrollable face image' })
  const image = viewport.getByRole('img')
  const overlay = viewport.getByRole('group', {
    name: 'Interactive routes. Select a line or climb.',
  })
  const framing = dialog.getByRole('button', {
    name: /^(Fit whole face|Fill screen with face)$/,
  })
  const zoomIn = dialog.getByRole('button', {
    name: 'Zoom in image',
    exact: true,
  })
  const zoomOut = dialog.getByRole('button', {
    name: 'Zoom out image',
    exact: true,
  })
  const controls = [
    dialog.getByRole('button', { name: 'Back to Kraft', exact: true }),
    dialog.getByRole('heading', { name: 'The Pearl', exact: true, level: 2 }),
    dialog.getByRole('complementary', { name: 'Boulder climbs' }),
    dialog.getByRole('group', { name: 'Recorded boulder faces', exact: true }),
    zoomIn,
    zoomOut,
    dialog.getByRole('button', { name: 'Reset image zoom', exact: true }),
    framing,
  ]
  await expect(image).toBeVisible()
  await expect(overlay).toBeVisible()
  await expect(framing).toHaveAccessibleName('Fit whole face')
  await expect(framing).toHaveAttribute('aria-pressed', 'false')
  const fixedBounds = await Promise.all(
    controls.map(control => bounds(control)),
  )
  const native = await image.evaluate(element => {
    if (!(element instanceof HTMLImageElement))
      throw new Error('A native face image is required')
    return { width: element.naturalWidth, height: element.naturalHeight }
  })
  expect(native.width).toBeGreaterThan(0)
  expect(native.height).toBeGreaterThan(0)
  const initialURL = page.url()
  await zoomIn.click()
  const beforePan = await bounds(image)
  await viewport.focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowDown')
  await expect
    .poll(async () => {
      const panned = await bounds(image)
      return Math.hypot(panned.x - beforePan.x, panned.y - beforePan.y)
    })
    .toBeGreaterThan(5)
  await expectCameraSettled(image)
  await framing.click()
  await expect(framing).toHaveAccessibleName('Fill screen with face')
  await expect(framing).toHaveAttribute('aria-pressed', 'true')
  await expect(zoomOut).toBeDisabled()
  await expect(image).toBeInViewport({ ratio: 1 })
  const frame = await bounds(viewport)
  const whole = await bounds(image)
  expect(whole.x).toBeGreaterThanOrEqual(frame.x - 0.5)
  expect(whole.y).toBeGreaterThanOrEqual(frame.y - 0.5)
  expect(whole.x + whole.width).toBeLessThanOrEqual(frame.x + frame.width + 0.5)
  expect(whole.y + whole.height).toBeLessThanOrEqual(
    frame.y + frame.height + 0.5,
  )
  expect(whole.width / whole.height).toBeCloseTo(
    native.width / native.height,
    3,
  )
  expect(whole.x + whole.width / 2).toBeCloseTo(frame.x + frame.width / 2, 0)
  expect(whole.y + whole.height / 2).toBeCloseTo(frame.y + frame.height / 2, 0)
  await expect(overlay).toHaveAttribute(
    'viewBox',
    `0 0 ${native.width} ${native.height}`,
  )
  const topo = await bounds(overlay)
  for (const dimension of ['x', 'y', 'width', 'height'] as const)
    expect(topo[dimension]).toBeCloseTo(whole[dimension], 0)
  await expect(
    overlay.getByRole('button', { name: /^Route \d+: The Pearl, V5/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expectFixed(controls, fixedBounds)
  await expect(page).toHaveURL(initialURL)
  await testInfo.attach('whole-face-overview-with-complete-native-frame', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })

  await framing.click()
  await expect(framing).toHaveAccessibleName('Fit whole face')
  await expect(framing).toHaveAttribute('aria-pressed', 'false')
  await expect(zoomOut).toBeDisabled()
  const filled = await bounds(image)
  expect(filled.x).toBeLessThanOrEqual(frame.x + 0.5)
  expect(filled.y).toBeLessThanOrEqual(frame.y + 0.5)
  expect(filled.x + filled.width).toBeGreaterThanOrEqual(
    frame.x + frame.width - 0.5,
  )
  expect(filled.y + filled.height).toBeGreaterThanOrEqual(
    frame.y + frame.height - 0.5,
  )
  expect(filled.width / filled.height).toBeCloseTo(
    native.width / native.height,
    3,
  )
  expect(
    Math.max(filled.width - frame.width, filled.height - frame.height),
  ).toBeGreaterThan(1)
  await expectFixed(controls, fixedBounds)
  await expect(page).toHaveURL(initialURL)
})
