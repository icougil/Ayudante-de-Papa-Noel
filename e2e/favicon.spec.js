// The tab icon: declared inline, so the browser never asks the server for /favicon.ico, which
// the published site does not have.
const { test, expect } = require('@playwright/test');
const { openGame } = require('./helpers');

test('the page declares an inline icon that the browser can draw, so no favicon file is requested', async ({ page }) => {
  await openGame(page);
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toMatch(/^data:image\/svg\+xml,/);

  // A malformed SVG fails to load as an image, so a broken icon fails here.
  const width = await page.evaluate((src) => new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth);
    image.onerror = () => resolve(0);
    image.src = src;
  }), href);
  expect(width).toBeGreaterThan(0);
});
