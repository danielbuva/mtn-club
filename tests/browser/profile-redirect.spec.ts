import { expect, test } from '@playwright/test'
import { fillLogin, mockAuthServices } from './auth-fixtures'

test('password sign-in returns to the protected profile page', async ({
  page,
}) => {
  await mockAuthServices(page)
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
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })}.dGVzdA`
  await page.route('**/auth/v1/token**', route =>
    route.fulfill({
      json: {
        access_token: token,
        refresh_token: 'isolated-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user,
      },
    }),
  )
  await page.goto('/profile')
  await fillLogin(page)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/profile\/settings$/)
  await expect(
    page.getByRole('heading', { name: 'Settings', exact: true }),
  ).toBeVisible()
})

for (const destination of [
  '/profile',
  '/profile/settings?from=redirect-test',
]) {
  test(`signed-out ${destination} preserves its destination`, async ({
    page,
  }) => {
    await mockAuthServices(page)
    await page.goto(destination)
    await expect(page).toHaveURL(
      url =>
        url.pathname === '/auth/login' &&
        url.searchParams.get('returnTo')?.startsWith('/profile') === true,
    )
    const returnTo = new URL(page.url()).searchParams.get('returnTo')
    if (destination !== '/profile') expect(returnTo).toBe(destination)
    await page.getByRole('button', { name: 'Continue with Google' }).click()
    await expect(page).toHaveURL(url => url.pathname === '/auth/v1/authorize')
    const callback = new URL(
      new URL(page.url()).searchParams.get('redirect_to') ?? '',
    )
    expect(callback.searchParams.get('returnTo')).toBe(returnTo)
  })
}
