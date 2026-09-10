import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const compiled = ts.transpileModule(
  readFileSync(new URL('../lib/auth/viewer.ts', import.meta.url), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText
async function viewer({
  admin = false,
  member = false,
  provisional = false,
  restriction = 'normal',
  signedIn = true,
} = {}) {
  const client = {
    auth: {
      getUser: async () => ({
        data: {
          user: signedIn ? { id: 'user', email: 'user@example.test' } : null,
        },
      }),
    },
    from(table) {
      const builder = {
        select() {
          return builder
        },
        eq() {
          return builder
        },
        order() {
          return builder
        },
        limit() {
          return builder
        },
        async maybeSingle() {
          return {
            data:
              table === 'profiles'
                ? { user_id: 'user', display_name: 'Test' }
                : null,
          }
        },
      }
      return builder
    },
    async rpc(name) {
      return {
        data:
          name === 'has_admin_capability'
            ? admin
            : [
                {
                  access_active: member,
                  provisional_access: provisional,
                  restriction,
                },
              ],
      }
    },
  }
  const dependencies = {
    'next/server': { connection() {} },
    '@/lib/supabase/server': { createClient: async () => client },
  }
  const exports = {}
  new Function('require', 'exports', compiled)(
    name => dependencies[name],
    exports,
  )
  return exports.getViewer()
}
test('nonmember admin receives full member UI access without becoming a member', async () => {
  const result = await viewer({ admin: true })
  assert.equal(result.isAdmin, true)
  assert.equal(result.isMember, false)
  assert.equal(result.membershipState, null)
  assert.equal(result.membershipAccessLevel, 'full')
  assert.equal(result.canViewMemberContent, true)
  assert.equal(result.canCreateEvent, true)
  assert.equal(result.member.fullName, 'Test')
})
test('normal members, provisional applicants, and nonmembers retain distinct access', async () => {
  for (const [input, level, canCreate] of [
    [{ member: true }, 'full', true],
    [{ provisional: true }, 'provisional', false],
    [{}, 'none', false],
    [{ restriction: 'suspended' }, 'none', false],
    [{ signedIn: false }, 'none', false],
  ]) {
    const result = await viewer(input)
    assert.equal(result.membershipAccessLevel, level)
    assert.equal(result.canCreateEvent, canCreate)
  }
})
