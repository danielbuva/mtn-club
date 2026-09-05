import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import { z } from 'zod'

const source = readFileSync(
  new URL('../app/(admin)/admin/accounts/actions.ts', import.meta.url),
  'utf8',
)
function fixture({ rolesError = false, cleanupError = false } = {}) {
  let deletions = 0
  const operations = []
  const admin = {
    auth: {
      admin: {
        getUserById: async () => ({
          data: { user: { email: 'member@example.test' } },
        }),
        deleteUser: async () => {
          deletions++
          return { error: null }
        },
      },
    },
    rpc: async () => ({ error: null }),
    from(table) {
      const response = Promise.resolve({
        data:
          table === 'account_deletion_jobs'
            ? { id: 'job' }
            : table === 'admin_roles'
              ? [{ id: 'ordinary-role' }]
              : [],
        error:
          (rolesError && table === 'admin_user_roles') ||
          (cleanupError && table === 'profiles')
            ? { message: 'database failure' }
            : null,
      })
      const builder = Object.assign(response, {
        upsert() {
          return builder
        },
        update() {
          return builder
        },
        delete() {
          operations.push([table, 'delete'])
          return builder
        },
        eq(...args) {
          operations.push([table, 'eq', ...args])
          return builder
        },
        select() {
          return builder
        },
        in(...args) {
          operations.push([table, 'in', ...args])
          return builder
        },
        single() {
          return builder
        },
      })
      return builder
    },
  }
  const dependencies = {
    'next/cache': { revalidatePath() {} },
    'next/navigation': {
      redirect(path) {
        throw new Error(`redirect:${path}`)
      },
      unstable_rethrow() {},
    },
    zod: { z },
    '@/lib/admin/auth': {
      requireAdminCapability: async () => ({
        userId: 'actor',
        isSuperAdmin: true,
      }),
    },
    '@/lib/auth/return-to': {},
    '@/lib/supabase/admin': { createAdminClient: () => admin },
  }
  const exports = {}
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  new Function('require', 'exports', 'console', compiled)(
    name => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`)
      return dependencies[name]
    },
    exports,
    { error() {} },
  )
  const submit = email => {
    const form = new FormData()
    form.set('userId', 'f608b163-54f6-4d56-a60a-53f42756ddd9')
    form.set('confirmation', email)
    return exports.permanentlyDeleteAccountAction({ error: '' }, form)
  }
  return {
    submit,
    deletions: () => deletions,
    operations,
    assign: exports.assignLeadershipRoleAction,
  }
}
test('wrong deletion confirmation returns an inline error without starting deletion', async () => {
  const f = fixture()
  assert.match(
    (await f.submit('wrong@example.test')).error,
    /Type the account email/,
  )
  assert.equal(f.deletions(), 0)
})
test('unavailable role verification blocks deletion', async () => {
  const f = fixture({ rolesError: true })
  assert.match(
    (await f.submit('member@example.test')).error,
    /could not be completed/,
  )
  assert.equal(f.deletions(), 0)
})
test('successful deletion redirects away from the deleted account', async () => {
  const f = fixture()
  await assert.rejects(
    f.submit(' MEMBER@example.test '),
    /redirect:\/admin\/accounts/,
  )
  assert.equal(f.deletions(), 1)
})
test('cleanup failure returns a recoverable error instead of a render crash', async () => {
  const f = fixture({ cleanupError: true })
  assert.match((await f.submit('member@example.test')).error, /retry cleanup/)
  assert.equal(f.deletions(), 1)
})

test('None removes only ordinary leadership roles with the existing admin authorization', async () => {
  const f = fixture()
  const form = new FormData()
  form.set('userId', 'f608b163-54f6-4d56-a60a-53f42756ddd9')
  form.set('roleId', 'none')
  await f.assign(form)
  assert.ok(
    f.operations.some(
      op =>
        JSON.stringify(op) ===
        JSON.stringify(['admin_roles', 'eq', 'is_super_admin', false]),
    ),
  )
  assert.ok(
    f.operations.some(
      op =>
        JSON.stringify(op) ===
        JSON.stringify([
          'admin_user_roles',
          'in',
          'role_id',
          ['ordinary-role'],
        ]),
    ),
  )
  assert.equal(f.deletions(), 0)
})
