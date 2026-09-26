const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    baseURL: 'http://127.0.0.1:5100',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node backend/tests/dev-server.js',
    url: 'http://127.0.0.1:5100/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
