import { expect, test } from '@playwright/test'
import { fillLogin, mockAuthServices } from './auth-fixtures'

test.beforeEach(async ({ page }) => {
  await mockAuthServices(page)
})

test('mobile validation, autofill attributes, visibility, and live requirements', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/auth/sign-up?returnTo=%2Ftrips%3Fview%3Dlist%23september')
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click()
  await expect(page.getByLabel('Email address')).toBeFocused()
  await expect(page.getByText('Enter a valid email address.')).toBeVisible()
  const password = page.getByLabel('Password', { exact: true })
  await password.fill('long passphrase ')
  await expect(page.getByText('Length requirement met')).toBeVisible()
  await expect(password).toHaveAttribute('autocomplete', 'new-password')
  await page.getByRole('button', { name: 'Show password', exact: true }).click()
  await expect(password).toHaveAttribute('type', 'text')
  await page
    .getByLabel('Confirm password', { exact: true })
    .fill('long passphrase ')
  await expect(page.getByText('Passwords match.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Sign in', exact: true }),
  ).toHaveAttribute(
    'href',
    '/auth/login?returnTo=%2Ftrips%3Fview%3Dlist%23september',
  )
})

test('pending disables credentials/providers and errors are actionable', async ({
  page,
}) => {
  let finishRequest: (() => void) | undefined
  const release = new Promise<void>(resolve => {
    finishRequest = resolve
  })
  await page.route('**/auth/v1/token**', async route => {
    await release
    await route.fulfill({
      status: 400,
      json: {
        error_code: 'invalid_credentials',
        message: 'raw secret payload',
      },
    })
  })
  await page.goto('/auth/login')
  await fillLogin(page)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Signing in…' })).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Continue with Google' }),
  ).toBeDisabled()
  await expect(page.getByLabel('Email address')).toBeDisabled()
  finishRequest?.()
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'The email or password is incorrect',
  )
  await expect(page.locator('main').getByRole('alert')).not.toContainText(
    'raw secret',
  )
  await expect(
    page.getByRole('button', { name: 'Sign in', exact: true }),
  ).toBeEnabled()
})

test('expired CAPTCHA blocks submission and can be retried', async ({
  page,
}) => {
  let requests = 0
  await page.route('**/auth/v1/token**', route => {
    requests += 1
    return route.fulfill({
      status: 400,
      json: { error_code: 'invalid_credentials' },
    })
  })
  await page.goto('/auth/login')
  await fillLogin(page)
  await page.getByRole('button', { name: 'Simulate CAPTCHA expiry' }).click()
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'security check',
  )
  expect(requests).toBe(0)
  await page.getByRole('button', { name: 'Retry security check' }).click()
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'email or password is incorrect',
  )
  expect(requests).toBe(1)
})

test('recovery preserves destination and confirms email with cooldown', async ({
  page,
}) => {
  await page.route('**/auth/v1/recover**', async route => {
    const destination = new URL(route.request().url()).searchParams.get(
      'redirect_to',
    )
    expect(destination).toBe(
      'http://127.0.0.1:3100/auth/confirm?flow=recovery&returnTo=%2Ftrips%3Fview%3Dlist%23september',
    )
    const body = route.request().postDataJSON()
    expect(body.gotrue_meta_security.captcha_token).toBe(
      'isolated-captcha-token',
    )
    await route.fulfill({ json: {} })
  })
  await page.goto('/auth/login?redirect=%2Ftrips%3Fview%3Dlist%23september')
  await page.getByRole('link', { name: 'Forgot password?' }).click()
  await expect(
    page.getByRole('heading', { name: 'Lost your password?' }),
  ).toBeVisible()
  await expect(page.getByText('Security check complete')).toBeVisible()
  await page
    .getByRole('textbox', { name: 'Email address', exact: true })
    .fill('member@example.test')
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByRole('status')).toContainText(
    'reset link is on its way',
  )
  await expect(
    page.getByRole('button', { name: /Send again in/ }),
  ).toBeDisabled()
})

test('OAuth cancellation and invalid destinations are safe', async ({
  page,
}) => {
  await page.goto(
    '/auth/callback?error=access_denied&returnTo=%2Ftrips%3Fa%3D1%23top',
  )
  await expect(
    page.getByText('Sign-in was cancelled.', { exact: false }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Back to sign in' }),
  ).toHaveAttribute('href', '/auth/login?returnTo=%2Ftrips%3Fa%3D1%23top')
  await page.goto('/auth/login?returnTo=https%3A%2F%2Fevil.test')
  await expect(
    page.getByRole('link', { name: 'Close and return to the site' }),
  ).toHaveAttribute('href', '/')
})

test('token-hash recovery requires a confirmation submit; no password form without a session', async ({
  page,
}) => {
  let requests = 0
  page.on('request', request => {
    if (request.url().includes('/auth/v1/verify')) requests += 1
  })
  await page.goto(
    '/auth/confirm?token_hash=isolated-token&type=recovery&returnTo=%2Ftrips',
  )
  await expect(
    page.getByRole('button', { name: 'Continue to new password' }),
  ).toBeVisible()
  expect(requests).toBe(0)
  await page.goto('/auth/update-password?returnTo=%2Ftrips')
  await expect(
    page.getByRole('link', { name: 'Request a new reset link' }),
  ).toBeVisible()
  await expect(page.getByLabel('New password', { exact: true })).toHaveCount(0)
})

test('login and signup fit mobile/tablet/desktop in both themes without hydration errors', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error' && /hydrat/i.test(message.text()))
      errors.push(message.text())
  })
  for (const theme of ['light', 'dark']) {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
      localStorage.setItem('auth:return-to', '/admin')
    }, theme)
    for (const width of [320, 360, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const route of ['/auth/login', '/auth/sign-up']) {
        await page.goto(route)
        await expect(page.getByLabel('Email address')).toBeVisible()
        const brand = page.getByRole('link', { name: 'Mountain Club home' })
        await expect(brand).toHaveCount(1)
        await expect(brand).toHaveAttribute('href', '/')
        await expect(brand.locator('svg')).toHaveAttribute(
          'viewBox',
          '0 0 355 196',
        )
        await expect(brand.locator('svg')).toBeVisible()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true)
        expect(
          await page
            .getByLabel('Email address')
            .evaluate(element => getComputedStyle(element).fontSize),
        ).toBe('16px')
        await expect(
          page.getByRole('link', { name: 'Close and return to the site' }),
        ).toHaveAttribute('href', '/')
      }
    }
  }
  expect(errors).toEqual([])
})
