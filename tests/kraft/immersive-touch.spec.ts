import { expect, test } from '@playwright/test'
import { bounds, expectFixed, imagePointAtCenter } from './immersive-helpers'

test('native two-finger pinch preserves its image anchor, fixed controls and selected climb', async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name === 'desktop', 'Native mobile pinch gesture')
  await page.goto(
    '/guide/kraft#boulder=pearl&climb=the-pearl&face=pearl-southeast',
  )
  const dialog = page.getByRole('dialog', { name: 'The Pearl boulder guide' })
  const viewport = dialog.getByRole('region', { name: 'Scrollable face image' })
  const image = viewport.getByRole('img')
  const dock = dialog.getByRole('complementary', { name: 'Boulder climbs' })
  const reset = dialog.getByRole('button', {
    name: 'Reset image zoom',
    exact: true,
  })
  const controls = [
    dialog.getByRole('button', { name: 'Back to Kraft', exact: true }),
    dialog.getByRole('heading', { name: 'The Pearl', exact: true, level: 2 }),
    dialog.getByRole('button', { name: 'Boulder details', exact: true }),
    dock,
    dialog.getByRole('group', { name: 'Recorded boulder faces', exact: true }),
    dialog.getByRole('button', { name: 'Zoom in image', exact: true }),
    dialog.getByRole('button', { name: 'Zoom out image', exact: true }),
    reset,
    dialog.getByRole('button', { name: 'Fit whole face', exact: true }),
  ]
  await expect(image).toBeVisible()
  const initialPhoto = await bounds(image)
  const fixedBounds = await Promise.all(
    controls.map(control => bounds(control)),
  )
  const anchor = await imagePointAtCenter(viewport, image)
  const frame = await bounds(viewport)
  const center = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 }
  const initialURL = page.url()
  const session = await context.newCDPSession(page)
  const touchPoints = (distance: number) => [
    {
      x: center.x - distance / 2,
      y: center.y,
      id: 1,
      radiusX: 2,
      radiusY: 2,
      force: 1,
    },
    {
      x: center.x + distance / 2,
      y: center.y,
      id: 2,
      radiusX: 2,
      radiusY: 2,
      force: 1,
    },
  ]
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: touchPoints(60),
    })
    for (let step = 1; step <= 6; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: touchPoints(60 + (80 * step) / 6),
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
    .poll(async () => (await bounds(image)).width)
    .toBeGreaterThan(initialPhoto.width * 1.5)
  const pinchedPhoto = await bounds(image)
  const pinchedAnchor = await imagePointAtCenter(viewport, image)
  expect(
    Math.abs(pinchedAnchor.x - anchor.x) * pinchedPhoto.width,
  ).toBeLessThanOrEqual(2.5)
  expect(
    Math.abs(pinchedAnchor.y - anchor.y) * pinchedPhoto.height,
  ).toBeLessThanOrEqual(2.5)
  expect(pinchedPhoto.width / pinchedPhoto.height).toBeCloseTo(
    initialPhoto.width / initialPhoto.height,
    3,
  )
  await expectFixed(controls, fixedBounds)
  await expect(
    dock.getByRole('region', { name: 'Selected climb' }),
  ).toContainText('The Pearl')
  await expect(
    dock.getByRole('button', { name: 'Browse climbs', exact: true }),
  ).toHaveAttribute('aria-expanded', 'false')
  await expect(page).toHaveURL(initialURL)
  await testInfo.attach(
    'native-pinch-retains-midpoint-and-floating-guide-controls',
    {
      body: await page.screenshot({ scale: 'css' }),
      contentType: 'image/png',
    },
  )

  await reset.tap()
  await expect(
    dialog.getByRole('button', { name: 'Zoom out image', exact: true }),
  ).toBeDisabled()
  const restoredPhoto = await bounds(image)
  for (const dimension of ['x', 'y', 'width', 'height'] as const)
    expect(restoredPhoto[dimension]).toBeCloseTo(initialPhoto[dimension], 0)
  const restoredAnchor = await imagePointAtCenter(viewport, image)
  expect(restoredAnchor.x).toBeCloseTo(anchor.x, 3)
  expect(restoredAnchor.y).toBeCloseTo(anchor.y, 3)
  await expectFixed(controls, fixedBounds)
  await expect(page).toHaveURL(initialURL)
})
