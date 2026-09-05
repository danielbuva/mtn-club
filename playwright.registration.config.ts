import { defineConfig, devices } from '@playwright/test'

const port = process.env.REGISTRATION_TEST_PORT ?? '3140'
export default defineConfig({
  testDir: './tests/registration/browser',
  workers: 1,
  fullyParallel: false,
  timeout: 90000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    actionTimeout: 15000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command:
      process.env.REGISTRATION_PRODUCTION_TEST === 'true'
        ? 'REGISTRATION_BUILD_ONLY=true node tests/registration/start-app.mjs && node tests/registration/start-app.mjs'
        : 'node tests/registration/start-app.mjs',
    url: `http://127.0.0.1:${port}/auth/login`,
    reuseExistingServer: process.env.REGISTRATION_REUSE_SERVER === 'true',
    timeout: 120000,
  },
})
