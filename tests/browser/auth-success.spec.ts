import { expect, test } from '@playwright/test'
import { mockAuthServices } from './auth-fixtures'

test.beforeEach(async ({ page }) => {
  await mockAuthServices(page)
})

for (const mode of ['login', 'sign-up']) {
  test(`${mode} preserves the password and destination, replaces history, and queues confirmation`, async ({
    page,
  }) => {
    const user = {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'member@example.test',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2026-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
      identities: [],
    }
    const encode = (value: unknown) =>
      Buffer.from(JSON.stringify(value)).toString('base64url')
    const jwt = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })}.dGVzdA`
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
    await page.route('**/auth/v1/signup**', async route => {
      expect(route.request().postDataJSON()).toMatchObject({
        password: ' a long passphrase ',
        gotrue_meta_security: { captcha_token: 'isolated-captcha-token' },
      })
      await route.fulfill({
        json: {
          access_token: jwt,
          refresh_token: 'isolated-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user,
        },
      })
    })
    await page.route(
      url =>
        url.pathname === '/trips' && url.searchParams.get('authTest') === '1',
      route =>
        route.fulfill({
          contentType: 'text/html',
          body: '<html lang="en"><body><h1>Intended destination</h1></body></html>',
        }),
    )
    await page.goto('/auth/error?reason=cancelled')
    await page.goto(
      `/auth/${mode}?returnTo=%2Ftrips%3FauthTest%3D1%23september`,
    )
    await expect(page.getByText('Security check complete')).toBeVisible()
    await page.getByLabel('Email address').fill(user.email)
    await page
      .getByLabel('Password', { exact: true })
      .fill(' a long passphrase ')
    if (mode === 'sign-up')
      await page
        .getByLabel('Confirm password', { exact: true })
        .fill(' a long passphrase ')
    await page
      .getByRole('button', {
        name: mode === 'login' ? 'Sign in' : 'Create account',
        exact: true,
      })
      .click()
    await expect(
      page.getByRole('heading', { name: 'Intended destination' }),
    ).toBeVisible()
    await expect(page).toHaveURL(
      'http://127.0.0.1:3100/trips?authTest=1#september',
    )
    expect(
      await page.evaluate(() => sessionStorage.getItem('auth:notice')),
    ).toBe(mode === 'login' ? 'signed-in' : 'created')
    await page.goBack()
    await expect(page).toHaveURL(/\/auth\/error\?reason=cancelled$/)
  })
}

for (const mode of ['login', 'sign-up']) {
  for (const provider of ['Google', 'Discord']) {
    test(`${provider} from ${mode} carries the safe destination in its callback`, async ({
      page,
    }) => {
      await page.goto(`/auth/${mode}?returnTo=%2Ftrips%3Fa%3D1%23top`)
      await page
        .getByRole('button', { name: `Continue with ${provider}` })
        .click()
      await expect(page).toHaveURL(url => url.pathname === '/auth/v1/authorize')
      const url = new URL(page.url())
      expect(url.searchParams.get('provider')).toBe(provider.toLowerCase())
      const callback = new URL(url.searchParams.get('redirect_to') ?? '')
      expect(callback.pathname).toBe('/auth/callback')
      expect(callback.searchParams.get('returnTo')).toBe('/trips?a=1#top')
    })
  }
}
