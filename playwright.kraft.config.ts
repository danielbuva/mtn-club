import { defineConfig, devices } from '@playwright/test'

const externalServer = process.env.KRAFT_BASE_URL
const baseURL = externalServer ?? 'http://127.0.0.1:3130'

export default defineConfig({
  testDir: './tests/kraft',
  outputDir: './.tmp/kraft-gauntlet/regression-results',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    [
      'html',
      { outputFolder: '.tmp/kraft-gauntlet/regression-report', open: 'never' },
    ],
  ],
  use: {
    baseURL,
    serviceWorkers: 'allow',
    trace: 'on',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile-320',
      use: {
        ...devices['iPhone SE'],
        defaultBrowserType: 'chromium',
        viewport: { width: 320, height: 844 },
      },
    },
    {
      name: 'mobile-390',
      use: {
        ...devices['iPhone 13'],
        defaultBrowserType: 'chromium',
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  webServer: externalServer
    ? undefined
    : {
        command: 'node tests/kraft/serve-production.mjs',
        url: `${baseURL}/guide/kraft`,
        reuseExistingServer: false,
        timeout: 180000,
      },
})
