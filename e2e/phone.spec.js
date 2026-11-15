// Plays the game as an emulated phone (screen size, pixel density, touch and user agent). The
// phone and its browser engine are chosen by the "phone" project in playwright.config.js.
const { test, expect } = require('@playwright/test');
const { startGame, answer, pageScrolls } = require('./helpers');

test('on a phone, the four answers fit and a wrong answer brings "Seguir" into view', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await startGame(page);

  for (const option of await page.locator('#options button').all()) {
    await expect(option).toBeInViewport({ ratio: 1 });
  }
  expect(await pageScrolls(page)).toBe(false);

  await answer(page, false);
  const next = page.locator('#button-next');
  await expect(next).toBeInViewport({ ratio: 1 });

  await next.tap();
  await expect(page.locator('#scoreboard-city')).toContainText('Ciudad 2/6');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('#options button').last()).toBeInViewport({ ratio: 1 });
  expect(errors).toEqual([]);
});
