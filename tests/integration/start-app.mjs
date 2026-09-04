import { spawn } from 'node:child_process'
import { origin, status } from './auth-services.mjs'

const app = spawn(
  'pnpm',
  ['dev', '--hostname', '127.0.0.1', '--port', '3130'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      AUTH_BROWSER_TEST: 'true',
      AUTH_RELEASE_ENV: 'test',
      VERCEL_ENV: 'preview',
      NEXT_PUBLIC_SITE_URL: origin,
      NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.ANON_KEY,
      SUPABASE_SECRET_KEY: status.SERVICE_ROLE_KEY,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
    },
  },
)
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => app.kill(signal))
app.on('exit', code => process.exit(code ?? 1))
