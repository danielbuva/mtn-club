import { expect, test } from '@playwright/test'
import type { User } from '@supabase/supabase-js'
import {
  admin,
  cleanup,
  confirmationLink,
  messageFor,
  password,
  remember,
  successful,
  testEmail,
} from '../auth-services.mjs'

test.afterAll(cleanup)

test('real managed test widget, email confirmation in another browser, and membership submission', async ({
  page,
  browser,
}) => {
  const email = testEmail()
  await page.goto('/membership-sign-up')
  await expect(page).toHaveURL(/\/membership-sign-up$/)
  await page.getByLabel('Email address', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password', { exact: true }).fill(password)
  await page.getByLabel('Name', { exact: true }).fill('Isolated auth member')
  await page.getByRole('radio', { name: 'I am 18 or older' }).check()
  await page.getByRole('radio', { name: 'I have not paid yet' }).check()
  await page.getByRole('checkbox', { name: 'Hiking', exact: true }).check()
  // Actual Cloudflare test widget: no mocked browser token or Auth endpoint.
  await expect(page.locator('input[name="captchaToken"]')).not.toHaveValue('', {
    timeout: 30000,
  })
  await page
    .getByRole('button', { name: 'Create account and submit', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Check your email.' }),
  ).toBeVisible()
  const users = successful(await admin.auth.admin.listUsers()).users
  const user = remember(
    users.find((candidate: User) => candidate.email === email),
  )
  expect(user.email_confirmed_at).toBeFalsy()
  const link = confirmationLink(
    await messageFor(email, 'Confirm your Mountain Club email'),
    'signup',
  )
  const confirmedContext = await browser.newContext()
  try {
    const confirmed = await confirmedContext.newPage()
    await confirmed.goto(link.toString())
    await confirmed
      .getByRole('button', { name: 'Confirm and continue' })
      .click()
    await expect(confirmed).toHaveURL(/\/membership$/)
    const saved = await admin
      .from('membership_applications')
      .select('user_id,status,full_name')
      .eq('user_id', user.id)
      .single()
    expect(saved.error).toBeNull()
    expect(saved.data?.status).toBe('submitted')
    expect(saved.data?.full_name).toBe('Isolated auth member')
    await confirmed.goto('/membership-sign-up')
    await expect(confirmed).toHaveURL(/\/membership$/)
    expect(
      successful(await admin.auth.admin.getUserById(user.id)).user.id,
    ).toBe(user.id)
  } finally {
    await confirmedContext.close()
  }
})
