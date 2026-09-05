import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { type BrowserContext, expect, test } from '@playwright/test'
import { createServerClient } from '@supabase/ssr'
import {
  admin,
  captchaToken,
  password,
  status,
} from '../../integration/auth-services.mjs'

const tripId = randomUUID()
let userId: string
const email = `trip-lifecycle-${randomUUID()}@example.test`
function sql(query: string) {
  return execFileSync(
    'docker',
    [
      'exec',
      '-i',
      'supabase_db_mtn-auth-integration',
      'psql',
      '-U',
      'supabase_admin',
      '-d',
      'postgres',
      '-X',
      '-qAt',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: query, encoding: 'utf8' },
  ).trim()
}
async function signIn(context: BrowserContext) {
  const client = createServerClient(status.API_URL, status.ANON_KEY, {
    cookies: {
      getAll: async () =>
        (await context.cookies()).map(cookie => ({
          name: cookie.name,
          value: cookie.value,
        })),
      setAll: async cookies => {
        await context.addCookies(
          cookies.map(cookie => ({
            name: cookie.name,
            value: cookie.value,
            url: 'http://127.0.0.1:3140',
            sameSite: 'Lax',
          })),
        )
      },
    },
  })
  const result = await client.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  })
  if (result.error) throw result.error
  await expect
    .poll(async () => {
      const check = await client
        .from('admin_user_roles')
        .select('role_id, admin_roles(name)')
      return check.error?.message ?? 'ready'
    })
    .toBe('ready')
}

test.beforeAll(async () => {
  const result = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (result.error || !result.data.user)
    throw new Error('Unable to create local test account')
  userId = result.data.user.id
  sql(`insert into public.admin_user_roles(user_id,role_id) select '${userId}',id from public.admin_roles where is_super_admin;
    insert into public.trips(id,title,starts_at,ends_at,created_by,visibility,is_official) values ('${tripId}','Lifecycle browser fixture','2026-09-06T12:00:00-07:00','2026-09-06T18:00:00-07:00','${userId}','public',true);`)
})
test.afterAll(async () => {
  sql(
    `begin; set local session_replication_role=replica; delete from public.trip_registration_settings where trip_id='${tripId}'; delete from public.trips where id='${tripId}'; delete from public.admin_user_roles where user_id='${userId}'; commit;`,
  )
  if (userId) await admin.auth.admin.deleteUser(userId)
})

test('cancel with a reason from admin, edit the reason on trips, then delete without losing the record', async ({
  page,
  context,
  browser,
}) => {
  await signIn(context)
  await page.goto('/admin/trips?q=Lifecycle%20browser%20fixture&timing=all')
  await page.getByRole('button', { name: 'Cancel trip', exact: true }).click()
  let dialog = page.getByRole('dialog')
  await dialog.getByLabel('Reason (optional)').fill('Canceled due to rain.')
  await dialog.getByRole('button', { name: 'Cancel trip', exact: true }).click()
  await expect(dialog).toBeHidden()
  expect(
    sql(
      `select lifecycle_status||':'||cancellation_reason from public.trips where id='${tripId}'`,
    ),
  ).toBe('canceled:Canceled due to rain.')

  const visitor = await browser.newPage({
    viewport: { width: 390, height: 844 },
  })
  await visitor.goto(`/trips/${tripId}`)
  await expect(
    visitor
      .getByRole('main')
      .getByText('Canceled due to rain.', { exact: true }),
  ).toBeVisible()
  await expect(
    visitor.getByRole('link', { name: 'RSVP', exact: true }),
  ).toHaveCount(0)
  await expect(
    visitor.getByRole('button', { name: 'Delete trip', exact: true }),
  ).toHaveCount(0)
  await visitor.goto('/trips')
  await expect(
    visitor.getByRole('link', {
      name: 'Open details for Lifecycle browser fixture',
      exact: true,
    }),
  ).toBeVisible()
  await visitor.goto('/schedule')
  await expect(
    visitor
      .getByRole('main')
      .getByText('Canceled due to rain.', { exact: true }),
  ).toBeVisible()
  await visitor.screenshot({
    path: '/tmp/mtn-canceled-schedule.png',
    fullPage: true,
  })

  await page.goto(`/trips/${tripId}?edit=1`)
  await page
    .getByRole('button', { name: 'Edit cancellation', exact: true })
    .click()
  dialog = page.getByRole('dialog')
  await dialog.getByLabel('Reason (optional)').fill('Rain and wet rock.')
  await dialog.getByRole('button', { name: 'Cancel trip', exact: true }).click()
  await expect(dialog).toBeHidden()
  expect(
    sql(`select cancellation_reason from public.trips where id='${tripId}'`),
  ).toBe('Rain and wet rock.')
  await page.getByRole('button', { name: 'Delete trip', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete trip', exact: true })
    .click()
  await expect(page).toHaveURL(/\/trips$/)
  expect(
    sql(`select lifecycle_status from public.trips where id='${tripId}'`),
  ).toBe('archived')
  await visitor.goto('/trips')
  await expect(
    visitor.getByRole('link', {
      name: 'Open details for Lifecycle browser fixture',
      exact: true,
    }),
  ).toHaveCount(0)
  await visitor.goto(`/trips/${tripId}`)
  await expect(
    visitor.getByRole('heading', { name: 'Trip not found', exact: true }),
  ).toBeVisible()
  await visitor.close()
})
