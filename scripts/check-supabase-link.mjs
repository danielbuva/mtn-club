import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
assert.ok(url, 'NEXT_PUBLIC_SUPABASE_URL is required')

let linkedRef = ''
try {
  linkedRef = (await readFile('supabase/.temp/project-ref', 'utf8')).trim()
} catch {
  throw new Error(
    'This checkout is not linked. Authenticate with the project-owner Supabase account before linking it.',
  )
}

const configuredRef = new URL(url).hostname.split('.')[0]
assert.equal(
  linkedRef,
  configuredRef,
  'The Supabase CLI is linked to a different project than .env.local.',
)

console.log('Supabase CLI link matches NEXT_PUBLIC_SUPABASE_URL.')
