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
  await dialog
    .getByRole('button', { name: 'Clean photograph', exact: true })
    .click()
  await expect(dialog.locator('g[data-confidence="moderate"]')).toHaveCount(0)
  await expect(selected).toContainText('Approximate corridor available')
  await expect(selected).not.toContainText('highlighted')
  await dialog.getByRole('button', { name: 'All lines', exact: true }).click()
  await expect(dialog.locator('g[data-confidence="moderate"]')).toHaveCount(2)
})
