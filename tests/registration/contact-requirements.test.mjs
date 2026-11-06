import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  createLocalDatabase,
  dropLocalDatabase,
  sql,
} from '../../scripts/local-database.mjs'

test('trip forms require valid participant and emergency contact details', () => {
  const { database } = createLocalDatabase((name, db) => {
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
    sql(
      'alter table public.trip_registration_settings alter column annual_waiver set default false',
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
