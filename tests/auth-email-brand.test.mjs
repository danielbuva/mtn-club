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

test('all auth templates use the public, responsive wordmark with fallback text', () => {
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
    assert.match(
      html,
      /src="\{\{ \.SiteURL \}\}\/email\/club-wordmark-v2\.png"/,
    )
    assert.match(html, /alt="UNLV Mountain Club"/)
    assert.match(html, /max-width:100%;height:auto/)
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
    assert.match(body, /<table[^>]*style="[^"]*max-width:568px/)
    assert.match(
      body,
      /<td[^>]*bgcolor="#F8F1DF"[^>]*style="padding:32px 24px;[^"]*font-size:16px/,
    )
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
