// Writes the Supabase Auth templates from lib/email/{auth,account}-templates.ts.
// `node scripts/build-auth-emails.ts --check` fails when the files are stale.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { accountTemplates } from '../lib/email/account-templates.ts'
import { authTemplates } from '../lib/email/auth-templates.ts'
import { resendTemplates } from '../lib/email/resend-templates.ts'

const check = process.argv.includes('--check')
const stale: string[] = []
const outputs = [
  ...[...authTemplates, ...accountTemplates].map(t => ({
    path: `../supabase/templates/${t.file}`,
    html: t.html,
  })),
  ...resendTemplates.map(t => ({
    path: `../docs/email/resend/${t.file}`,
    html: t.html,
  })),
]
mkdirSync(new URL('../docs/email/resend/', import.meta.url), {
  recursive: true,
})
for (const template of outputs) {
  const target = new URL(template.path, import.meta.url)
  if (check) {
    if (readFileSync(target, 'utf8') !== template.html)
      stale.push(template.path)
  } else {
    writeFileSync(target, template.html)
  }
}
if (stale.length > 0) {
  console.error(
    `Stale email templates: ${stale.join(', ')}. Run node scripts/build-auth-emails.ts.`,
  )
  process.exit(1)
}
console.log(check ? 'Email templates are current.' : 'Wrote email templates.')
