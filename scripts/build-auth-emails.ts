// Writes the Supabase Auth templates from lib/email/auth-templates.ts.
// `node scripts/build-auth-emails.ts --check` fails when the files are stale.
import { readFileSync, writeFileSync } from 'node:fs'
import { authTemplates } from '../lib/email/auth-templates.ts'

const check = process.argv.includes('--check')
const stale: string[] = []
for (const template of authTemplates) {
  const target = new URL(
    `../supabase/templates/${template.file}`,
    import.meta.url,
  )
  if (check) {
    if (readFileSync(target, 'utf8') !== template.html)
      stale.push(template.file)
  } else {
    writeFileSync(target, template.html)
  }
}
if (stale.length > 0) {
  console.error(
    `Stale auth templates: ${stale.join(', ')}. Run node scripts/build-auth-emails.ts.`,
  )
  process.exit(1)
}
console.log(check ? 'Auth templates are current.' : 'Wrote auth templates.')
