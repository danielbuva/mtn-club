import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  createLocalDatabase,
  dropLocalDatabase,
  sql,
} from '../../scripts/local-database.mjs'

test('trip forms require valid participant and emergency contact details', () => {
  const { database } = createLocalDatabase((name, db) => {
    if (name === '20261106063651_reuse_saved_registration_contacts.sql') {
      sql(
        `insert into auth.users(id,email) values
        ('10000000-0000-4000-8000-000000000011','saved-contact@example.test'),
        ('10000000-0000-4000-8000-000000000012','incomplete-contact@example.test');
        insert into public.admin_user_roles(user_id,role_id) select '10000000-0000-4000-8000-000000000011',id from public.admin_roles where is_super_admin;
        begin; set local "request.jwt.claim.sub"='10000000-0000-4000-8000-000000000011';
        insert into public.trips(id,title,created_by,starts_at,ends_at) values
        ('10000000-0000-4000-8000-000000000013','Previously completed contacts','10000000-0000-4000-8000-000000000011',now()+interval '2 days',now()+interval '3 days');
        update public.trip_registration_settings set form_version=3,annual_waiver=false,waiver_required=false,eligibility='account' where trip_id='10000000-0000-4000-8000-000000000013';
        insert into public.trip_rsvps(trip_id,user_id,status,registration_state) values
        ('10000000-0000-4000-8000-000000000013','10000000-0000-4000-8000-000000000011','going','confirmed'),
        ('10000000-0000-4000-8000-000000000013','10000000-0000-4000-8000-000000000012','removed','incomplete');
        insert into public.registration_responses(trip_id,user_id,form_version,answers,emergency_contact) values
        ('10000000-0000-4000-8000-000000000013','10000000-0000-4000-8000-000000000011',2,'{}','{"name":"Existing Friend","relationship":"Friend","phone":"7025550124"}'),
        ('10000000-0000-4000-8000-000000000013','10000000-0000-4000-8000-000000000012',0,'{}','{}');
        insert into public.profile_private(user_id,phone) values('10000000-0000-4000-8000-000000000011','7025550123') on conflict(user_id) do update set phone=excluded.phone;
        commit;`,
        db,
      )
    }

    if (name === '20261105040001_atomic_account_merge.sql') {
      // The local integration stack runs Auth without Storage.
      sql(
        `create schema if not exists storage;
        create table if not exists storage.buckets(id text primary key,name text not null,owner uuid,owner_id text);
        create table if not exists storage.objects(id uuid primary key,bucket_id text references storage.buckets(id),name text,owner uuid,owner_id text);`,
        db,
      )
    }
  })
  try {
    const trip = "'10000000-0000-4000-8000-000000000013'"
    const member = "'10000000-0000-4000-8000-000000000011'"
    assert.equal(
      sql(
        `select form_version from public.registration_responses where trip_id=${trip} and user_id=${member}`,
        database,
      ),
      '3',
    )
    assert.equal(
      sql(
        `select cardinality(registration_private.requirements(${trip},${member}))`,
        database,
      ),
      '0',
    )
    assert.equal(
      sql(
        `select form_version from public.registration_responses where trip_id=${trip} and user_id='10000000-0000-4000-8000-000000000012'`,
        database,
      ),
      '0',
    )

    sql(
      'alter table public.trip_registration_settings alter column annual_waiver set default false',
      database,
    )
    sql(
      readFileSync(
        new URL('../registration-saved-contact.sql', import.meta.url),
        'utf8',
      ),
      database,
    )
    sql(
      readFileSync(
        new URL('../registration-required-contact.sql', import.meta.url),
        'utf8',
      ),
      database,
    )
  } finally {
    dropLocalDatabase(database)
  }
})
