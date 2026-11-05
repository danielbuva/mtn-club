import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('email PNG stays in sync with the landing-page wordmark', () => {
  execFileSync(
    process.execPath,
    ['scripts/generate-auth-email-brand.mjs', '--check'],
    {
      cwd: new URL('../', import.meta.url),
      stdio: 'pipe',
    },
  )
})

test('auth templates are generated from lib/email/auth-templates.ts', () => {
  execFileSync(process.execPath, ['scripts/build-auth-emails.ts', '--check'], {
    cwd: new URL('../', import.meta.url),
    stdio: 'pipe',
  })
})

test('all auth templates use the public club badge with fallback text', () => {
  for (const name of [
    'confirmation',
    'recovery',
    'verification-code',
    'password-changed',
  ]) {
    const html = readFileSync(
      new URL(`../supabase/templates/${name}.html`, import.meta.url),
      'utf8',
    )
    assert.match(html, /src="\{\{ \.SiteURL \}\}\/email\/club-badge-v1\.png"/)
    assert.match(html, /alt="UNLV Mountain Club"/)
    assert.match(
      html,
      /width="168"[^>]*style="display:block;width:168px;height:auto/,
    )
    assert.doesNotMatch(html, /<svg|data:image/)
  }
})

test('auth email layout survives removal of document-level email styles', () => {
  for (const name of [
    'confirmation',
    'recovery',
    'verification-code',
    'password-changed',
  ]) {
    const html = readFileSync(
      new URL(`../supabase/templates/${name}.html`, import.meta.url),
      'utf8',
    )
    // Gmail need not retain body/main wrappers: layout must live on tables/cells.
    const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1]
    assert.ok(body)
    assert.doesNotMatch(body, /<main\b/)
    assert.match(body, /<table[^>]*width="100%"[^>]*bgcolor="#F8F1DF"/)
    assert.match(body, /<table[^>]*style="[^"]*max-width:600px/)
    assert.match(
      body,
      /<td[^>]*class="em-card"[^>]*bgcolor="#FFFCF4"[^>]*style="padding:/,
    )
    assert.match(body, /<p[^>]*font-size:16px;line-height:26px/)
    const tables = body.match(/<table\b[^>]*>/g) ?? []
    assert.ok(tables.length >= 2)
    assert.ok(tables.every(table => table.includes('role="presentation"')))
    assert.equal(tables.length, (body.match(/<\/table>/g) ?? []).length)
    assert.equal(
      (body.match(/<td\b/g) ?? []).length,
      (body.match(/<\/td>/g) ?? []).length,
    )
  }
})
