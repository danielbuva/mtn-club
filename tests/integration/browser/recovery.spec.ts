import { expect, test } from '@playwright/test'
import {
  admin,
  captchaToken,
  cleanup,
  client,
  confirmationLink,
  createAccount,
  messageFor,
  origin,
  successful,
} from '../auth-services.mjs'

test.afterAll(cleanup)

test('real email link survives scanner GET/HEAD and a fresh browser completes recovery once', async ({
  page,
  request,
  browser,
}) => {
  const user = await createAccount()
  const returnTo = '/auth-test-complete?source=email#done'
  successful(
    await client().auth.resetPasswordForEmail(user.email, {
      captchaToken,
      redirectTo: `${origin}/auth/confirm?flow=recovery&returnTo=${encodeURIComponent(returnTo)}`,
    }),
  )
  const link = confirmationLink(
    await messageFor(user.email, 'Reset your Mountain Club password'),
    'recovery',
  )
  expect((await request.head(link.toString())).status()).toBe(200)
  expect((await request.get(link.toString())).status()).toBe(200)
  await page.goto(link.toString())
  await expect(
    page.getByRole('button', { name: 'Continue to new password' }),
  ).toBeVisible()
  expect(
    (await page.context().cookies()).some(
      cookie => cookie.name === 'mc-auth-password',
    ),
  ).toBe(false)
  await page.getByRole('button', { name: 'Continue to new password' }).click()
  await expect(page.getByLabel('New password', { exact: true })).toBeVisible()
  const receipt = (await page.context().cookies()).find(
    cookie => cookie.name === 'mc-auth-password',
  )
  expect(receipt?.httpOnly).toBe(true)
  await page
    .getByLabel('New password', { exact: true })
    .fill(' a new browser passphrase ')
  await page
    .getByLabel('Confirm new password', { exact: true })
    .fill(' a new browser passphrase ')
  // The destination itself is outside this auth test; Auth/Supabase are unmocked.
  await page.route(`${origin}/auth-test-complete**`, route =>
    route.fulfill({
      contentType: 'text/html',
      body: '<h1>Returned to your page</h1>',
    }),
  )
  await page.getByRole('button', { name: 'Save new password' }).click()
  await expect(page).toHaveURL(`${origin}${returnTo}`)
  expect(
    (await page.context().cookies()).some(
      cookie => cookie.name === 'mc-auth-password',
    ),
  ).toBe(false)
  expect(
    successful(
      await client().auth.signInWithPassword({
        email: user.email,
        password: ' a new browser passphrase ',
        options: { captchaToken },
      }),
    ).user.id,
  ).toBe(user.id)
  const saved = successful(await admin.auth.admin.getUserById(user.id)).user
  expect(saved.app_metadata.email_verification.email).toBe(user.email)
  const fresh = await browser.newContext()
  try {
    const other = await fresh.newPage()
    await other.goto(link.toString())
    await other
      .getByRole('button', { name: 'Continue to new password' })
      .click()
    await expect(other.locator('main').getByRole('alert')).toContainText(
      'expired or has already been used',
    )
    await expect(other.getByLabel('New password', { exact: true })).toHaveCount(
      0,
    )
  } finally {
    await fresh.close()
  }
})
