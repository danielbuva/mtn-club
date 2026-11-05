import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { applyBaseline } from './database-baseline.mjs'

// Deliberately no URL/credential overrides: only the shared local integration container.
export const container = 'supabase_db_mtn-auth-integration'
const maxBuffer = 32 * 1024 * 1024
const docker = (args, input) =>
  execFileSync(
    'docker',
    ['exec', ...(input ? ['-i'] : []), container, ...args],
    {
      input,
      maxBuffer,
    },
  )

export function sql(query, database) {
  if (!/^mtn_replay_[a-f0-9_]+$/.test(database) && database !== 'postgres') {
    throw new Error('Only throwaway replay databases are allowed')
  }
  return docker(
    [
      'psql',
      '-U',
      'supabase_admin',
      '-d',
      database,
      '-X',
      '-qAt',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    query,
  )
    .toString()
    .trim()
}

export function createLocalDatabase(beforeMigration) {
  const database = `mtn_replay_${randomUUID().replaceAll('-', '_')}`
  const listPath = `/tmp/${database}.list`
  sql(`create database ${database} template template0`, 'postgres')
  try {
    // Copy platform DDL only. Never copy rows or application schemas from the stack.
    const archive = docker([
      'pg_dump',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '--schema-only',
      '--format=custom',
      '--exclude-schema=public',
      '--exclude-schema=registration_private',
      '--exclude-schema=supabase_migrations',
    ])
    const list = docker(['pg_restore', '--list'], archive).toString()
    // Application-owned triggers on platform tables are recreated by our migrations.
    const triggers = sql(
      `select n.nspname || ' ' || c.relname || ' ' || t.tgname
      from pg_trigger t join pg_class c on c.oid=t.tgrelid
      join pg_namespace n on n.oid=c.relnamespace
      join pg_proc p on p.oid=t.tgfoid join pg_namespace f on f.oid=p.pronamespace
      where not t.tgisinternal and f.nspname in ('public','registration_private')`,
      'postgres',
    ).split('\n')
    const platformList = list
      .split('\n')
      .filter(
        line =>
          !triggers.some(
            trigger => trigger && line.includes(` TRIGGER ${trigger} `),
          ),
      )
      .join('\n')
    docker(['sh', '-c', `cat > ${listPath}`], platformList)
    docker(
      [
        'pg_restore',
        '-U',
        'supabase_admin',
        '-d',
        database,
        '--no-owner',
        '--exit-on-error',
        '--use-list',
        listPath,
      ],
      archive,
    )
    sql(
      'create schema if not exists public authorization postgres; alter schema public owner to postgres',
      database,
    )
    const plan = applyBaseline(
      query => sql(query, database),
      beforeMigration && (name => beforeMigration(name, database)),
    )
    return { database, plan }
  } catch (error) {
    dropLocalDatabase(database)
    throw error
  } finally {
    docker(['rm', '-f', listPath])
  }
}

export function dropLocalDatabase(database) {
  if (!/^mtn_replay_[a-f0-9_]+$/.test(database))
    throw new Error('Not a replay database')
  sql(`drop database if exists ${database} with (force)`, 'postgres')
}
