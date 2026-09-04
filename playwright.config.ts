import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node tests/browser/mock-supabase.mjs',
      url: 'http://127.0.0.1:54399/health',
      reuseExistingServer: false,
    },
    {
      command: 'pnpm dev --hostname 127.0.0.1 --port 3100',
      url: 'http://127.0.0.1:3100/auth/login',
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        AUTH_BROWSER_TEST: 'true',
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54399',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'isolated-browser-test-key',
        SUPABASE_SECRET_KEY: 'isolated-browser-test-secret',
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
        NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3100',
        AUTH_RELEASE_ENV: 'test',
        VERCEL_ENV: 'preview',
      },
    },
  ],
})
