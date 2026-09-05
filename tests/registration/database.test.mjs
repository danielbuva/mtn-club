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
      name =>
        name.endsWith('.sql') &&
        name >= '202609040001' &&
        !name.startsWith('202609040007'),
    )
    .sort()) {
    sql(readFileSync(new URL(name, migrations), 'utf8'))
  }
  // Legacy regression fixtures explicitly retain the old per-trip model. Annual journeys opt in below.
  sql(
    'alter table public.trip_registration_settings alter column annual_waiver set default false',
  )
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

test('registration merge immediately preserves category and mailing-list opt-outs', async () => {
  const f = fixture()
  const [primary, secondary] = f.users
  const defaults = await asUser(
    primary,
    'select public.get_my_email_preferences()',
  )
  const allOn = Object.fromEntries(
    Object.keys(defaults).map(key => [key, true]),
  )
  await asUser(
    primary,
    `select public.save_privacy_email_preferences('{}',${literal(JSON.stringify(allOn))},${literal(JSON.stringify(defaults))})`,
  )
  sql(`insert into public.profile_private(user_id,notification_settings) values('${secondary}','{"tripReminders":false,"safetyAlerts":false}') on conflict(user_id) do update set notification_settings=excluded.notification_settings;
  insert into public.mailing_list_subscriptions(user_id,email,subscribed,consent_source,unsubscribed_at) values('${secondary}','${secondary}@example.test',false,'account_settings',now());
  select public.merge_trip_registrations('${primary}','${secondary}');`)
  const prefs = await asUser(
    primary,
    'select public.get_my_email_preferences()',
  )
  assert.equal(prefs.announcements, false)
  assert.equal(prefs.general, false)
  assert.equal(prefs.memberStories, false)
  assert.equal(prefs.tripReminders, false)
  assert.equal(prefs.safetyAlerts, false)
  assert.equal(prefs.tripUpdates, true)
  assert.equal(
    sql(`select registration_private.email_enabled('${primary}','reminder')`),
    'f',
  )
  assert.equal(
    sql(
      `select subscribed from public.mailing_list_subscriptions where user_id='${primary}'`,
    ),
    'f',
  )
})

test('ordinary community creators become leaders without gaining assignment or official-trip permissions', async () => {
  const { owner, users } = fixture()
  const member = users[0]
  const trip = randomUUID()
  sql(`insert into public.membership_access_overrides(user_id,reason,granted_by)
    values('${member}','Community trip creation test','${owner}');`)
  const result = await asUser(
    member,
    `insert into public.trips(id,title,starts_at,ends_at,created_by,is_official)
      values('${trip}','Member community trip',now()+interval '5 days',now()+interval '6 days','${member}',false);
    select json_build_object(
      'leaders', (select json_agg(user_id) from public.trip_leaders where trip_id='${trip}'),
      'officialScope', public.admin_capability_scope('${member}','trips.official'),
      'assignmentScope', public.admin_capability_scope('${member}','trips.update')
    )`,
  )
  assert.deepEqual(result, {
    leaders: [member],
    officialScope: null,
    assignmentScope: null,
  })
  await assert.rejects(
    asUser(
      member,
      `insert into public.trips(title,starts_at,ends_at,created_by,is_official)
      values('Unauthorized official trip',now()+interval '5 days',now()+interval '6 days','${member}',true)`,
    ),
    /official trip permission required|row-level security/,
  )
  await assert.rejects(
    asUser(
      member,
      `insert into public.trip_leaders(trip_id,user_id) values('${trip}','${users[1]}')`,
    ),
    /row-level security/,
  )
  assert.equal(
    sql(`select count(*) from public.trip_leaders where trip_id='${trip}'`),
    '1',
  )
})

test('incomplete signups stay private, hold no seat, survive drafts, and confirm only on valid submission', async () => {
  const f = fixture(2)
  const user = f.users[0]
  const peer = f.users[1]
  const command = (name, revision, data = {}, request = randomUUID()) =>
    asUser(
      user,
      `select public.registration_command('${f.trip}',${literal(name)},'${request}',${revision},${literal(JSON.stringify(data))})`,
    )
  const request = randomUUID()
  let snapshot = await command('begin_signup', 0, {}, request)
  assert.equal(snapshot.state, 'incomplete')
  assert.equal(snapshot.confirmedCount, 0)
  assert.equal(snapshot.reservedCount, 0)
  assert.equal(snapshot.actions.includes('register'), true)
  assert.equal(
    (await command('begin_signup', 0, {}, request)).revision,
    snapshot.revision,
  )
  const roster = await asUser(
    f.owner,
    `select public.get_registration_roster('${f.trip}')`,
  )
  assert.equal(roster.rows.find(row => row.userId === user).state, 'incomplete')
  await assert.rejects(
    asUser(peer, `select public.get_registration_roster('${f.trip}')`),
    /permission required/,
  )
  await assert.rejects(
    asUser(
      f.owner,
      `select public.registration_command('${f.trip}','begin_signup','${randomUUID()}',0,'{}','${peer}')`,
    ),
    /own signup/,
  )
  snapshot = await command('save_draft', snapshot.revision, {
    formVersion: 2,
    answers: {},
    emergencyContact: { name: 'Draft contact' },
  })
  assert.equal(snapshot.state, 'incomplete')
  assert.equal(snapshot.emergencyContact.name, 'Draft contact')
  assert.equal(
    snapshot.requirements.includes('Complete the current registration form.'),
    true,
  )
  await register(f.trip, peer)
  const peerView = await asUser(
    peer,
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(
    peerView.attendees.some(row => row.userId === user),
    false,
  )
  assert.equal(peerView.confirmedCount, 1)
  snapshot = await command('register', snapshot.revision, {
    formVersion: 2,
    answers: {},
  })
  assert.equal(snapshot.state, 'confirmed')
  assert.equal(snapshot.confirmedCount, 2)
  assert.equal(
    sql(
      `select status from public.trip_rsvps where trip_id='${f.trip}' and user_id='${user}'`,
    ),
    'going',
  )
})

test('trip creators can open and close registration and inspect incomplete signups; closure blocks drafts and submissions', async () => {
  const f = fixture(2)
  const creator = f.users[0]
  const participant = f.users[1]
  const trip = randomUUID()
  sql(
    `insert into public.membership_access_overrides(user_id,reason,granted_by) values('${creator}','Creator registration test','${f.owner}');`,
  )
  await asUser(
    creator,
    `insert into public.trips(id,title,starts_at,ends_at,created_by,is_official)
    values('${trip}','Creator registration',now()+interval '5 days',now()+interval '6 days','${creator}',false); select '{}'::json`,
  )
  const settings = {
    enabled: true,
    eligibility: 'account',
    emergencyRequired: true,
    waiverRequired: false,
    questions: [
      { id: 'gear', label: 'Gear needed', type: 'text', required: true },
    ],
    capacity: 2,
    waitlistEnabled: true,
    deadline: null,
    offerHours: 24,
  }
  const save = (actor, revision, enabled) =>
    asUser(
      actor,
      `select public.save_registration_settings('${trip}',${revision},${literal(JSON.stringify({ ...settings, enabled }))})`,
    )
  await save(creator, 0, true)
  await assert.rejects(save(participant, 1, false), /permission required/)
  const run = (name, revision, data = {}) =>
    asUser(
      participant,
      `select public.registration_command('${trip}',${literal(name)},'${randomUUID()}',${revision},${literal(JSON.stringify(data))})`,
    )
  let state = await run('begin_signup', 0)
  state = await run('save_draft', state.revision, {
    formVersion: 2,
    answers: { gear: '' },
    emergencyContact: { name: 'Partial' },
  })
  await assert.rejects(
    run('register', state.revision, { formVersion: 2, answers: {} }),
    /required question/,
  )
  await save(creator, 1, false)
  const roster = await asUser(
    creator,
    `select public.get_registration_roster('${trip}')`,
  )
  assert.equal(
    roster.rows.find(row => row.userId === participant).state,
    'incomplete',
  )
  assert.equal(roster.snapshot.confirmedCount, 0)
  await assert.rejects(
    run('register', state.revision, { formVersion: 2 }),
    /not open|closed/,
  )
  await assert.rejects(
    run('save_draft', state.revision, { formVersion: 2 }),
    /not open|closed/,
  )
  assert.equal(
    (
      await asUser(
        participant,
        `select public.get_trip_registration('${trip}')`,
      )
    ).actions.includes('register'),
    false,
  )
  await save(creator, 2, true)
  state = await run('register', state.revision, {
    formVersion: 2,
    answers: { gear: 'Tent' },
    emergencyContact: {
      name: 'Test contact',
      relationship: 'Friend',
      phone: '5551234567',
    },
    emergencyConfirmed: true,
  })
  assert.equal(state.state, 'confirmed')
})

test('Maybe and Not going save without confirming or reserving seats, and Going can start afterward', async () => {
  const f = fixture(2)
  const user = f.users[0]
  const run = (command, revision, extra = '') =>
    asUser(
      user,
      `select public.registration_command('${f.trip}',${literal(command)},'${randomUUID()}',${revision},'{}'${extra})`,
    )
  let state = await run('set_maybe', 0)
  assert.equal(state.state, 'maybe')
  assert.equal(state.confirmedCount, 0)
  assert.equal(state.reservedCount, 0)
  const roster = await asUser(
    f.owner,
    `select public.get_registration_roster('${f.trip}')`,
  )
  assert.equal(roster.rows.find(row => row.userId === user).state, 'maybe')
  state = await run('set_not_going', state.revision)
  assert.equal(state.state, 'cancelled')
  state = await run('set_maybe', state.revision)
  state = await run('begin_signup', state.revision)
  assert.equal(state.state, 'incomplete')
  assert.equal(state.confirmedCount, 0)
  await assert.rejects(
    run('set_maybe', 0, `,'${f.users[1]}'`),
    /permission required/,
  )
  const confirmed = await register(f.trip, f.users[2])
  await assert.rejects(
    asUser(
      f.users[2],
      `select public.registration_command('${f.trip}','set_not_going','${randomUUID()}',${confirmed.revision},'{}')`,
    ),
    /cannot be started/,
  )
  sql(
    `update public.trip_registration_settings set enabled=false where trip_id='${f.trip}'`,
  )
  await assert.rejects(run('set_maybe', state.revision), /not open|closed/)
})

test('transportation preferences normalize, persist through drafts, and remain private', async () => {
  const f = fixture(3)
  const user = f.users[0]
  await asUser(
    f.owner,
    `select to_jsonb(public.set_trip_transportation_collection('${f.trip}',true))`,
  )
  let current = await asUser(
    user,
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(current.collectTransportation, true)
  const command = (name, data) =>
    asUser(
      user,
      `select public.registration_command('${f.trip}','${name}','${randomUUID()}',${current.revision},${literal(JSON.stringify({ formVersion: current.formVersion, ...data }))})`,
    )
  current = await command('save_draft', {
    answers: {},
    transportation: { mode: 'driver', seatsOffered: 4 },
  })
  assert.equal(current.state, 'incomplete')
  assert.equal(current.confirmedCount, 0)
  assert.deepEqual(current.transportation, { mode: 'driver', seatsOffered: 4 })
  for (const invalid of [
    { mode: 'driver', seatsOffered: 9 },
    { mode: 'driver', seatsOffered: 1.5 },
    { mode: 'needs_ride', seatsOffered: 4 },
    { mode: 'covered' },
  ]) {
    await assert.rejects(
      command('save_draft', { answers: {}, transportation: invalid }),
      /valid transportation/,
    )
  }
  current = await command('register', {
    answers: {},
    transportation: { mode: 'needs_ride' },
  })
  assert.deepEqual(current.transportation, { mode: 'needs_ride' })
  current = await command('update_response', { answers: {} })
  assert.deepEqual(current.transportation, { mode: 'needs_ride' })
  const other = await asUser(
    f.users[1],
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(other.transportation, null)
  await assert.rejects(
    asUser(f.users[1], `select public.get_registration_roster('${f.trip}')`),
    /permission/,
  )
  const roster = await asUser(
    f.owner,
    `select public.get_registration_roster('${f.trip}')`,
  )
  assert.deepEqual(
    roster.rows.find(row => row.userId === user).transportation,
    { mode: 'needs_ride' },
  )
  await asUser(
    f.owner,
    `select to_jsonb(public.set_trip_transportation_collection('${f.trip}',false))`,
  )
  await assert.rejects(
    command('update_response', {
      answers: {},
      transportation: { mode: 'driver', seatsOffered: 3 },
    }),
    /disabled/,
  )
  current = await command('update_response', { answers: {} })
  assert.deepEqual(current.transportation, { mode: 'needs_ride' })
  current = await command('update_response', {
    answers: {},
    transportation: null,
  })
  assert.equal(current.transportation, null)
  assert.equal(current.confirmedCount, 1)
  await assert.rejects(
    asUser(
      f.users[1],
      `select to_jsonb(public.set_trip_transportation_collection('${f.trip}',true))`,
    ),
    /permission/,
  )
})

test('joining visibility is opt-in, counted privately, remembered, and independent of email categories', async () => {
  const f = fixture(4)
  const [hidden, visible] = f.users
  const preferences = (
    show,
    email,
    expectedShow = false,
    expectedEmail = false,
  ) => ({
    showInAttendeeList: show,
    emailUpdates: email,
    expectedEmailUpdates: expectedEmail,
    expectedAttendeeDefault: expectedShow,
  })
  const command = (
    user,
    kind,
    revision,
    prefs,
    trip = f.trip,
    request = randomUUID(),
  ) =>
    asUser(
      user,
      `select public.registration_command('${trip}','${kind}','${request}',${revision},${literal(JSON.stringify({ formVersion: Number(sql(`select form_version from public.trip_registration_settings where trip_id='${trip}'`)), answers: {}, joiningPreferences: prefs }))})`,
    )
  await command(hidden, 'register', 0, preferences(false, false))
  const request = randomUUID()
  const first = await command(
    visible,
    'register',
    0,
    preferences(true, true),
    f.trip,
    request,
  )
  const retry = await command(
    visible,
    'register',
    0,
    preferences(true, true),
    f.trip,
    request,
  )
  assert.equal(retry.revision, first.revision)
  const view = await asUser(
    hidden,
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(view.confirmedCount, 2)
  assert.deepEqual(
    view.attendees.map(person => person.userId),
    [visible],
  )
  const roster = await asUser(
    f.owner,
    `select public.get_registration_roster('${f.trip}')`,
  )
  assert.equal(roster.rows.length, 2)
  const next = fixture(4)
  const prefilled = await asUser(
    visible,
    `select public.get_trip_registration('${next.trip}')`,
  )
  assert.equal(prefilled.showInAttendeeList, true)
  assert.equal(prefilled.emailUpdates, true)
  const emails = await asUser(
    visible,
    'select public.get_my_email_preferences()',
  )
  assert.equal(emails.tripUpdates, true)
  assert.equal(emails.announcements, false)
  assert.equal(emails.general, false)
  await command(
    visible,
    'register',
    0,
    preferences(false, false, true, true),
    next.trip,
  )
  const prior = await asUser(
    visible,
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(prior.showInAttendeeList, true)
  assert.equal(prior.emailUpdates, false)
  await assert.rejects(
    command(
      visible,
      'update_response',
      prior.revision,
      preferences(false, true, true, true),
    ),
    /changed elsewhere/,
  )
  const after = await asUser(
    hidden,
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(after.confirmedCount, 2)
  assert.deepEqual(
    after.attendees.map(person => person.userId),
    [visible],
  )
  await assert.rejects(
    command(hidden, 'save_draft', 0, preferences(true, true)),
    /draft|preferences|confirmed/i,
  )
})

test('trip activity choices are readable by members but writable only by trip managers', async () => {
  const f = fixture()
  const tag = `parity-${randomUUID()}`
  await asUser(
    f.owner,
    `insert into public.trip_tag_options(tag) values('${tag}'); select to_json(true)`,
  )
  assert.equal(
    await asUser(
      f.users[0],
      `select to_json(count(*)) from public.trip_tag_options where tag='${tag}'`,
    ),
    1,
  )
  await assert.rejects(
    asUser(
      f.users[0],
      `insert into public.trip_tag_options(tag) values('unauthorized-${tag}'); select to_json(true)`,
    ),
    /row-level security/,
  )
  await asUser(
    f.owner,
    `delete from public.trip_tag_options where tag='${tag}'; select to_json(true)`,
  )
})

test('annual adult journeys: exact template, profile signing, trip risks, withdrawal, replacements, scope, history and concurrency', async () => {
  const f = fixture(20)
  const currentYear =
    new Date().getUTCFullYear() - (new Date().getUTCMonth() < 6 ? 1 : 0)
  const fields = {
    event: `MTN hiking and camping ${currentYear}–${currentYear + 1}`,
    sponsor: 'UNLV Mountain Club',
    effectiveFrom: `${currentYear}-07-01`,
    activities: ['hiking', 'camping'],
    risks:
      'Hiking and camping may involve falls, heat illness, serious injury and death.',
  }
  const create = () =>
    asUser(
      f.owner,
      `select to_jsonb(public.create_annual_waiver(${literal(JSON.stringify(fields))}))`,
    )
  const waiver = await create()
  await asUser(
    f.owner,
    `select to_jsonb(public.publish_annual_waiver('${waiver}','Test fixture reviewed wording'))`,
  )
  const disclose = (
    trip,
    revision,
    statements = ['Exposed desert heat with little shade.'],
    activities = ['hiking'],
  ) =>
    asUser(
      f.owner,
      `select to_jsonb(public.save_trip_informed_risks('${trip}',${revision},${literal(`{${statements.map(x => `"${x}"`).join(',')}}`)}::text[],${literal(`{${activities.join(',')}}`)}::text[]))`,
    )
  const risk = await disclose(f.trip, 0)
  sql(
    `update public.trip_registration_settings set waiver_required=true where trip_id='${f.trip}'`,
  )
  const signatureData = {
    waiverAgreed: true,
    signatureName: 'Test Participant',
    signerDetails: {
      phone: '7025550100',
      address: '123 Test Street',
      emergencyAddress: '456 Test Street',
      birthDate: '1990-01-01',
      initials: Array(7).fill('TP'),
    },
    emergencyContact: {
      name: 'Test Contact',
      phone: '7025550101',
      relationship: 'Friend',
    },
  }
  const commandData = {
    ...signatureData,
    waiverId: waiver,
    formVersion: 2,
    answers: {},
    riskDisclosureId: risk,
    riskAcknowledged: true,
  }
  // First trip includes both independent layers; one transaction preserves capacity and evidence.
  const first = await asUser(
    f.users[0],
    `select public.registration_command('${f.trip}','register','${randomUUID()}',0,${literal(JSON.stringify(commandData))})`,
  )
  assert.equal(first.state, 'confirmed')
  assert.equal(first.waiverSigned, true)
  assert.equal(first.risksAcknowledged, true)
  const profile = await asUser(f.users[0], 'select public.get_annual_waivers()')
  assert.equal(profile.history.length, 1)
  const { createUnlvWaiver } = await import(
    '../../lib/registration/unlv-waiver.ts'
  )
  assert.equal(
    profile.history[0].body,
    createUnlvWaiver(
      fields.event,
      `July 1, ${currentYear} – June 30, ${currentYear + 1}`,
      fields.risks,
    ),
  )
  const original = profile.history[0]
  // A proactive profile signature is reusable; concurrent devices create one active signature.
  const signatures = await Promise.all(
    Array.from({ length: 3 }, () =>
      asUser(
        f.users[1],
        `select to_jsonb(public.sign_annual_waiver('${waiver}','${randomUUID()}',${literal(JSON.stringify(signatureData))}))`,
      ),
    ),
  )
  assert.equal(new Set(signatures).size, 1)
  const returning = await asUser(
    f.users[1],
    `select public.registration_command('${f.trip}','register','${randomUUID()}',0,${literal(JSON.stringify({ formVersion: 2, answers: {}, riskDisclosureId: risk, riskAcknowledged: true }))})`,
  )
  assert.equal(returning.waiverSigned, true)
  assert.equal(returning.state, 'confirmed')
  // Formatting does not change revision, but new risk wording does.
  assert.equal(
    await disclose(f.trip, 1, ['  Exposed   desert heat with little shade.  ']),
    risk,
  )
  const newRisk = await disclose(f.trip, 1, [
    'Exposed scrambling where a fall could cause serious injury.',
  ])
  let snapshot = await asUser(
    f.users[0],
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(snapshot.state, 'confirmed')
  assert.equal(snapshot.risksAcknowledged, false)
  assert.ok(snapshot.requirements.some(x => x.includes('informed risks')))
  await assert.rejects(
    asUser(
      f.users[0],
      `select public.registration_command('${f.trip}','update_response','${randomUUID()}',1,${literal(JSON.stringify({ formVersion: 2, answers: {}, riskDisclosureId: risk, riskAcknowledged: true }))})`,
    ),
    /risks changed/,
  )
  await asUser(
    f.users[0],
    `select public.registration_command('${f.trip}','update_response','${randomUUID()}',1,${literal(JSON.stringify({ formVersion: 2, answers: {}, riskDisclosureId: newRisk, riskAcknowledged: true }))})`,
  )
  await asUser(
    f.users[0],
    `select to_jsonb(public.withdraw_annual_waiver('${original.signatureId}'))`,
  )
  snapshot = await asUser(
    f.users[0],
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(snapshot.state, 'confirmed')
  assert.equal(snapshot.waiverSigned, false)
  assert.match(snapshot.waiverReason, /withdrawn/)
  const again = await asUser(
    f.users[0],
    `select to_jsonb(public.sign_annual_waiver('${waiver}','${randomUUID()}',${literal(JSON.stringify(signatureData))}))`,
  )
  assert.notEqual(again, original.signatureId)
  const after = await asUser(f.users[0], 'select public.get_annual_waivers()')
  assert.equal(after.history.length, 2)
  assert.equal(after.history[1].body, original.body)
  assert.equal(after.history[1].signedAt, original.signedAt)
  assert.ok(after.history[1].withdrawnAt)
  // Publishing a replacement preserves all signatures and explains re-signing.
  const replacement = await create()
  await asUser(
    f.owner,
    `select to_jsonb(public.publish_annual_waiver('${replacement}','Test replacement review'))`,
  )
  snapshot = await asUser(
    f.users[0],
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(snapshot.state, 'confirmed')
  assert.equal(snapshot.waiverSigned, false)
  assert.match(snapshot.waiverReason, /updated/)
  await disclose(f.trip, 2, ['Cold water immersion.'], ['kayaking'])
  snapshot = await asUser(
    f.users[0],
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(snapshot.waiverSigned, false)
  assert.match(snapshot.waiverReason, /outside/)
  // A trip in the next academic year cannot inherit this year's signature.
  sql(
    `update public.trips set starts_at='${currentYear + 1}-07-10T12:00Z',ends_at='${currentYear + 1}-07-11T12:00Z' where id='${f.trip}'`,
  )
  snapshot = await asUser(
    f.users[0],
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(snapshot.state, 'confirmed')
  assert.equal(snapshot.waiverSigned, false)
  assert.equal(snapshot.waiver, null)
  await assert.rejects(
    asUser(
      f.users[2],
      `select to_jsonb(public.withdraw_annual_waiver('${again}'))`,
    ),
    /not found/,
  )
  await assert.rejects(
    asUser(
      f.users[2],
      `select to_jsonb(public.create_annual_waiver(${literal(JSON.stringify(fields))}))`,
    ),
    /permission/,
  )
  await assert.rejects(
    asUser(
      f.users[2],
      `update public.registration_signatures set signature_name='Forged' where id='${again}' returning to_jsonb(registration_signatures)`,
    ),
    /permission/,
  )
})

test('annual guardian verification, immutable merge evidence, duplicate signing and past trip accuracy', async () => {
  const f = fixture(20)
  const user = f.users[0]
  const retained = f.users[1]
  const currentYear =
    new Date().getUTCFullYear() - (new Date().getUTCMonth() < 6 ? 1 : 0)
  const fields = {
    event: 'Hiking annual review fixture',
    sponsor: 'UNLV Mountain Club',
    effectiveFrom: `${currentYear}-07-01`,
    activities: ['hiking'],
    risks: 'Hiking involves falls, heat illness, serious injury and death.',
  }
  const waiver = await asUser(
    f.owner,
    `select to_jsonb(public.create_annual_waiver(${literal(JSON.stringify(fields))}))`,
  )
  await asUser(
    f.owner,
    `select to_jsonb(public.publish_annual_waiver('${waiver}','Reviewed fixture only'))`,
  )
  const risk = await asUser(
    f.owner,
    `select to_jsonb(public.save_trip_informed_risks('${f.trip}',0,array['Steep rocky terrain.'],array['hiking']))`,
  )
  sql(
    `update public.trip_registration_settings set waiver_required=true where trip_id='${f.trip}';update public.account_age_declarations set is_18_or_older=false where user_id='${user}'`,
  )
  await asUser(
    user,
    `select to_jsonb(public.request_annual_guardian_review('${waiver}'))`,
  )
  const guardianData = {
    guardianDocument: {
      guardianName: 'Test Parent',
      signedOn: new Date().toISOString().slice(0, 10),
      reference: 'Restricted signed document fixture',
      verified: true,
    },
    evidence: 'Verified identity, authority, signature and complete form.',
  }
  await assert.rejects(
    asUser(
      retained,
      `select to_jsonb(public.verify_annual_guardian('${waiver}','${user}',${literal(JSON.stringify(guardianData))}))`,
    ),
    /permission/,
  )
  const signature = await asUser(
    f.owner,
    `select to_jsonb(public.verify_annual_guardian('${waiver}','${user}',${literal(JSON.stringify(guardianData))}))`,
  )
  assert.equal(
    await asUser(
      f.owner,
      `select to_jsonb(public.verify_annual_guardian('${waiver}','${user}',${literal(JSON.stringify(guardianData))}))`,
    ),
    signature,
  )
  let snapshot = await asUser(
    user,
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(snapshot.waiverSigned, true)
  assert.deepEqual(snapshot.eligibilityReasons, [])
  const request = randomUUID()
  const data = {
    formVersion: 2,
    answers: {},
    riskAcknowledged: true,
    riskDisclosureId: risk,
  }
  snapshot = await asUser(
    user,
    `select public.registration_command('${f.trip}','register','${request}',0,${literal(JSON.stringify(data))})`,
  )
  assert.equal(snapshot.state, 'confirmed')
  const retry = await asUser(
    user,
    `select public.registration_command('${f.trip}','register','${request}',0,${literal(JSON.stringify(data))})`,
  )
  assert.equal(retry.revision, snapshot.revision)
  sql(`select public.merge_trip_registrations('${retained}','${user}')`)
  const history = await asUser(retained, 'select public.get_annual_waivers()')
  assert.equal(history.history[0].signatureId, signature)
  assert.equal(
    sql(
      `select original_signer_id from public.registration_signatures where id='${signature}'`,
    ),
    user,
  )
  assert.equal(
    sql(
      `select user_id from public.registration_risk_acknowledgements where disclosure_id='${risk}'`,
    ),
    user,
  )
  snapshot = await asUser(
    retained,
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(snapshot.waiverSigned, true)
  assert.equal(snapshot.risksAcknowledged, true)
  // Move fixture trip just after the signature/publication time but before withdrawal.
  sql(
    `update public.trips set starts_at=clock_timestamp()-interval '1 millisecond',ends_at=clock_timestamp() where id='${f.trip}'`,
  )
  await asUser(
    retained,
    `select to_jsonb(public.withdraw_annual_waiver('${signature}'))`,
  )
  snapshot = await asUser(
    retained,
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(snapshot.waiverSigned, true)
  assert.equal(snapshot.state, 'confirmed')
  const newer = await asUser(
    f.owner,
    `select to_jsonb(public.create_annual_waiver(${literal(JSON.stringify(fields))}))`,
  )
  await asUser(
    f.owner,
    `select to_jsonb(public.publish_annual_waiver('${newer}','Replacement review fixture'))`,
  )
  snapshot = await asUser(
    retained,
    `select public.get_trip_registration('${f.trip}')`,
  )
  assert.equal(snapshot.waiver.id, waiver)
  assert.equal(snapshot.waiverSigned, true)
  assert.throws(
    () =>
      sql(
        `update public.registration_waivers set body='Changed' where id='${waiver}'`,
      ),
    /immutable/,
  )
  assert.throws(
    () =>
      sql(`delete from public.registration_signatures where id='${signature}'`),
    /immutable/,
  )
})
