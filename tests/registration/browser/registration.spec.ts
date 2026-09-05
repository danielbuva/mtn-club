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

const users: string[] = []
const trips: string[] = []
let owner: { id: string; email: string }
let participant: { id: string; email: string }
let waiter: { id: string; email: string }
let tripId: string
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
async function account() {
  const email = `registration-${randomUUID()}@example.test`
  const result = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (result.error || !result.data.user)
    throw new Error('Local test account could not be created')
  users.push(result.data.user.id)
  return { id: result.data.user.id, email }
}
async function signIn(context: BrowserContext, user: { email: string }) {
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
    email: user.email,
    password,
    options: { captchaToken },
  })
  if (result.error) throw result.error
  // Auth and REST are separate local containers; wait until both accept the fresh token.
  await expect
    .poll(
      async () => {
        const response = await client
          .from('profiles')
          .select('user_id')
          .limit(1)
        return response.error === null
      },
      { timeout: 15000 },
    )
    .toBe(true)
}
test.beforeAll(async () => {
  owner = await account()
  participant = await account()
  waiter = await account()
  tripId = randomUUID()
  trips.push(tripId)
  const role = randomUUID()
  sql(`insert into public.admin_roles(id,key,name,is_super_admin) values('${role}','registration_browser_${role.replaceAll('-', '_')}','Registration browser admin',true) on conflict do nothing;
 insert into public.admin_user_roles(user_id,role_id) select '${owner.id}',id from public.admin_roles where is_super_admin;
 insert into public.profiles(user_id,display_name) values('${participant.id}','Registration Participant'),('${waiter.id}','Waitlisted Participant') on conflict(user_id) do update set display_name=excluded.display_name;
 insert into public.account_age_declarations(user_id,is_18_or_older) values('${participant.id}',true),('${waiter.id}',true);
 begin; set local "request.jwt.claim.sub"='${owner.id}';
 insert into public.trips(id,title,starts_at,ends_at,capacity,created_by) values('${tripId}','RSVP browser acceptance',now()+interval '2 days',now()+interval '3 days',1,'${owner.id}');
 select public.set_registration_enabled(true);
 select public.save_registration_settings('${tripId}',0,'{"enabled":true,"eligibility":"account","emergencyRequired":true,"waiverRequired":true,"waiverTitle":"Browser fixture waiver","waiverBody":"Synthetic acceptance-test document only.","questions":[{"id":"experience","label":"Experience","type":"text","required":true}],"capacity":1,"waitlistEnabled":true,"deadline":null,"offerHours":24}'); commit;`)
})
test.afterAll(async () => {
  // Only synthetic fixtures in the fixed local sandbox. Production is never accepted.
  if (trips.length)
    sql(`begin; set local session_replication_role=replica;
 ${['registration_notifications', 'registration_requests', 'registration_offers', 'registration_events', 'registration_signatures', 'registration_guardian_evidence', 'registration_guardian_reviews', 'registration_responses', 'trip_attendance', 'trip_rsvps', 'trip_registration_settings', 'registration_waivers'].map(table => `delete from public.${table} where trip_id in (${trips.map(id => `'${id}'`).join(',')});`).join('\n')}
 delete from public.trips where id in (${trips.map(id => `'${id}'`).join(',')}); update public.club_admin_settings set registration_enabled=false; commit;`)
  for (const id of users) await admin.auth.admin.deleteUser(id)
})
async function completeForm(
  page: import('@playwright/test').Page,
  waiverComplete = false,
) {
  const form = page.getByRole('main')
  await form
    .getByLabel('Experience *', { exact: true })
    .fill('Test hiking experience')
  await form.getByLabel('Name', { exact: true }).fill('Test contact')
  await form.getByLabel('Relationship', { exact: true }).fill('Friend')
  await form.getByLabel('Phone', { exact: true }).fill('5551234567')
  await form.getByLabel('I confirm this emergency contact').check()
  if (!waiverComplete) {
    await form.getByLabel('I have read and agree').check()
    await form.getByLabel('Full name as signature').fill('Test Participant')
  }
}
test('register, waitlist, organizer offer, and acceptance through real sessions', async ({
  browser,
}) => {
  const memberContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  })
  const waitingContext = await browser.newContext()
  const organizerContext = await browser.newContext()
  await signIn(memberContext, participant)
  await signIn(waitingContext, waiter)
  await signIn(organizerContext, owner)
  const member = await memberContext.newPage()
  const waiting = await waitingContext.newPage()
  const organizer = await organizerContext.newPage()
  await member.goto(`/trips/${tripId}/rsvp`)
  await expect(
    member.getByRole('heading', { name: 'RSVP browser acceptance' }),
  ).toBeVisible()
  await completeForm(member)
  await member
    .getByRole('button', { name: 'Register for trip', exact: true })
    .click()
  await expect(
    member
      .getByRole('region', { name: 'Registration status', exact: true })
      .getByText('confirmed', { exact: true }),
  ).toBeVisible()
  await member.screenshot({
    path: '/tmp/mtn-registration-mobile.png',
    fullPage: true,
  })
  await waiting.goto(`/trips/${tripId}/rsvp`)
  await completeForm(waiting)
  await waiting
    .getByRole('button', { name: 'Join waitlist', exact: true })
    .click()
  await expect(
    waiting
      .getByRole('region', { name: 'Registration status', exact: true })
      .getByText('waitlisted', { exact: true }),
  ).toBeVisible()
  member.on('dialog', dialog => dialog.accept())
  await member
    .getByRole('button', { name: 'Cancel registration', exact: true })
    .click()
  await expect(
    member
      .getByRole('region', { name: 'Registration status', exact: true })
      .getByText('cancelled', { exact: true }),
  ).toBeVisible()
  await organizer.goto(`/admin/trips/${tripId}/registrations`)
  await expect(
    organizer.getByRole('heading', {
      name: 'Waitlisted Participant',
      exact: true,
    }),
  ).toBeVisible()
  await organizer
    .getByRole('button', { name: 'Offer a seat', exact: true })
    .click()
  await expect(
    organizer
      .locator('article')
      .filter({
        has: organizer.getByRole('heading', {
          name: 'Waitlisted Participant',
          exact: true,
        }),
      })
      .getByText('offered', { exact: true })
      .first(),
  ).toBeVisible()
  await waiting.reload()
  sql(
    `update public.registration_offers set expires_at=now()-interval '1 second' where trip_id='${tripId}' and user_id='${waiter.id}' and status='pending'`,
  )
  await waiting.reload()
  await expect(
    waiting
      .getByRole('region', { name: 'Registration status', exact: true })
      .getByText('waitlisted', { exact: true }),
  ).toBeVisible()
  await organizer
    .getByRole('button', { name: 'Refresh roster', exact: true })
    .click()
  await organizer
    .getByRole('button', { name: 'Offer a seat', exact: true })
    .click()
  await expect(
    organizer.getByRole('button', { name: 'Revoke offer', exact: true }),
  ).toBeVisible()
  await waiting.reload()
  await waiting
    .getByRole('button', { name: 'Accept seat offer', exact: true })
    .click()
  await expect(
    waiting
      .getByRole('region', { name: 'Registration status', exact: true })
      .getByText('confirmed', { exact: true }),
  ).toBeVisible()
  await waiting.goto('/profile/trips')
  await expect(
    waiting.getByRole('heading', { name: 'RSVP browser acceptance' }),
  ).toBeVisible()
  const exportResponse = await organizerContext.request.get(
    `/trips/${tripId}/registrations/export`,
  )
  expect(exportResponse.status()).toBe(200)
  expect(await exportResponse.text()).toContain('Waitlisted Participant')
  const denied = await waitingContext.request.get(
    `/trips/${tripId}/registrations/export`,
  )
  expect(denied.status()).toBe(403)
  await organizer.screenshot({
    path: '/tmp/mtn-registration-roster.png',
    fullPage: true,
  })
  await memberContext.close()
  await waitingContext.close()
  await organizerContext.close()
})
test('anonymous registration preserves the return destination and worker endpoints reject callers', async ({
  page,
  request,
}) => {
  await page.goto(`/trips/${tripId}/rsvp`)
  await expect(page).toHaveURL(new RegExp(`/auth/login\\?returnTo=.*${tripId}`))
  expect(
    (await request.post('/api/internal/registration/process')).status(),
  ).toBe(401)
  expect(
    (await request.get('/api/internal/registration/process')).status(),
  ).toBe(405)
})

test('a minor requests guardian review and registers only after an officer confirms it', async ({
  browser,
}) => {
  const minor = await account()
  sql(`insert into public.profiles(user_id,display_name) values('${minor.id}','Minor Participant') on conflict(user_id) do update set display_name=excluded.display_name;
  insert into public.account_age_declarations(user_id,is_18_or_older) values('${minor.id}',false);`)
  const memberContext = await browser.newContext()
  const officerContext = await browser.newContext()
  await signIn(memberContext, minor)
  await signIn(officerContext, owner)
  const member = await memberContext.newPage()
  const officer = await officerContext.newPage()
  await member.goto(`/trips/${tripId}/rsvp`)
  await expect(
    member.getByRole('button', { name: /^(Join waitlist|Register for trip)$/ }),
  ).toBeDisabled()
  await member.getByRole('button', { name: 'Request guardian review' }).click()
  await expect(
    member.getByText('Registration updated.', { exact: true }),
  ).toBeVisible()
  await officer.goto('/admin/membership/trip-guardian-reviews')
  await expect(
    officer.getByRole('heading', {
      name: 'Minor Participant · RSVP browser acceptance',
    }),
  ).toBeVisible()
  await officer
    .getByLabel('Verified consent evidence or reference')
    .fill('Verified synthetic consent for this test waiver')
  await officer
    .getByLabel('Parent or legal guardian’s full name')
    .fill('Synthetic Parent')
  await officer
    .getByLabel('Date signed by the parent or guardian')
    .fill('2026-09-01')
  await officer
    .getByLabel('Retained document reference')
    .fill('test-fixture:parent-consent')
  await officer.getByLabel('I verified the signer').check()
  await officer
    .getByRole('button', { name: 'Confirm guardian consent', exact: true })
    .click()
  await expect(
    officer.getByText('No trip guardian reviews are waiting.'),
  ).toBeVisible()
  await member.reload()
  await completeForm(member, true)
  await member
    .getByRole('button', { name: /^(Join waitlist|Register for trip)$/ })
    .focus()
  await member.keyboard.press('Enter')
  await expect(
    member
      .getByRole('region', { name: 'Registration status', exact: true })
      .getByText(/^(waitlisted|confirmed)$/),
  ).toBeVisible()
  await memberContext.close()
  await officerContext.close()
})
