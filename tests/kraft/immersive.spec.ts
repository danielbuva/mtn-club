import { expect, test } from '@playwright/test'
import {
  bounds,
  expectCameraSettled,
  expectFixed,
  imagePointAtCenter,
} from './immersive-helpers'

const pearlLink =
  '/guide/kraft#boulder=pearl&climb=the-pearl&face=pearl-southeast'

test('zoom and keyboard pan move the face while floating guide controls remain fixed', async ({
  page,
}, testInfo) => {
  await page.goto(pearlLink)
  const dialog = page.getByRole('dialog', { name: 'The Pearl boulder guide' })
  const viewer = dialog.getByRole('region', {
    name: 'Boulder faces',
    exact: true,
  })
  const viewport = viewer.getByRole('region', { name: 'Scrollable face image' })
  const image = viewport.getByRole('img')
  const heading = dialog.getByRole('heading', {
    name: 'The Pearl',
    exact: true,
    level: 2,
  })
  const dock = dialog.getByRole('complementary', { name: 'Boulder climbs' })
  const zoomIn = viewer.getByRole('button', {
    name: 'Zoom in image',
    exact: true,
  })
  const reset = viewer.getByRole('button', {
    name: 'Reset image zoom',
    exact: true,
  })
  const controls = [
    dialog.getByRole('button', { name: 'Back to Kraft', exact: true }),
    heading,
    dialog.getByRole('button', { name: 'Boulder details', exact: true }),
    dock,
    dialog.getByRole('group', { name: 'Recorded boulder faces', exact: true }),
    viewer.getByRole('button', { name: 'Zoom out image', exact: true }),
    reset,
    zoomIn,
    viewer.getByRole('button', { name: 'Topo display', exact: true }),
  ]
  await expect(heading).toBeFocused()
  await expect(image).toBeVisible()
  const frame = await bounds(viewport)
  const screen = page.viewportSize()
  if (!screen) throw new Error('A viewport is required for the immersive guide')
  expect(frame.x).toBeCloseTo(0, 0)
  expect(frame.y).toBeCloseTo(0, 0)
  expect(frame.width).toBeCloseTo(screen.width, 0)
  expect(frame.height).toBeCloseTo(screen.height, 0)
  const fixedBounds = await Promise.all(
    controls.map(control => bounds(control)),
  )
  const initialPhoto = await bounds(image)
  const initialURL = page.url()
  await expect(
    dock.getByRole('button', { name: 'Browse climbs', exact: true }),
  ).toHaveAttribute('aria-expanded', 'false')

  await zoomIn.click()
  await expect(reset).toBeEnabled()
  expect((await bounds(image)).width).toBeGreaterThan(initialPhoto.width)
  await expectFixed(controls, fixedBounds)
  const beforePan = await bounds(image)
  await viewport.focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await expect
    .poll(async () => {
      const photo = await bounds(image)
      return Math.hypot(photo.x - beforePan.x, photo.y - beforePan.y)
    })
    .toBeGreaterThan(5)
  await expectCameraSettled(image)
  await expectFixed(controls, fixedBounds)
  const anchor = await imagePointAtCenter(viewport, image)
  const pannedPhoto = await bounds(image)
  await zoomIn.click()
  expect((await bounds(image)).width).toBeGreaterThan(pannedPhoto.width)
  const zoomedAnchor = await imagePointAtCenter(viewport, image)
  expect(zoomedAnchor.x).toBeCloseTo(anchor.x, 2)
  expect(zoomedAnchor.y).toBeCloseTo(anchor.y, 2)
  await expectFixed(controls, fixedBounds)
  await expect(page).toHaveURL(initialURL)
  await expect(
    dock.getByRole('region', { name: 'Selected climb' }),
  ).toContainText('The Pearl')
  await reset.click()
  await expect(reset).toBeEnabled()
  await expect(
    viewer.getByRole('button', { name: 'Zoom out image', exact: true }),
  ).toBeDisabled()
  const restoredPhoto = await bounds(image)
  expect(restoredPhoto.width).toBeCloseTo(initialPhoto.width, 0)
  expect(restoredPhoto.height).toBeCloseTo(initialPhoto.height, 0)
  expect(restoredPhoto.x + restoredPhoto.width / 2).toBeCloseTo(
    initialPhoto.x + initialPhoto.width / 2,
    0,
  )
  expect(restoredPhoto.y + restoredPhoto.height / 2).toBeCloseTo(
    initialPhoto.y + initialPhoto.height / 2,
    0,
  )
  await expectFixed(controls, fixedBounds)
  await testInfo.attach('immersive-fixed-controls-after-camera-movement', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })
})

test('native touch panning preserves selection and leaves the header and dock in place', async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name === 'desktop', 'Native mobile touch gesture')
  await page.goto(pearlLink)
  const dialog = page.getByRole('dialog', { name: 'The Pearl boulder guide' })
  const viewport = dialog.getByRole('region', { name: 'Scrollable face image' })
  const image = viewport.getByRole('img')
  const controls = [
    dialog.getByRole('button', { name: 'Back to Kraft', exact: true }),
    dialog.getByRole('heading', { name: 'The Pearl', exact: true, level: 2 }),
    dialog.getByRole('complementary', { name: 'Boulder climbs' }),
    dialog.getByRole('button', { name: 'Zoom in image', exact: true }),
    dialog.getByRole('button', { name: 'Reset image zoom', exact: true }),
  ]
  await expect(image).toBeVisible()
  await dialog.getByRole('button', { name: 'Zoom in image', exact: true }).tap()
  const fixedBounds = await Promise.all(
    controls.map(control => bounds(control)),
  )
  const beforePan = await bounds(image)
  const frame = await bounds(viewport)
  const initialURL = page.url()
  const start = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 }
  const session = await context.newCDPSession(page)
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ ...start, id: 1, radiusX: 2, radiusY: 2, force: 1 }],
    })
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          {
            x: start.x - step * 9,
            y: start.y - step * 11,
            id: 1,
            radiusX: 2,
            radiusY: 2,
            force: 1,
          },
        ],
      })
    }
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
  } finally {
    await session.detach()
  }
  await expect
    .poll(async () => {
      const photo = await bounds(image)
      return Math.hypot(photo.x - beforePan.x, photo.y - beforePan.y)
    })
    .toBeGreaterThan(20)
  await expectFixed(controls, fixedBounds)
  await expect(page).toHaveURL(initialURL)
  await expect(
    dialog.getByRole('region', { name: 'Selected climb' }),
  ).toContainText('The Pearl')
  await expect(
    dialog.getByRole('button', { name: 'Browse climbs', exact: true }),
  ).toHaveAttribute('aria-expanded', 'false')
})

test('topo display and boulder information open on demand without changing the camera or selected climb', async ({
  page,
}) => {
  await page.goto(pearlLink)
  const dialog = page.getByRole('dialog', { name: 'The Pearl boulder guide' })
  const viewport = dialog.getByRole('region', { name: 'Scrollable face image' })
  const image = viewport.getByRole('img')
  const display = dialog.getByRole('button', {
    name: 'Topo display',
    exact: true,
  })
  const overlay = viewport.getByRole('group', {
    name: 'Interactive routes. Select a line or climb.',
  })
  await expect(image).toBeVisible()
  await expect(display).toHaveAttribute('aria-expanded', 'false')
  await expect(
    dialog.getByRole('button', { name: 'All lines', exact: true }),
  ).toBeHidden()
  const initialURL = page.url()
  const camera = await bounds(image)
  await display.click()
  await expect(display).toHaveAttribute('aria-expanded', 'true')
  await dialog.getByRole('button', { name: 'Clean image', exact: true }).click()
  await expect(overlay).toBeHidden()
  await expect(image).toBeVisible()
  if ((await display.getAttribute('aria-expanded')) === 'false')
    await display.click()
  await dialog
    .getByRole('button', { name: 'Selected line', exact: true })
    .click()
  await expect(overlay.getByRole('button')).toHaveCount(1)
  await expect(
    overlay.getByRole('button', { name: /^Route \d+: The Pearl, V5/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  if ((await display.getAttribute('aria-expanded')) === 'false')
    await display.click()
  await dialog.getByRole('button', { name: 'All lines', exact: true }).click()
  await expect
    .poll(() => overlay.getByRole('button').count())
    .toBeGreaterThan(1)
  if ((await display.getAttribute('aria-expanded')) === 'true')
    await display.click()
  await expect(display).toHaveAttribute('aria-expanded', 'false')

  const information = dialog.getByRole('button', {
    name: 'Boulder details',
    exact: true,
  })
  const sheet = dialog.getByRole('region', {
    name: 'Boulder details',
    exact: true,
  })
  await expect(sheet).toBeHidden()
  await information.click()
  await expect(sheet).toBeVisible()
  await expect(
    sheet.getByText('Finding the boulder', { exact: true }),
  ).toBeVisible()
  await expect(
    sheet.getByText('About this boulder', { exact: true }),
  ).toBeVisible()
  const credit = sheet.getByText('Image notes & credit', { exact: true })
  await credit.click()
  await expect(sheet).toContainText('Original MTN Club reconstruction')
  await expect(
    sheet.getByRole('region', { name: 'Boulders nearby', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
  await expect(information).toBeFocused()
  await expect(dialog).toBeVisible()
  expect(await bounds(image)).toEqual(camera)
  await expect(page).toHaveURL(initialURL)
})
