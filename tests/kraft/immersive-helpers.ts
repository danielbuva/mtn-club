import { expect, type Locator } from '@playwright/test'

export type Bounds = { x: number; y: number; width: number; height: number }

export async function bounds(locator: Locator): Promise<Bounds> {
  const result = await locator.boundingBox()
  if (!result) throw new Error(`Expected visible bounds for ${locator}`)
  return result
}

export async function expectFixed(controls: Locator[], initial: Bounds[]) {
  for (const [index, control] of controls.entries()) {
    await expect(control).toBeInViewport({ ratio: 1 })
    const current = await bounds(control)
    for (const dimension of ['x', 'y', 'width', 'height'] as const)
      expect(current[dimension], `${control}: ${dimension}`).toBeCloseTo(
        initial[index][dimension],
        0,
      )
  }
}

export async function imagePointAtCenter(viewport: Locator, image: Locator) {
  const frame = await bounds(viewport)
  const photo = await bounds(image)
  return {
    x: (frame.x + frame.width / 2 - photo.x) / photo.width,
    y: (frame.y + frame.height / 2 - photo.y) / photo.height,
  }
}
export async function expectCameraSettled(image: Locator) {
  await expect
    .poll(async () => {
      const before = await bounds(image)
      await image.evaluate(
        () => new Promise<number>(resolve => requestAnimationFrame(resolve)),
      )
      const after = await bounds(image)
      return Math.hypot(after.x - before.x, after.y - before.y)
    })
    .toBeLessThan(0.1)
}
