import { expect, test } from '@playwright/test'
import { mockAuthServices } from './auth-fixtures'

test.use({ viewport: { width: 390, height: 844 } })
test.beforeEach(async ({ page }) => {
  await mockAuthServices(page)
})

test('mobile More opens a full-screen menu and supports closing and navigation', async ({
  page,
}) => {
  await page.goto('/join')
  await page
    .getByRole('button', { name: 'Open navigation', exact: true })
    .click()
  const more = page.getByRole('button', { name: 'More', exact: true })
  const menuButton = page.getByRole('button', {
    name: 'Close navigation',
    exact: true,
  })
  const menuBounds = await menuButton.boundingBox()
  const menuClass = await menuButton.getAttribute('class')
  await more.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('link', { name: 'Join the community', exact: true }),
  ).toBeVisible()
  await expect(
    dialog.getByRole('link', { name: 'Account details', exact: true }),
  ).toHaveCount(0)
  const bounds = await dialog.boundingBox()
  expect(bounds?.width).toBe(390)
  expect(bounds?.height).toBe(844)
  const close = dialog.getByRole('button', { name: 'Close', exact: true })
  await expect(close).toHaveAttribute('class', menuClass ?? '')
  await expect.poll(() => close.boundingBox()).toEqual(menuBounds)
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(dialog).toBeHidden()
  const collapsedMenu = page.getByRole('button', {
    name: 'Open navigation',
    exact: true,
  })
  await expect(collapsedMenu).toHaveAttribute('aria-expanded', 'false')
  await expect(collapsedMenu).toBeFocused()
  await collapsedMenu.click()
  await more.click()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(collapsedMenu).toHaveAttribute('aria-expanded', 'false')
  await collapsedMenu.click()
  await more.click()
  await dialog
    .getByRole('link', { name: 'Common questions', exact: true })
    .click()
  await expect(page).toHaveURL(/\/faq$/)
  await expect(dialog).toBeHidden()
})

test('signed-in non-members see account pages without Join or event creation', async ({
  page,
}) => {
  await page.goto(
    '/auth/confirm?token_hash=isolated-valid-more-menu&type=recovery',
  )
  await page.getByRole('button', { name: 'Continue to new password' }).click()
  await expect(page.getByLabel('New password', { exact: true })).toBeVisible()
  await page.goto('/')
  const primaryNavigation = page.getByRole('navigation', {
    name: 'Primary',
    exact: true,
  })
  await expect(
    primaryNavigation.getByRole('link', { name: 'Schedule →', exact: true }),
  ).toHaveAttribute('href', '/schedule')
  await expect(
    primaryNavigation.getByRole('link', { name: /Calendar|Trips & Events/ }),
  ).toHaveCount(0)
  const directory = primaryNavigation.getByRole('button', {
    name: 'Explore →',
    exact: true,
  })
  await directory.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page).toHaveURL('http://127.0.0.1:3100/')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Close', exact: true })
    .click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(directory).toBeFocused()
  await page.goto('/join')
  await page
    .getByRole('button', { name: 'Open navigation', exact: true })
    .click()
  await page.getByRole('button', { name: 'More', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(
    dialog.getByRole('link', { name: 'Account details', exact: true }),
  ).toBeVisible()
  await expect(dialog.locator('a[href="/join"]')).toHaveCount(0)
  await expect(dialog.locator('a[href="/auth/sign-up"]')).toHaveCount(0)
  await expect(dialog.locator('a[href="/trips/new"]')).toHaveCount(0)
  await expect(dialog.locator('a[href="/admin"]')).toHaveCount(0)
})
