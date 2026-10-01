import type { Page } from '@playwright/test'

export function mapCatalogTrigger(page: Page, boulderId: string) {
  const selector = [
    `[data-catalog-ids="${boulderId}"]`,
    `[data-catalog-ids^="${boulderId},"]`,
    `[data-catalog-ids*=",${boulderId},"]`,
    `[data-catalog-ids$=",${boulderId}"]`,
  ].join(',')
  return page.locator(selector)
}

export async function openMapCatalog(page: Page, boulderId: string) {
  const trigger = mapCatalogTrigger(page, boulderId)
  const clustered = (await trigger.getAttribute('data-cluster')) === 'true'
  await trigger.scrollIntoViewIfNeeded()
  const point = await trigger.locator('.kraft-map-catalog-point').boundingBox()
  if (!point) throw new Error(`Missing visible map center for ${boulderId}`)
  // Native center taps exercise nearest-center dispatch when hit targets overlap.
  await page.mouse.click(point.x + point.width / 2, point.y + point.height / 2)
  const chooser = page.getByRole('dialog', {
    name: 'Choose a nearby catalog',
    exact: true,
  })
  if (clustered)
    await chooser.locator(`[data-boulder-id="${boulderId}"]`).click()
  return trigger
}

export async function openListCatalog(page: Page, boulderId: string) {
  await page.getByRole('button', { name: /^Boulders \d+$/ }).click()
  await page
    .locator(`.kraft-results > [data-boulder-id="${boulderId}"] > button`)
    .click()
}
