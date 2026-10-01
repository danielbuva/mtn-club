import { expect, test } from '@playwright/test'
import { kraftGuide } from '../../lib/kraft/data'

test('every imported catalog remains reachable, including unresolved membership-only groups', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-390',
    'Whole-catalog batch on one mobile viewport',
  )
  test.setTimeout(180000)
  await page.goto('/guide/kraft#view=list')
  const directory = page.getByRole('complementary', {
    name: 'Boulder directory',
  })
  await expect(directory.locator('.kraft-results > li')).toHaveCount(
    kraftGuide.boulders.length,
  )
  for (const unit of kraftGuide.boulders) {
    await directory.locator(`[data-boulder-id="${unit.id}"] > button`).click()
    const dialog = page.getByRole('dialog', {
      name: `${unit.name} boulder guide`,
      exact: true,
    })
    await expect(dialog.locator('#kraft-boulder-title')).toHaveText(unit.name)
    await expect(dialog.locator('#kraft-boulder-title')).toBeFocused()
    await expect(dialog.locator('[data-climb-id]')).toHaveCount(
      unit.climbs.length,
    )
    if (!unit.climbs.length)
      await expect(
        dialog.getByRole('region', { name: 'Other source memberships' }),
      ).toBeVisible()
    await dialog
      .getByRole('button', { name: 'Back to Kraft', exact: true })
      .click()
  }
})

test('every canonical route opens its local facts without needing a photograph or source website', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-390',
    'Whole-route batch on one mobile viewport',
  )
  test.setTimeout(240000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/guide/kraft')
  for (const unit of kraftGuide.boulders) {
    for (const climb of unit.climbs) {
      await page.getByRole('searchbox').fill(climb.name)
      const result = page.locator(
        `.kraft-results > [data-boulder-id="${unit.id}"] [data-climb-id="${climb.id}"] > button`,
      )
      await result.click()
      const dialog = page.getByRole('dialog', {
        name: `${unit.name} boulder guide`,
        exact: true,
      })
      await expect(
        dialog.getByRole('region', { name: 'Selected climb', exact: true }),
      ).toContainText(climb.name)
      await dialog
        .getByLabel(`View ${climb.name} climb details`, { exact: true })
        .click()
      const record = dialog.getByRole('article', {
        name: `${climb.name} details`,
        exact: true,
      })
      await expect(record).toBeVisible()
      await expect(record).toContainText(climb.description)
      await expect(
        record.getByRole('region', { name: 'Published route evidence' }),
      ).toBeVisible()
      await expect(record).toContainText(
        'Published descriptions do not establish a reviewed line on the guide image.',
      )
      await dialog
        .getByRole('button', { name: 'Back to Kraft', exact: true })
        .click()
      await expect(result).toBeFocused()
    }
  }
  expect(errors).toEqual([])
})
