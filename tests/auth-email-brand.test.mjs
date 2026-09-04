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
      /src="\{\{ \.SiteURL \}\}\/email\/club-wordmark-v1\.png"/,
    )
    assert.match(html, /alt="UNLV Mountain Club"/)
    assert.match(html, /max-width:100%;height:auto/)
    assert.doesNotMatch(html, /<svg|data:image/)
  }
})
