import { expect, test } from '@playwright/test'
import { createServerClient } from '@supabase/ssr'

const creator = '00000000-0000-4000-8000-000000000001'
const tripId = (suffix: string) => `00000000-0000-4000-8000-0000000000${suffix}`

test.beforeEach(async ({ context, request }) => {
  await request.get('http://127.0.0.1:54399/test/reset-trip-edits')
  const client = createServerClient(
    'http://127.0.0.1:54399',
    'isolated-browser-test-key',
    {
      cookies: {
        getAll: () => [],
        setAll: async cookies => {
          await context.addCookies(
            cookies.map(cookie => ({
              name: cookie.name,
              value: cookie.value,
              url: 'http://127.0.0.1:3100',
            })),
          )
        },
      },
    },
  )
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: creator, exp: Math.floor(Date.now() / 1000) + 3600 })}.dGVzdA`
  const { error } = await client.auth.setSession({
    access_token: token,
    refresh_token: 'isolated-refresh',
  })
  if (error) throw error
})

for (const suffix of ['60', '61']) {
  test(`member creator edits an unofficial trip ${suffix === '61' ? 'with' : 'without'} a cover image`, async ({
    page,
  }) => {
    const path = `/trips/${tripId(suffix)}`
    await page.goto(path)
    await page.getByRole('link', { name: 'Edit', exact: true }).click()
    await expect(page).toHaveURL(`${path}?edit=1`)
    await expect(
      page.getByRole('button', { name: 'Save trip details' }),
    ).toBeVisible()
    await expect(
      page.getByText('Public host credits', { exact: true }),
    ).toHaveCount(0)
    await expect(
      page.getByText('Linked account leaders', { exact: true }),
    ).toHaveCount(0)
    await expect(page.getByText('Trip status', { exact: true })).toHaveCount(0)
    await expect(
      page.getByRole('button', {
        name: /Cancel trip|Delete trip|Edit cancellation/,
      }),
    ).toHaveCount(0)
    await page.getByRole('button', { name: 'HIKING', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'camping', exact: true }),
    ).toBeVisible()
    await expect(page.getByPlaceholder('Add tag')).toHaveCount(0)
    await page.getByRole('button', { name: 'camping', exact: true }).click()
    await page
      .getByRole('textbox', { name: 'Trip title', exact: true })
      .fill('Updated community trip')
    await page.getByRole('button', { name: 'Save trip details' }).click()
    await expect(page).toHaveURL(path)
    await expect(
      page.getByRole('heading', { name: 'Updated community trip' }),
    ).toBeVisible()
  })
}

test('ordinary member cannot enter the editor for an official trip or another creator', async ({
  page,
}) => {
  for (const suffix of ['62', '63']) {
    await page.goto(`/trips/${tripId(suffix)}?edit=1`)
    await expect(
      page.getByRole('heading', { name: 'Community edit fixture' }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Edit', exact: true }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Save trip details' }),
    ).toHaveCount(0)
  }
})
