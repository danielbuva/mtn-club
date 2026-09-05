import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/forms',
  workers: 1,
  timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:3140', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'node tests/registration/start-app.mjs',
    url: 'http://127.0.0.1:3140/form-lab',
    reuseExistingServer: true,
    timeout: 120000,
  },
})
