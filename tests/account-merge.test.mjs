import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import { z } from 'zod'

const primary = '46b12ebe-f929-4dc3-a6eb-adad5a204403'
const secondary = '2cf113ab-19dc-4b7c-9130-bf6eeabdc343'
const source = readFileSync(
  new URL('../app/api/admin/account-merge/route.ts', import.meta.url),
  'utf8',
)
function fixture({
  permission = true,
  mergeError = null,
  mergeReject = false,
  deleteErrors = [],
  completionErrors = [],
} = {}) {
  const operations = []
  let transferred = false
  let completed = false
  let transfers = 0
  const admin = {
    async rpc(name, args) {
      operations.push([name, args])
      if (name === 'complete_account_merge') {
        const error = completionErrors.shift() ?? null
        if (!error) completed = true
        return { data: !error, error }
      }
      assert.equal(name, 'merge_accounts')
      if (mergeReject) throw new Error('Connection interrupted')
      if (mergeError) return { data: null, error: mergeError }
      const resumed = transferred
      if (!args.p_dry_run && !transferred) {
        transferred = true
        transfers++
      }
      return {
        data: {
          counts: { secondary_trip_drafts_created_by: 1 },
          status: completed
            ? 'completed'
            : transferred
              ? 'pending_auth_delete'
              : 'preview',
          resumed,
        },
        error: null,
      }
    },
    auth: {
      admin: {
        async deleteUser(...args) {
          assert.deepEqual(args, [secondary])
          operations.push(['deleteUser', ...args])
          return { error: deleteErrors.shift() ?? null }
        },
      },
    },
  }
  const dependencies = {
    'next/server': {
      NextResponse: {
        json: (body, options) => ({ body, status: options?.status ?? 200 }),
      },
    },
    zod: { z },
    '@/lib/supabase/admin': { createAdminClient: () => admin },
    '@/lib/supabase/server': {
      createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: { id: 'actor' } } }) },
        rpc: async () => ({ data: permission, error: null }),
      }),
    },
  }
  const exports = {}
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  new Function('require', 'exports', compiled)(name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`)
    return dependencies[name]
  }, exports)
  return {
    operations,
    transfers: () => transfers,
    submit: (body = {}) =>
      exports.POST(
        new Request('http://localhost/api/admin/account-merge', {
          method: 'POST',
          body: JSON.stringify({
            primaryUserId: primary,
            secondaryUserId: secondary,
            ...body,
          }),
        }),
      ),
  }
}

test('merge defaults to a permission-safe RPC preview without auth deletion', async () => {
  const f = fixture()
  const response = await f.submit()
  assert.equal(response.status, 200)
  assert.equal(response.body.applied, false)
  assert.deepEqual(f.operations, [
    [
      'merge_accounts',
      {
        p_actor: 'actor',
        p_primary: primary,
        p_secondary: secondary,
        p_dry_run: true,
      },
    ],
  ])
})
test('merge permission and self-merge guards run before database mutation', async () => {
  const denied = fixture({ permission: false })
  assert.equal((await denied.submit({ dryRun: false })).status, 403)
  assert.equal(denied.operations.length, 0)
  const same = fixture()
  assert.equal(
    (await same.submit({ secondaryUserId: primary, dryRun: false })).status,
    400,
  )
  assert.equal(same.operations.length, 0)
})
test('database rejection leaves auth untouched and returns an actionable error', async () => {
  const f = fixture({
    mergeError: {
      code: '22023',
      message: 'Secondary account holds a privileged role.',
    },
  })
  const response = await f.submit({ dryRun: false })
  assert.equal(response.status, 409)
  assert.match(response.body.error, /privileged role.*retry the same pair/)
  assert.equal(f.operations.length, 1)
})
test('successful merge hard-deletes auth only after the database RPC', async () => {
  const f = fixture()
  const response = await f.submit({ dryRun: false })
  assert.equal(response.status, 200)
  assert.equal(response.body.status, 'completed')
  assert.deepEqual(
    f.operations.map(operation => operation[0]),
    ['merge_accounts', 'deleteUser', 'complete_account_merge'],
  )
})
test('failed auth deletion resumes without repeating the database transfer', async () => {
  const f = fixture({ deleteErrors: [{ status: 503, message: 'Unavailable' }] })
  const failed = await f.submit({ dryRun: false })
  assert.equal(failed.status, 503)
  assert.equal(failed.body.applied, true)
  assert.equal(failed.body.status, 'pending_auth_delete')
  assert.match(failed.body.error, /Retry the same account pair/)
  const retried = await f.submit({ dryRun: false })
  assert.equal(retried.status, 200)
  assert.equal(retried.body.resumed, true)
  assert.equal(f.transfers(), 1)
})
test('interrupted acknowledgement resumes even after the auth user is gone', async () => {
  const f = fixture({
    completionErrors: [{ message: 'Interrupted completion' }],
    deleteErrors: [null, { status: 404, code: 'user_not_found' }],
  })
  assert.equal((await f.submit({ dryRun: false })).status, 503)
  assert.equal((await f.submit({ dryRun: false })).status, 200)
  assert.equal(f.transfers(), 1)
  const count = f.operations.length
  const completed = await f.submit({ dryRun: false })
  assert.equal(completed.status, 200)
  assert.equal(completed.body.status, 'completed')
  assert.equal(f.operations.length, count + 1)
})

test('uncertain database transport failures request the same pair without deleting auth', async () => {
  const f = fixture({ mergeReject: true })
  const response = await f.submit({ dryRun: false })
  assert.equal(response.status, 503)
  assert.match(response.body.error, /Retry the same account pair/)
  assert.equal(f.operations.length, 1)
})
