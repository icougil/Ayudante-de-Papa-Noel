// The tab icon: declared inline, so the browser never asks the server for /favicon.ico, which
// the published site does not have.
const { test, expect } = require('@playwright/test');
const { openGame } = require('./helpers');

test('the page declares an inline icon, so no favicon file is requested', async ({ page }) => {
  await openGame(page);
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toMatch(/^data:image\/svg\+xml,/);
});
