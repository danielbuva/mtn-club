import { expect, test } from '@playwright/test'
import { mockAuthServices } from './auth-fixtures'

test.beforeEach(async ({ page }) => {
  await mockAuthServices(page)
})

test('a recovery link establishes a session only after confirmation and supports password change', async ({
  page,
  request,
}) => {
  const token = 'isolated-valid-recovery-journey'
  const link = `/auth/confirm?token_hash=${token}&type=recovery&returnTo=%2Ftrips%3Frecovered%3D1%23top`
  await page.goto(link)
  await expect(
    page.getByRole('button', { name: 'Continue to new password' }),
  ).toBeVisible()
  const before = await request.get('http://127.0.0.1:54399/test/requests')
  expect(await before.json()).not.toContainEqual({
    token_hash: token,
    type: 'recovery',
  })
  await page.getByRole('button', { name: 'Continue to new password' }).click()
  await expect(page.getByLabel('New password', { exact: true })).toBeVisible()
  await expect(
    page.getByText('member@example.test', { exact: true }),
  ).toBeVisible()
  await page.getByLabel('New password', { exact: true }).fill('too short')
  await page.getByRole('button', { name: 'Save new password' }).click()
  await expect(page.getByText('Use at least 12 characters.')).toBeVisible()
  await page
    .getByLabel('New password', { exact: true })
    .fill(' new passphrase with spaces ')
  await page
    .getByLabel('Confirm new password', { exact: true })
    .fill(' new passphrase with spaces ')
  await page.route(
    url => url.pathname === '/trips' && url.searchParams.has('recovered'),
    route =>
      route.fulfill({
        contentType: 'text/html',
        body: '<h1>Password changed destination</h1>',
      }),
  )
  await page.getByRole('button', { name: 'Save new password' }).click()
  await expect(page).toHaveURL('http://127.0.0.1:3100/trips?recovered=1#top')
  const saved = await request.get('http://127.0.0.1:54399/test/requests')
  expect(await saved.json()).toContainEqual({
    action: 'password-update',
    password: ' new passphrase with spaces ',
  })
  expect(
    (await page.context().cookies()).some(
      cookie => cookie.name === 'mc-auth-password',
    ),
  ).toBe(false)
  expect(await page.evaluate(() => sessionStorage.getItem('auth:notice'))).toBe(
    'password-updated',
  )
  // Opening the same link in a fresh browser session must not work a second time.
  await page.context().clearCookies()
  await page.goto(link)
  await page.getByRole('button', { name: 'Continue to new password' }).click()
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'expired or has already been used',
  )
  await expect(
    page.getByRole('link', { name: 'Request a new reset link' }),
  ).toHaveAttribute(
    'href',
    '/auth/forgot-password?returnTo=%2Ftrips%3Frecovered%3D1%23top',
  )
})

test('expired recovery links never expose the new-password form', async ({
  page,
}) => {
  await page.goto('/auth/confirm?token_hash=isolated-expired&type=recovery')
  await page.getByRole('button', { name: 'Continue to new password' }).click()
  await expect(page.locator('main').getByRole('alert')).toContainText('expired')
  await expect(page.getByLabel('New password', { exact: true })).toHaveCount(0)
})
