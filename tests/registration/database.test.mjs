import assert from 'node:assert/strict'
import { execFile, execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { promisify } from 'node:util'

const run = promisify(execFile)
const container = 'supabase_db_mtn-auth-integration'
const database = `registration_test_${process.pid}`
const literal = value => `'${String(value).replaceAll("'", "''")}'`
function sql(query, db = database) {
  return execFileSync(
    'docker',
    [
      'exec',
      '-i',
      container,
      'psql',
      '-U',
      'supabase_admin',
      '-d',
      db,
      '-X',
      '-qAt',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: query, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  ).trim()
}
before(() => {
  // Fixed local container only. No connection strings or hosted credentials accepted.
  sql(`create database ${database}`, 'postgres')
  const schema = execFileSync(
    'docker',
    [
      'exec',
      container,
      'pg_dump',
      '-U',
      'postgres',
      '--schema-only',
      '--no-owner',
      'postgres',
    ],
    { maxBuffer: 32 * 1024 * 1024 },
  )
  execFileSync(
    'docker',
    [
      'exec',
      '-i',
      container,
      'psql',
      '-U',
      'supabase_admin',
      '-d',
      database,
      '-X',
      '-q',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: schema, stdio: ['pipe', 'pipe', 'pipe'] },
  )
  // Rebuild the application from its committed baseline, then apply every subsequent schema change.
  sql(
    'set client_min_messages=warning; drop schema public cascade; drop schema if exists registration_private cascade; create schema public authorization postgres;',
  )
  sql(
    readFileSync(
      new URL('../../supabase/schema-only.sql', import.meta.url),
      'utf8',
    ),
  )
  const migrations = new URL('../../supabase/migrations/', import.meta.url)
  for (const name of readdirSync(migrations)
    .filter(
      name => name.startsWith('2026090400') && !name.startsWith('202609040007'),
    )
    .sort()) {
    sql(readFileSync(new URL(name, migrations), 'utf8'))
  }
})
after(() => sql(`drop database if exists ${database} with (force)`, 'postgres'))
async function asUser(user, query) {
  const result = await run('docker', [
    'exec',
    container,
    'psql',
    '-U',
    'postgres',
    '-d',
    database,
    '-X',
    '-qAt',
    '-v',
    'ON_ERROR_STOP=1',
    '-c',
    `begin; set local role authenticated; set local "request.jwt.claim.sub"=${literal(user)}; set local "request.jwt.claim.role"='authenticated'; ${query}; commit;`,
  ])
  return JSON.parse(result.stdout.trim())
}
function fixture(capacity = 1) {
  const owner = randomUUID()
  const trip = randomUUID()
  const role = randomUUID()
  const users = Array.from({ length: 12 }, randomUUID)
  sql(`insert into auth.users(id,email) values ${[owner, ...users].map(id => `('${id}','${id}@example.test')`).join(',')};
 insert into public.admin_roles(id,key,name,is_super_admin) values('${role}','rsvp_${role.replaceAll('-', '_')}','Test admin',true) on conflict do nothing;
 insert into public.admin_user_roles(user_id,role_id) select '${owner}',id from public.admin_roles where is_super_admin;
 insert into public.account_age_declarations(user_id,is_18_or_older) values ${users.map(id => `('${id}',true)`).join(',')};
 begin; set local "request.jwt.claim.sub"='${owner}';
 insert into public.trips(id,title,starts_at,ends_at,capacity,created_by) values('${trip}','Concurrent registration test',now()+interval '2 days',now()+interval '3 days',${capacity},'${owner}');
 select public.set_registration_enabled(true);
 select public.save_registration_settings('${trip}',0,'{"enabled":true,"eligibility":"account","emergencyRequired":false,"waiverRequired":false,"questions":[],"capacity":${capacity},"waitlistEnabled":true,"deadline":null,"offerHours":24}'); commit;`)
  return { owner, trip, users }
}
const register = (trip, user, id = randomUUID()) =>
  asUser(
    user,
    `select public.registration_command('${trip}','register','${id}',0,'{"formVersion":2,"answers":{}}')`,
  )

test('transactional workflow, requirements, waiver evidence, and merge SQL', () => {
  for (const name of [
    'registration.sql',
    'registration-requirements.sql',
    'registration-authorization.sql',
  ])
    sql(readFileSync(new URL(`../${name}`, import.meta.url), 'utf8'))
})
test('twelve simultaneous registrations reserve exactly one seat and expose only scoped reads', async () => {
  const f = fixture()
  const results = await Promise.all(f.users.map(user => register(f.trip, user)))
  assert.equal(results.filter(r => r.state === 'confirmed').length, 1)
  assert.equal(
    sql(
      `select count(*) from public.trip_rsvps where trip_id='${f.trip}' and registration_state='confirmed'`,
    ),
    '1',
  )
  const waiting = f.users[results.findIndex(r => r.state === 'waitlisted')]
  await assert.rejects(
    asUser(
      waiting,
      `insert into public.trip_rsvps(trip_id,user_id,status) values('${f.trip}','${waiting}','going')`,
    ),
    /permission denied/,
  )
  await assert.rejects(
    asUser(waiting, `select public.get_registration_roster('${f.trip}')`),
    /permission required/,
  )
  const snapshot = await asUser(
    waiting,
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(snapshot.confirmedCount, 1)
  assert.deepEqual(snapshot.attendees, [])
})
test('competing organizer offers cannot reserve the same newly opened seat', async () => {
  const f = fixture()
  await register(f.trip, f.users[0])
  await register(f.trip, f.users[1])
  await register(f.trip, f.users[2])
  await asUser(
    f.users[0],
    `select public.registration_command('${f.trip}','cancel','${randomUUID()}',1)`,
  )
  const offers = await Promise.allSettled(
    f.users
      .slice(1, 3)
      .map(user =>
        asUser(
          f.owner,
          `select public.registration_command('${f.trip}','issue_offer','${randomUUID()}',1,'{}','${user}')`,
        ),
      ),
  )
  assert.equal(offers.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(
    sql(
      `select count(*) from public.registration_offers where trip_id='${f.trip}' and status='pending'`,
    ),
    '1',
  )
})
test('simultaneous duplicate commands confirm once without toggling', async () => {
  const f = fixture()
  const request = randomUUID()
  const results = await Promise.all(
    Array.from({ length: 5 }, () => register(f.trip, f.users[0], request)),
  )
  assert.ok(
    results.every(
      result => result.state === 'confirmed' && result.revision === 1,
    ),
  )
  assert.equal(
    sql(
      `select count(*) from public.registration_events where trip_id='${f.trip}' and kind='confirmed'`,
    ),
    '1',
  )
})
test('expiry is enforced without a worker and an organizer can reoffer an expired seat', async () => {
  const f = fixture()
  await register(f.trip, f.users[0])
  await register(f.trip, f.users[1])
  await asUser(
    f.users[0],
    `select public.registration_command('${f.trip}','cancel','${randomUUID()}',1)`,
  )
  await asUser(
    f.owner,
    `select public.registration_command('${f.trip}','issue_offer','${randomUUID()}',1,'{}','${f.users[1]}')`,
  )
  const id = sql(
    `update public.registration_offers set expires_at=now()-interval '1 minute' where trip_id='${f.trip}' returning id`,
  )
  await assert.rejects(
    asUser(
      f.users[1],
      `select public.registration_command('${f.trip}','accept_offer','${randomUUID()}',2,'{"offerId":"${id}"}')`,
    ),
    /no longer available/,
  )
  await asUser(
    f.owner,
    `select public.registration_command('${f.trip}','issue_offer','${randomUUID()}',2,'{}','${f.users[1]}')`,
  )
  assert.equal(
    sql(
      `select count(*) from public.registration_offers where trip_id='${f.trip}' and status='pending'`,
    ),
    '1',
  )
})
test('outbox leases are exclusive, opt-outs are rechecked, and early webhooks reconcile', async () => {
  const f = fixture()
  await register(f.trip, f.users[0])
  sql(
    `update public.registration_notifications set status='obsolete' where trip_id<>'${f.trip}'`,
  )
  const batches = await Promise.all(
    Array.from({ length: 2 }, () =>
      run('docker', [
        'exec',
        container,
        'psql',
        '-U',
        'supabase_admin',
        '-d',
        database,
        '-qAt',
        '-c',
        'select public.claim_registration_notifications(20)',
      ]),
    ),
  )
  const jobs = batches.flatMap(batch => JSON.parse(batch.stdout.trim()))
  assert.equal(jobs.length, 1)
  const job = jobs[0]
  sql(
    `insert into public.profile_private(user_id,notification_settings) values('${f.users[0]}','{"tripUpdates":false}') on conflict(user_id) do update set notification_settings=excluded.notification_settings`,
  )
  assert.equal(
    sql(
      `select public.prepare_registration_notification('${job.id}','${job.leaseToken}')`,
    ),
    '',
  )
  assert.equal(
    sql(
      `select status from public.registration_notifications where id='${job.id}'`,
    ),
    'suppressed',
  )
  sql(`update public.registration_notifications set status='sending' where id='${job.id}';
 select public.registration_delivery('event-early','provider-early','delivered');
 select public.finish_registration_notification('${job.id}','${job.leaseToken}','provider-early','',false);
 select public.registration_delivery('event-early','provider-early','delivered');`)
  assert.equal(
    sql(
      `select status from public.registration_notifications where id='${job.id}'`,
    ),
    'delivered',
  )
  assert.equal(
    sql(
      `select count(*) from public.registration_delivery_events where id='event-early'`,
    ),
    '1',
  )
})

test('acceptance racing cancellation rejects the stale action without corrupting capacity', async () => {
  const f = fixture()
  await register(f.trip, f.users[0])
  await register(f.trip, f.users[1])
  await asUser(
    f.users[0],
    `select public.registration_command('${f.trip}','cancel','${randomUUID()}',1)`,
  )
  await asUser(
    f.owner,
    `select public.registration_command('${f.trip}','issue_offer','${randomUUID()}',1,'{}','${f.users[1]}')`,
  )
  const offer = sql(
    `select id from public.registration_offers where trip_id='${f.trip}' and status='pending'`,
  )
  const results = await Promise.allSettled([
    asUser(
      f.users[1],
      `select public.registration_command('${f.trip}','accept_offer','${randomUUID()}',2,'{"offerId":"${offer}"}')`,
    ),
    asUser(
      f.users[1],
      `select public.registration_command('${f.trip}','cancel','${randomUUID()}',2)`,
    ),
  ])
  assert.equal(
    results.filter(result => result.status === 'fulfilled').length,
    1,
  )
  assert.equal(
    results.filter(
      result =>
        result.status === 'rejected' &&
        /Registration changed/.test(result.reason.message),
    ).length,
    1,
  )
  assert.equal(
    sql(
      `select count(*) from public.registration_offers where trip_id='${f.trip}' and status='pending'`,
    ),
    '0',
  )
  const snapshot = await asUser(
    f.users[1],
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.ok(['confirmed', 'cancelled'].includes(snapshot.state))
  assert.equal(snapshot.reservedCount, 0)
  assert.equal(snapshot.confirmedCount, snapshot.state === 'confirmed' ? 1 : 0)
})

test('capacity reductions racing arrivals never reduce below occupied seats', async () => {
  const f = fixture(2)
  await register(f.trip, f.users[0])
  await Promise.allSettled([
    register(f.trip, f.users[1]),
    asUser(
      f.owner,
      `update public.trips set capacity=1 where id='${f.trip}'; select public.get_trip_registration('${f.trip}')`,
    ),
  ])
  assert.equal(
    sql(
      `select count(*)<=t.capacity from public.trip_rsvps r join public.trips t on t.id=r.trip_id where t.id='${f.trip}' and r.registration_state='confirmed' group by t.capacity`,
    ),
    't',
  )
})

test('expired worker leases retry with the same job identity and exhausted leases become inspectable failures', async () => {
  const f = fixture()
  await register(f.trip, f.users[0])
  sql(
    `update public.registration_notifications set status='obsolete' where trip_id<>'${f.trip}'`,
  )
  const [first] = JSON.parse(
    sql('select public.claim_registration_notifications(1)'),
  )
  sql(
    `update public.registration_notifications set leased_until=now()-interval '1 second' where id='${first.id}'`,
  )
  const [second] = JSON.parse(
    sql('select public.claim_registration_notifications(1)'),
  )
  assert.equal(first.id, second.id)
  assert.notEqual(first.leaseToken, second.leaseToken)
  assert.equal(second.attempts, 2)
  assert.equal(
    sql(
      `select public.prepare_registration_notification('${first.id}','${first.leaseToken}')`,
    ),
    '',
  )
  sql(
    `update public.registration_notifications set attempts=6,leased_until=now()-interval '1 second' where id='${first.id}'`,
  )
  assert.deepEqual(
    JSON.parse(sql('select public.claim_registration_notifications(1)')),
    [],
  )
  assert.equal(
    sql(
      `select status||':'||error_code from public.registration_notifications where id='${first.id}'`,
    ),
    'failed:delivery_unknown',
  )
})

test('registration racing an account merge cannot leave a seat on the merged account', async () => {
  const f = fixture()
  const secondary = f.users[0]
  const primary = f.users[1]
  await Promise.allSettled([
    register(f.trip, secondary),
    run('docker', [
      'exec',
      container,
      'psql',
      '-U',
      'supabase_admin',
      '-d',
      database,
      '-qAt',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      `select public.merge_trip_registrations('${primary}','${secondary}')`,
    ]),
  ])
  assert.equal(
    sql(
      `select count(*) from public.registration_account_merges where secondary_id='${secondary}' and primary_id='${primary}'`,
    ),
    '1',
  )
  assert.equal(
    sql(`select count(*) from public.trip_rsvps where user_id='${secondary}'`),
    '0',
  )
  await assert.rejects(register(f.trip, secondary), /account has been merged/)
})

test('email categories preserve legacy opt-outs, reject stale edits, and limit exports', async () => {
  const f = fixture()
  const user = f.users[0]
  const read = () => asUser(user, 'select public.get_my_email_preferences()')
  const save = (next, expected) =>
    asUser(
      user,
      `select public.save_privacy_email_preferences('{}',${literal(JSON.stringify(next))},${literal(JSON.stringify(expected))})`,
    )
  const defaults = await read()
  assert.deepEqual(defaults, {
    email: true,
    tripUpdates: true,
    tripReminders: true,
    safetyAlerts: true,
    announcements: false,
    general: false,
    memberStories: false,
  })
  sql(`insert into public.profile_private(user_id,notification_settings) values('${user}','{"email":false,"announcements":false}') on conflict(user_id) do update set notification_settings=excluded.notification_settings;
    insert into public.user_preferences(user_id,trip_email_notifications) values('${user}',false) on conflict(user_id) do update set trip_email_notifications=false;`)
  const legacy = await read()
  assert.equal(legacy.email, false)
  assert.equal(legacy.tripUpdates, false)
  assert.equal(legacy.tripReminders, false)
  await save({ ...legacy, general: true }, legacy)
  assert.equal(
    sql(`select registration_private.email_enabled('${user}','offered')`),
    'f',
  )
  let recipients = await asUser(
    f.owner,
    "select public.export_club_email_recipients('general')",
  )
  assert.ok(!recipients.some(r => r.email === `${user}@example.test`))
  const before = await read()
  const enabled = { ...before, email: true, tripUpdates: true }
  await save(enabled, before)
  assert.equal(
    sql(
      `select trip_email_notifications from public.user_preferences where user_id='${user}'`,
    ),
    't',
  )
  assert.equal(
    sql(`select registration_private.email_enabled('${user}','offered')`),
    't',
  )
  assert.equal(
    sql(`select registration_private.email_enabled('${user}','reminder')`),
    'f',
  )
  await assert.rejects(save(before, before), /changed elsewhere/)
  await assert.rejects(
    save({ ...enabled, unknown: true }, enabled),
    /Choose yes or no/,
  )
  recipients = await asUser(
    f.owner,
    "select public.export_club_email_recipients('general')",
  )
  assert.ok(recipients.some(r => r.email === `${user}@example.test`))
  recipients = await asUser(
    f.owner,
    "select public.export_club_email_recipients('announcements')",
  )
  assert.ok(!recipients.some(r => r.email === `${user}@example.test`))
  await assert.rejects(
    asUser(user, "select public.export_club_email_recipients('general')"),
    /permission required/,
  )
  await save({ ...enabled, safetyAlerts: false }, enabled)
  assert.equal(
    sql(`select registration_private.email_enabled('${user}','trip_changed')`),
    'f',
  )
  assert.equal(
    sql(`select registration_private.email_enabled('${user}','confirmed')`),
    't',
  )
  await assert.rejects(
    asUser(
      user,
      'delete from public.profile_email_consent_events returning id',
    ),
    /permission denied/,
  )
  sql(
    `update public.profile_private set notification_settings='{"email":"malformed","tripUpdates":null}' where user_id='${user}'`,
  )
  assert.equal((await read()).email, true)
})
