import { expect, test } from '@playwright/test'
import { mockAuthServices } from './auth-fixtures'

test('auth canyon photo fits desktop and stays hidden on mobile', async ({
  page,
}) => {
  await mockAuthServices(page)
  for (const route of ['login', 'sign-up']) {
    await page.goto(`/auth/${route}`)
    const photo = page.locator(
      'section[aria-label="Mountain Club community"] img',
    )
    await expect(photo).toHaveAttribute(
      'alt',
      'Mountain Club members exploring a rocky desert canyon',
    )
    await expect(photo).toHaveAttribute('src', /club-hike/)
    for (const width of [320, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      if (width < 1024) {
        await expect(photo).toBeHidden()
      } else {
        await expect(photo).toBeVisible()
        await expect
          .poll(() =>
            photo.evaluate(
              image =>
                image instanceof HTMLImageElement &&
                image.complete &&
                image.naturalWidth > 0,
            ),
          )
          .toBe(true)
        await page.screenshot({
          path: `test-results/auth-photo-${route}-${width}.png`,
          fullPage: true,
        })
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width)
    }
  }
})
