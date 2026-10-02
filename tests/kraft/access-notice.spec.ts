import { expect, test } from '@playwright/test'

test('Caliman closure stays visible while its four historical routes remain browseable', async ({
  page,
}, testInfo) => {
  await page.goto('/guide/kraft#view=list')
  await page.getByRole('searchbox').fill('Caliman')
  const result = page.locator('[data-boulder-id="mp-area-106800767"]')
  await expect(result.locator('[data-climb-id]')).toHaveCount(4)
  await expect(
    result.getByText('Climbing closed · Mountain Project', { exact: true }),
  ).toHaveCount(5)
  await page.getByRole('button', { name: 'V3–V5', exact: true }).click()
  await expect(result.locator('[data-climb-id]')).toHaveCount(3)
  await page.getByRole('button', { name: 'V6–V8', exact: true }).click()
  await expect(result.locator('[data-climb-id]')).toHaveCount(1)
  await expect(
    result.locator('[data-climb-id="mp-route-106800770"]'),
  ).toContainText('V7')
  await page.getByRole('button', { name: 'All grades', exact: true }).click()
  await result.locator('.kraft-boulder-result').click()

  const dialog = page.getByRole('dialog', {
    name: 'Caliman Boulder boulder guide',
    exact: true,
  })
  const notice = dialog
    .getByRole('complementary', { name: 'Climbing access notice', exact: true })
    .first()
  await expect(notice).toContainText('within 50 feet of cultural sites')
  await expect(notice).toContainText('Source checked October 1, 2026')
  await expect(notice.getByRole('link')).toHaveAttribute(
    'href',
    'https://www.mountainproject.com/area/106800767/caliman-boulder',
  )
  const sourceDetails = notice.getByText('Closure source details', {
    exact: true,
  })
  await sourceDetails.focus()
  await page.keyboard.press('Enter')
  await expect(notice.locator('details')).toHaveAttribute('open', '')
  await expect(notice).toContainText('April 6, 2012')
  await expect(notice).toContainText(
    'Access has not been checked in the field or reconfirmed with BLM.',
  )
  await testInfo.attach('caliman-access-notice', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  })
  await page.keyboard.press('Enter')

  const climbs = dialog.getByRole('region', { name: 'Climbs sorted by grade' })
  await expect(climbs.locator('[data-climb-id]')).toHaveCount(4)
  for (const [id, name, grade] of [
    ['106802769', 'Bread Box', 'V4'],
    ['106800770', 'Caliman', 'V7'],
    ['106800785', 'Toadstool', 'V4'],
    ['106800777', 'Unnamed', 'V5'],
  ]) {
    const route = climbs.locator(`[data-climb-id="mp-route-${id}"] button`)
    await route.focus()
    await page.keyboard.press('Enter')
    await expect(route).toHaveAttribute('aria-pressed', 'true')
    const selected = dialog.getByRole('region', {
      name: 'Selected climb',
      exact: true,
    })
    await expect(selected.getByRole('heading')).toHaveText(name)
    await expect(selected).toContainText(grade)
    await expect(selected).toContainText(
      'Climbing closed · historical route record',
    )
    await expect(selected).toContainText('Source checked October 1, 2026')
  }
  expect(
    await dialog.evaluate(
      element => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true)
})
