import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { type BrowserContext, expect, test } from '@playwright/test'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import {
  createUnlvWaiver,
  unlvWaiverSource,
} from '../../../lib/registration/unlv-waiver'
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
const parityHost = randomUUID()
const parityTag = `parity-${randomUUID()}`
const realWaiver = createUnlvWaiver(
  'RSVP browser acceptance',
  'Synthetic test date',
  'Uneven terrain, falls, heat exposure, dehydration, and injuries during hiking.',
)
const sqlLiteral = (value: string) => `'${value.replaceAll("'", "''")}'`
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
 insert into public.memberships(user_id,status) values('${owner.id}','active') on conflict(user_id) do update set status='active';
 insert into public.club_hosts(id,public_name,club_title,is_active) values('${parityHost}','Parity Host','Trip Leader',true);
 insert into public.trip_tag_options(tag) values('${parityTag}');
 insert into public.profiles(user_id,display_name) values('${owner.id}','Test Organizer'),('${participant.id}','Registration Participant'),('${waiter.id}','Waitlisted Participant') on conflict(user_id) do update set display_name=excluded.display_name;
 insert into public.account_age_declarations(user_id,is_18_or_older) values('${participant.id}',true),('${waiter.id}',true);
 begin; set local "request.jwt.claim.sub"='${owner.id}';
 insert into public.trips(id,title,starts_at,ends_at,capacity,created_by) values('${tripId}','RSVP browser acceptance',now()+interval '2 days',now()+interval '3 days',1,'${owner.id}');
 select public.set_registration_enabled(true);
 select public.save_registration_settings('${tripId}',0,${sqlLiteral(
   JSON.stringify({
     enabled: true,
     eligibility: 'account',
     emergencyRequired: true,
     waiverRequired: true,
     waiverTitle: 'UNLV RSO waiver — browser test',
     waiverBody: realWaiver,
     waiverSourceUrl: unlvWaiverSource,
     questions: [
       { id: 'experience', label: 'Experience', type: 'text', required: true },
       {
         id: 'experience_level',
         label: 'Experience level',
         type: 'single',
         required: true,
         options: ['Some experience', 'First time'],
       },
       {
         id: 'ready',
         label: 'Prepared for this trip?',
         type: 'boolean',
         required: true,
       },
       {
         id: 'gear',
         label: 'Which gear are you bringing?',
         type: 'multiple',
         required: true,
         options: ['Water', 'Boots', 'Poles'],
       },
     ],
     capacity: 1,
     waitlistEnabled: true,
     deadline: null,
     offerHours: 24,
   }),
 )}); commit;`)
})
test.afterAll(async () => {
  // Include partially published synthetic trips so failures do not leak fixtures.
  if (owner) {
    const published = sql(
      `select id from public.trips where created_by='${owner.id}'`,
    )
    for (const id of published.split('\n').filter(Boolean)) {
      if (!trips.includes(id)) trips.push(id)
    }
  }
  // Only synthetic fixtures in the fixed local sandbox. Production is never accepted.
  if (trips.length)
    sql(`begin; set local session_replication_role=replica;
 ${['trip_hosts', 'trip_leaders', 'trip_private', 'registration_notifications', 'registration_requests', 'registration_offers', 'registration_events', 'registration_signatures', 'registration_guardian_evidence', 'registration_guardian_reviews', 'registration_responses', 'trip_attendance', 'trip_rsvps', 'trip_registration_settings', 'registration_waivers'].map(table => `delete from public.${table} where trip_id in (${trips.map(id => `'${id}'`).join(',')});`).join('\n')}
 delete from public.trips where id in (${trips.map(id => `'${id}'`).join(',')}); update public.club_admin_settings set registration_enabled=false; commit;`)
  sql(
    `delete from public.club_hosts where id='${parityHost}'; delete from public.trip_tag_options where tag='${parityTag}';`,
  )
  for (const id of users) await admin.auth.admin.deleteUser(id)
})
async function completeForm(
  page: import('@playwright/test').Page,
  waiverComplete = false,
) {
  const form = page.getByRole('main')
  await expect(form.locator('[data-guided-form]')).toHaveAttribute(
    'data-ready',
    'true',
  )
  await form
    .getByLabel('Experience', { exact: true })
    .fill('Test hiking experience')
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form
    .getByRole('radio', { name: 'Some experience', exact: true })
    .check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByRole('radio', { name: 'Yes', exact: true }).check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByRole('checkbox', { name: 'Water', exact: true }).check()
  await form.getByRole('checkbox', { name: 'Boots', exact: true }).check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByLabel('Name', { exact: true }).fill('Test contact')
  await form.getByLabel('Relationship', { exact: true }).fill('Friend')
  await form.getByLabel('Phone', { exact: true }).fill('5551234567')
  await form.getByLabel('I confirm this emergency contact').check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  if (!waiverComplete) {
    await form.getByRole('button', { name: 'Read full waiver' }).click()
    const reader = page.getByRole('dialog')
    await reader
      .getByRole('region', { name: 'Full waiver document' })
      .evaluate(element => {
        element.scrollTop = element.scrollHeight
      })
    await reader.getByRole('button', { name: 'Return to form' }).click()
    await expect(form.getByLabel(/— initials$/)).toHaveCount(7)
    const initials = await form.getByLabel(/— initials$/).all()
    expect(initials).toHaveLength(7)
    for (const field of initials) await field.fill('TP')
    await form
      .getByLabel('Your phone number', { exact: true })
      .fill('5550101234')
    await form
      .getByLabel('Your local address', { exact: true })
      .fill('123 Synthetic Street')
    await form
      .getByLabel('Emergency contact address', { exact: true })
      .fill('456 Synthetic Street')
    await form
      .getByLabel('Your date of birth', { exact: true })
      .fill('1990-01-01')
    await form.getByLabel('I have read and agree').check()
    await form.getByLabel('Full name as signature').fill('Test Participant')
  }
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByRole('switch', { name: 'Email me trip updates' }).check()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
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
  await member.goto('/trips')
  const tripCard = member.getByRole('link', {
    name: 'Open details for RSVP browser acceptance',
    exact: true,
  })
  const initialButtonHeight = await tripCard
    .getByRole('button', { name: 'RSVP', exact: true })
    .evaluate(node => node.getBoundingClientRect().height)
  await tripCard.getByRole('button', { name: 'RSVP', exact: true }).click()
  await expect(
    tripCard.getByRole('button', { name: 'Going', exact: true }),
  ).toBeEnabled()
  expect(
    await tripCard
      .getByRole('button', { name: 'Going', exact: true })
      .evaluate(node => node.getBoundingClientRect().height),
  ).toBe(initialButtonHeight)
  await member.setViewportSize({ width: 320, height: 844 })
  await tripCard.scrollIntoViewIfNeeded()
  await member.screenshot({ path: '/tmp/mtn-rsvp-choices-mobile.png' })
  expect(
    await member.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false)
  await tripCard
    .getByRole('button', { name: 'Close RSVP options', exact: true })
    .click()
  await expect(
    tripCard.getByRole('button', { name: 'RSVP', exact: true }),
  ).toBeFocused()
  await tripCard.getByRole('button', { name: 'RSVP', exact: true }).click()
  await tripCard.getByRole('button', { name: 'Maybe', exact: true }).click()
  await expect(
    tripCard.getByRole('button', { name: 'Close RSVP options', exact: true }),
  ).toHaveCount(0)
  await member.goto(`/trips/${tripId}`)
  const bottomControls = member.getByRole('navigation', {
    name: 'Page actions',
    exact: true,
  })
  await expect(
    bottomControls.getByRole('button', { name: 'Maybe', exact: true }),
  ).toBeVisible()
  const controlsHeight = await bottomControls.evaluate(
    node => node.getBoundingClientRect().height,
  )
  await bottomControls
    .getByRole('button', { name: 'Maybe', exact: true })
    .click()
  await expect(
    bottomControls.getByRole('button', { name: 'Going', exact: true }),
  ).toBeEnabled()
  await expect(
    bottomControls.getByRole('button', { name: '← back', exact: true }),
  ).toHaveCount(0)
  expect(
    await bottomControls.evaluate(node => node.getBoundingClientRect().height),
  ).toBe(controlsHeight)
  await expect(
    member.getByRole('button', { name: 'Open navigation', exact: true }),
  ).toHaveCount(0)
  expect(
    await bottomControls.evaluate(node => {
      const box = node.getBoundingClientRect()
      return Math.abs(box.x + box.width / 2 - innerWidth / 2) < 1
    }),
  ).toBe(true)
  await member.screenshot({ path: '/tmp/mtn-detail-rsvp-options-mobile.png' })
  const closeOptions = bottomControls.getByRole('button', {
    name: 'Close RSVP options',
    exact: true,
  })
  expect(
    await closeOptions.evaluate(node => {
      const box = node.getBoundingClientRect()
      return node.contains(
        document.elementFromPoint(
          box.x + box.width / 2,
          box.y + box.height / 2,
        ),
      )
    }),
  ).toBe(true)
  await closeOptions.click()
  await expect(
    member.getByRole('button', { name: 'Open navigation', exact: true }),
  ).toBeVisible()
  await expect(
    bottomControls.getByRole('button', { name: '← back', exact: true }),
  ).toBeVisible()
  await bottomControls
    .getByRole('button', { name: 'Maybe', exact: true })
    .click()
  await bottomControls
    .getByRole('button', { name: 'Not going', exact: true })
    .click()
  await expect(
    bottomControls.getByRole('button', { name: '← back', exact: true }),
  ).toBeVisible()
  await expect(
    bottomControls.getByRole('button', { name: 'Not going', exact: true }),
  ).toBeVisible()
  expect(
    await bottomControls.evaluate(node => node.getBoundingClientRect().height),
  ).toBe(controlsHeight)
  await member.goto('/trips')
  await tripCard.getByRole('button', { name: 'Not going', exact: true }).click()
  await tripCard.getByRole('button', { name: 'Maybe', exact: true }).click()
  await expect(
    tripCard.getByRole('button', { name: 'Close RSVP options', exact: true }),
  ).toHaveCount(0)
  await tripCard.getByRole('button', { name: 'Maybe', exact: true }).click()
  await tripCard.getByRole('button', { name: 'Not going', exact: true }).click()
  await expect(
    tripCard.getByRole('button', { name: 'Close RSVP options', exact: true }),
  ).toHaveCount(0)
  await tripCard.getByRole('button', { name: 'Not going', exact: true }).click()
  await tripCard.getByRole('button', { name: 'Going', exact: true }).click()
  await expect(member.getByRole('alertdialog')).toContainText(
    'Complete the following form by',
  )
  await expect(member.getByRole('alertdialog')).toContainText(
    /P[DS]T to confirm your spot\./,
  )
  await expect(member.getByRole('alertdialog')).not.toContainText(
    'America/Los_Angeles',
  )
  await member.screenshot({ path: '/tmp/mtn-signup-dialog-mobile.png' })
  await member.route('**/trips', async route => {
    if (route.request().method() === 'POST')
      await new Promise(resolve => setTimeout(resolve, 800))
    await route.continue()
  })
  await member
    .getByRole('button', { name: 'Save for later', exact: true })
    .click()
  await expect(
    member
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Saving…', exact: true }),
  ).toBeVisible()
  await expect(
    member
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Complete form', exact: true }),
  ).toBeVisible()
  await expect(member.getByRole('alertdialog')).toHaveCount(0)
  await member.unroute('**/trips')
  await expect(member).toHaveURL('/trips')
  await member.goto(`/trips/${tripId}`)
  await expect(member).toHaveURL(`/trips/${tripId}`)
  await expect(
    member.getByRole('link', { name: 'Finish signup', exact: true }),
  ).toBeVisible()
  await organizer.goto(`/trips/${tripId}/registrations`)
  await expect(
    organizer.getByText('Signup incomplete', { exact: true }),
  ).toBeVisible()
  await organizer
    .getByRole('main')
    .getByText('Registration settings', { exact: true })
    .click()
  await organizer
    .getByLabel('Registration', { exact: true })
    .selectOption('closed')
  await organizer
    .getByRole('button', { name: 'Save settings', exact: true })
    .click()
  await expect(
    organizer
      .getByRole('main')
      .getByText('Registration settings saved.', { exact: true }),
  ).toBeVisible()
  await member.reload()
  await expect(
    member.getByRole('navigation', { name: 'Page actions', exact: true }),
  ).toContainText('Registration closed')
  await expect(
    member.getByRole('link', { name: 'Finish signup', exact: true }),
  ).toHaveCount(0)
  await organizer.reload()
  await organizer
    .getByRole('main')
    .getByText('Registration settings', { exact: true })
    .click()
  await organizer
    .getByLabel('Registration', { exact: true })
    .selectOption('open')
  await organizer
    .getByRole('button', { name: 'Save settings', exact: true })
    .click()
  await expect
    .poll(() =>
      sql(
        `select enabled from public.trip_registration_settings where trip_id='${tripId}'`,
      ),
    )
    .toBe('t')
  await member.reload()
  await member.getByRole('link', { name: 'Finish signup', exact: true }).click()
  await member
    .getByLabel('Experience', { exact: true })
    .fill('Saved draft experience')
  await member
    .getByRole('button', { name: 'Save and finish later', exact: true })
    .click()
  await expect(member).toHaveURL(`/trips/${tripId}`)
  await member.getByRole('link', { name: 'Finish signup', exact: true }).click()
  await expect(member.getByLabel('Experience', { exact: true })).toHaveValue(
    'Saved draft experience',
  )
  await completeForm(member)
  await member
    .getByRole('button', { name: 'Confirm Going', exact: true })
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
  await waiting.getByRole('button', { name: 'Going', exact: true }).click()
  await waiting
    .getByRole('button', { name: 'Complete form', exact: true })
    .click()
  const signed = z
    .object({
      body: z.string(),
      source: z.string(),
      name: z.string(),
      details: z.object({ initials: z.array(z.string()) }).passthrough(),
    })
    .parse(
      JSON.parse(
        sql(
          `select json_build_object('body',w.body,'source',w.source_url,'details',s.signer_details,'name',s.signature_name) from public.registration_signatures s join public.registration_waivers w on w.id=s.waiver_id where s.trip_id='${tripId}' and s.user_id='${participant.id}'`,
        ),
      ),
    )
  expect(
    JSON.parse(
      sql(
        `select answers from public.registration_responses where trip_id='${tripId}' and user_id='${participant.id}'`,
      ),
    ),
  ).toEqual({
    experience: 'Test hiking experience',
    experience_level: 'Some experience',
    ready: true,
    gear: ['Water', 'Boots'],
  })
  expect(signed.body).toBe(realWaiver)
  expect(signed.source).toBe(unlvWaiverSource)
  expect(signed.details.initials).toHaveLength(7)
  expect(signed.details).toMatchObject({
    phone: '5550101234',
    address: '123 Synthetic Street',
    emergencyAddress: '456 Synthetic Street',
    birthDate: '1990-01-01',
  })
  expect(signed.name).toBe('Test Participant')
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
  const response = await request.get(`/trips/${tripId}/rsvp`, {
    maxRedirects: 0,
  })
  expect(response.status()).toBe(307)
  expect(response.headers()['cache-control']).toContain('no-store')
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
  await member.getByRole('button', { name: 'Going', exact: true }).click()
  await member
    .getByRole('button', { name: 'Complete form', exact: true })
    .click()
  await completeForm(member, true)
  await expect(
    member.getByRole('button', { name: /^(Join waitlist|Confirm Going)$/ }),
  ).toBeDisabled()
  await member.getByRole('button', { name: 'Request guardian review' }).click()
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
  await officer
    .getByRole('checkbox', { name: /^I verified the signer/ })
    .check()
  await officer
    .getByRole('button', { name: 'Confirm guardian consent', exact: true })
    .click()
  await expect(
    officer.getByText('No trip guardian reviews are waiting.'),
  ).toBeVisible()
  await member.reload()
  await completeForm(member, true)
  await member
    .getByRole('button', { name: /^(Join waitlist|Confirm Going)$/ })
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

test('privacy email choices persist and opt-outs keep trip status available', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  })
  await signIn(context, waiter)
  const page = await context.newPage()
  await page.goto('/profile/user/account')
  await expect(
    page.getByText(/18 or older — declared/).filter({ visible: true }),
  ).toBeVisible()
  await page.goto('/profile/user/privacy')
  await expect(
    page.getByRole('switch', { name: 'Trips I RSVP for', exact: true }),
  ).toBeChecked()
  await expect(
    page.getByRole('switch', { name: 'Club announcements', exact: true }),
  ).not.toBeChecked()
  await expect(
    page.getByRole('switch', { name: 'General club updates', exact: true }),
  ).not.toBeChecked()
  await page
    .getByRole('switch', { name: 'General club updates', exact: true })
    .click()
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Save changes', exact: true }),
  ).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByRole('switch', { name: 'General club updates', exact: true }),
  ).toBeChecked()
  await page
    .getByRole('switch', { name: 'Allow club emails', exact: true })
    .click()
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Save changes', exact: true }),
  ).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByRole('switch', { name: 'Allow club emails', exact: true }),
  ).not.toBeChecked()
  await expect(
    page.getByRole('switch', { name: 'General club updates', exact: true }),
  ).toBeDisabled()
  await page.screenshot({
    path: '/tmp/mtn-email-preferences-mobile.png',
    fullPage: true,
  })
  await page.goto(`/trips/${tripId}/rsvp`)
  await expect(
    page
      .getByRole('region', { name: 'Registration status', exact: true })
      .getByText('confirmed', { exact: true }),
  ).toBeVisible()
  await expect(
    page
      .getByRole('region', { name: 'Registration status', exact: true })
      .getByText(/Trip emails are disabled/),
  ).toBeVisible()
  await context.close()
})

test('organizer creates a trip through grouped steps and resumes its draft', async ({
  browser,
}) => {
  const context = await browser.newContext()
  await signIn(context, owner)
  const page = await context.newPage()
  const title = `Guided creation ${randomUUID()}`
  await page.goto('/admin/trips/new')
  const form = page.locator('#trip-event-form')
  await expect(form).toHaveAttribute('data-ready', 'true')
  await form.getByLabel('Trip title').fill(title)
  await form.getByLabel('Type', { exact: true }).selectOption('social')
  await form.getByLabel('Short summary').fill('A complete organizer form test.')
  await form.getByRole('checkbox', { name: parityTag, exact: true }).check()
  await form.getByRole('button', { name: 'Save draft', exact: true }).click()
  await expect(page).toHaveURL(/draft=/)
  await page.reload()
  await expect(form.getByLabel('Trip title')).toHaveValue(title)
  await expect(form.getByLabel('Type', { exact: true })).toHaveValue('social')
  await expect(form.getByLabel('Short summary')).toHaveValue(
    'A complete organizer form test.',
  )
  await expect(
    form.getByRole('checkbox', { name: parityTag, exact: true }),
  ).toBeChecked()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByLabel('Start', { exact: true }).fill('2026-11-14T06:00')
  await form.getByLabel('End', { exact: true }).fill('2026-11-14T11:00')
  await form.getByLabel('Destination', { exact: true }).fill('Red Rock Canyon')
  await form.getByLabel('Meeting point').fill('Campus meetup')
  await form
    .getByLabel('Private meeting instructions')
    .fill('Private gate code details')
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByRole('button', { name: 'Back', exact: true }).click()
  await form.getByRole('radio', { name: 'Moderate', exact: true }).check()
  for (const [label, value] of [
    ['What to expect', 'Sunrise hike'],
    ['Route and area', 'Calico Tanks route'],
    ['Weather and preparation', 'Bring sun protection'],
    ['Equipment to bring', 'Water and boots'],
    ['Transportation and gear notes', 'Arrange your own ride'],
  ])
    await form.getByLabel(label).fill(value)
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form.getByRole('radio', { name: 'Everyone', exact: true }).check()
  await form
    .getByRole('switch', { name: 'No participant limit', exact: true })
    .uncheck()
  await form.getByLabel('Participant limit', { exact: true }).fill('12')
  await form
    .getByRole('checkbox', { name: 'Parity Host — Trip Leader', exact: true })
    .check()
  await form.locator(`input[type="checkbox"][value="${owner.id}"]`).check()
  await form.getByRole('switch', { name: /Ask about transportation/ }).check()
  await form.getByRole('button', { name: 'Save draft', exact: true }).click()
  await expect(form.getByText(/Draft saved/)).toBeVisible()
  await page.reload()
  for (let step = 0; step < 3; step++)
    await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(
    form.getByRole('switch', { name: /Ask about transportation/ }),
  ).toBeChecked()
  await form.getByRole('button', { name: 'Continue', exact: true }).click()
  await form
    .getByRole('button', { name: 'Create Official Trip', exact: true })
    .click()
  await expect(page).toHaveURL(/\/admin\/trips$/)
  const id = sql(`select id from public.trips where title='${title}'`)
  expect(id).toMatch(/^[a-f0-9-]{36}$/)
  trips.push(id)
  expect(
    sql(
      `select collect_transportation from public.trip_registration_settings where trip_id='${id}'`,
    ),
  ).toBe('t')
  const persisted = z
    .object({
      starts_at: z.string(),
      ends_at: z.string(),
      activity_tags: z.array(z.string()),
    })
    .passthrough()
    .parse(
      JSON.parse(
        sql(`select row_to_json(t) from public.trips t where id='${id}'`),
      ),
    )
  expect(persisted).toMatchObject({
    event_kind: 'social',
    description_public: 'A complete organizer form test.',
    location_public: 'Red Rock Canyon',
    overview_what: 'Sunrise hike',
    overview_where: 'Meeting point: Campus meetup\n\nCalico Tanks route',
    overview_weather: 'Bring sun protection',
    overview_equipment: 'Water and boots',
    overview_carpool_need_gear: 'Arrange your own ride',
    capacity: 12,
    difficulty: 'intermediate',
    visibility: 'public',
    is_official: true,
    is_all_day: false,
    time_zone: 'America/Los_Angeles',
  })
  expect(new Date(persisted.starts_at).toISOString()).toBe(
    '2026-11-14T14:00:00.000Z',
  )
  expect(new Date(persisted.ends_at).toISOString()).toBe(
    '2026-11-14T19:00:00.000Z',
  )
  expect(persisted.activity_tags).toContain(parityTag)
  expect(
    sql(`select meetup_point from public.trip_private where trip_id='${id}'`),
  ).toBe('Private gate code details')
  expect(
    sql(`select host_id from public.trip_hosts where trip_id='${id}'`),
  ).toBe(parityHost)
  expect(
    sql(`select credited_title from public.trip_hosts where trip_id='${id}'`),
  ).toBe('Trip Leader')
  expect(
    sql(
      `select count(*) from public.trip_leaders where trip_id='${id}' and user_id='${owner.id}'`,
    ),
  ).toBe('1')
  expect(
    sql(`select count(*) from public.trip_drafts where title='${title}'`),
  ).toBe('0')
  await page.goto(`/trips/${id}`)
  await expect(
    page.getByText('6:00 AM - 11:00 AM', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Meeting point: Campus meetup', { exact: false }),
  ).toBeVisible()
  await context.close()
})

test('members can use activity choices and resume community drafts through the calendar alias', async ({
  browser,
}) => {
  sql(
    `insert into public.memberships(user_id,status) values('${waiter.id}','active') on conflict(user_id) do update set status='active'`,
  )
  const context = await browser.newContext()
  await signIn(context, waiter)
  const page = await context.newPage()
  await page.goto('/calendar/new')
  const form = page.locator('#trip-event-form')
  await expect(form).toHaveAttribute('data-ready', 'true')
  await expect(
    form.getByRole('switch', { name: 'Official club trip' }),
  ).toHaveCount(0)
  await expect(
    form.getByText('Manage activity options', { exact: true }),
  ).toHaveCount(0)
  await form.getByRole('checkbox', { name: parityTag, exact: true }).check()
  await form.getByLabel('Trip title').fill('Community draft parity')
  await form.getByLabel('Type', { exact: true }).selectOption('indoor')
  await form.getByRole('button', { name: 'Save draft', exact: true }).click()
  await expect(page).toHaveURL(/\/calendar\/new\?draft=/)
  await page.reload()
  await expect(form.getByLabel('Trip title')).toHaveValue(
    'Community draft parity',
  )
  await expect(form.getByLabel('Type', { exact: true })).toHaveValue('indoor')
  await expect(
    form.getByRole('checkbox', { name: parityTag, exact: true }),
  ).toBeChecked()
  await context.close()
})
