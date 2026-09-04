import { expect, type Page, test } from '@playwright/test'
import { fillLogin, mockAuthServices } from './auth-fixtures'

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'member@example.test',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: '2026-01-01T00:00:00Z',
}
async function login(page: Page, destination: string) {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  const jwt = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, session_id: 'ordinary-password-session', exp: Math.floor(Date.now() / 1000) + 3600, amr: [{ method: 'password', timestamp: Math.floor(Date.now() / 1000) }] })}.dGVzdA`
  await page.route('**/auth/v1/token**', route =>
    route.fulfill({
      json: {
        access_token: jwt,
        refresh_token: 'isolated-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user,
      },
    }),
  )
  await page.goto(`/auth/login?returnTo=${encodeURIComponent(destination)}`)
  await fillLogin(page)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(`http://127.0.0.1:3100${destination}`)
}

test.beforeEach(async ({ page }) => {
  await mockAuthServices(page)
})

test('account settings bind linking to the current user and handle cancellation and success', async ({
  page,
  request,
}) => {
  await request.post('http://127.0.0.1:54399/test/reset-identities')
  await login(page, '/profile/user/account')
  const methods = page.getByRole('region', {
    name: 'One account. Your choice of sign-in.',
  })
  await expect(methods.getByText('Not connected')).toHaveCount(2)
  await page
    .getByRole('button', { name: 'Connect Discord', exact: true })
    .click()
  await expect(page).toHaveURL(url => url.pathname === '/auth/v1/authorize')
  const cancel = new URL(
    new URL(page.url()).searchParams.get('redirect_to') ?? '',
  )
  cancel.searchParams.set('error', 'access_denied')
  await page.goto(cancel.toString())
  await expect(
    page.getByText('Connection cancelled.', { exact: true }),
  ).toBeVisible()
  await expect(methods.getByText('Not connected')).toHaveCount(2)
  await page
    .getByRole('button', { name: 'Connect Google', exact: true })
    .click()
  await expect(page).toHaveURL(url => url.pathname === '/auth/v1/authorize')
  const success = new URL(
    new URL(page.url()).searchParams.get('redirect_to') ?? '',
  )
  success.searchParams.set('code', 'isolated-link-google')
  await page.goto(success.toString())
  await expect(
    page.getByText('Google is connected.', { exact: true }),
  ).toBeVisible()
  await expect(
    methods.getByRole('button', { name: 'Connected', exact: true }),
  ).toBeDisabled()
  await expect(
    methods.getByRole('link', { name: 'Set or reset password' }),
  ).toHaveAttribute(
    'href',
    '/auth/forgot-password?returnTo=%2Fprofile%2Fuser%2Faccount%23sign-in-methods',
  )
  await expect(methods).toContainText(
    'verify ownership and review both accounts',
  )
  await page.setViewportSize({ width: 320, height: 740 })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: 'test-results/auth-methods-mobile.png',
    fullPage: true,
  })
  await request.post('http://127.0.0.1:54399/test/reset-identities')
})

test('membership signup uses the shared protected authentication journey', async ({
  page,
}) => {
  await page.goto('/membership-sign-up')
  await expect(page).toHaveURL(
    'http://127.0.0.1:3100/auth/sign-up?returnTo=%2Fmembership-sign-up',
  )
  await expect(
    page.getByRole('button', { name: 'Continue with Google' }),
  ).toBeVisible()
  await expect(page.getByText('Security check complete')).toBeVisible()
})

test('a signed-in arrival offers dismissible methods without losing the destination', async ({
  page,
}) => {
  await login(page, '/coming-soon?source=auth-test#top')
  await expect(
    page.getByText('Welcome back. You’re signed in.', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Sign-in options' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Close toast' }).click()
  await expect(
    page.getByRole('button', { name: 'Sign-in options' }),
  ).toHaveCount(0)
  await expect(page).toHaveURL(
    'http://127.0.0.1:3100/coming-soon?source=auth-test#top',
  )
})

test('ordinary sign-in and forged recovery receipts cannot open the password form', async ({
  page,
}) => {
  await login(page, '/coming-soon')
  await page.goto('/auth/update-password?flow=recovery')
  await expect(page.getByLabel('New password', { exact: true })).toHaveCount(0)
  await page.context().addCookies([
    {
      name: 'mc-auth-password',
      value: 'forged',
      domain: '127.0.0.1',
      path: '/',
    },
  ])
  await page.reload()
  await expect(
    page.getByRole('link', { name: 'Request a new reset link' }),
  ).toBeVisible()
})

test('link callbacks require a real pending connection, not success query flags', async ({
  page,
}) => {
  await page.goto(
    '/auth/callback?flow=link&provider=google&code=forged&oauthLinked=1',
  )
  await expect(
    page.getByText('This connection request expired', { exact: false }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Review sign-in methods' }),
  ).toHaveAttribute('href', '/profile/user/account#sign-in-methods')
  await expect(
    page.getByText('Google is connected.', { exact: true }),
  ).toHaveCount(0)
})

test('signup inbox state is non-enumerating and preserves resend destination', async ({
  page,
}) => {
  await page.clock.install()
  await page.route('**/auth/v1/signup**', route =>
    route.fulfill({ json: user }),
  )
  await page.route('**/auth/v1/resend**', async route => {
    expect(
      route.request().postDataJSON().gotrue_meta_security.captcha_token,
    ).toBe('isolated-captcha-token')
    const callback = new URL(
      new URL(route.request().url()).searchParams.get('redirect_to') ?? '',
    )
    expect(callback.searchParams.get('returnTo')).toBe('/trips?a=1#top')
    await route.fulfill({ json: {} })
  })
  await page.goto('/auth/sign-up?returnTo=%2Ftrips%3Fa%3D1%23top')
  await expect(page.getByText('Security check complete')).toBeVisible()
  await page.getByLabel('Email address').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill('a long passphrase')
  await page
    .getByLabel('Confirm password', { exact: true })
    .fill('a long passphrase')
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click()
  await expect(page.getByRole('status')).toContainText(
    'If this address can be registered',
  )
  await expect(
    page.getByRole('button', { name: /Send again in/ }),
  ).toBeDisabled()
  await page.clock.fastForward(61_000)
  await page.getByRole('button', { name: 'Resend confirmation email' }).click()
  await expect(
    page.getByText('Email requested. Give it a minute to arrive.'),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Back to sign in' }),
  ).toHaveAttribute('href', '/auth/login?returnTo=%2Ftrips%3Fa%3D1%23top')
})
