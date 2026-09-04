import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/integration/browser',
  workers: 1,
  fullyParallel: false,
  timeout: 90000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3130',
    actionTimeout: 10000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'node tests/integration/start-app.mjs',
    url: 'http://127.0.0.1:3130/auth/login',
    reuseExistingServer: false,
    timeout: 120000,
  },
})
