// Plays the game as an emulated phone (screen size, pixel density, touch and user agent). The
// phone and its browser engine are chosen by the "phone" project in playwright.config.js.
const { test, expect } = require('@playwright/test');
const { openGame, startGame, answer, pageScrolls } = require('./helpers');

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

test('on a phone, the switch can be tapped and a game with sound raises no error', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await startGame(page);
  const toggle = page.locator('.sound-toggle:visible');
  await toggle.tap();
  await expect(toggle).toHaveText('🔇');
  await toggle.tap();
  await expect(toggle).toHaveText('🔊');
  await expect(toggle).toBeInViewport({ ratio: 1 });
  expect(await pageScrolls(page)).toBe(false);

  await answer(page, true);
  await expect(page.locator('#scoreboard-city')).toContainText('Ciudad 2/6');
  await answer(page, false);
  await expect(page.locator('#button-next')).toBeInViewport({ ratio: 1 });

  expect(errors).toEqual([]);
});

test('a Catalan question is marked as Catalan, and the Spanish lines around it are not', async ({ page }) => {
  await openGame(page);
  // Every question of the bank becomes Catalan, so the game cannot avoid asking Catalan ones.
  await page.evaluate(() => {
    for (const q of globalThis.APN.QUESTIONS) {
      q.lang = 'ca';
    }
  });
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);

  await expect(page.locator('#prompt')).toHaveAttribute('lang', 'ca');
  await expect(page.locator('#options')).toHaveAttribute('lang', 'ca');

  const prompt = await page.locator('#prompt').textContent();
  const explanation = await page.evaluate(
    (text) => globalThis.APN.QUESTIONS.find((q) => q.prompt === text).explanation, prompt);
  await answer(page, false);

  const notice = page.locator('#notice');
  await expect(notice.locator('p', { hasText: 'La respuesta correcta era' })).not.toHaveAttribute('lang', /.*/);
  await expect(notice.locator('p', { hasText: explanation })).toHaveAttribute('lang', 'ca');
  await expect(notice.locator('p[lang]')).toHaveCount(1);
});
