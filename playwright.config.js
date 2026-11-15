// Browser tests: they drive the real game. The unit tests live in tests/.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  projects: [
    { name: 'desktop', testIgnore: 'phone.spec.js', use: { browserName: 'chromium' } },
    // An emulated iPhone on WebKit, the engine behind Safari.
    { name: 'phone', testMatch: 'phone.spec.js', use: { ...devices['iPhone 13'] } },
  ],
});
