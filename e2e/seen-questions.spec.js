const { test, expect } = require('@playwright/test');
const { startGame } = require('./helpers');

// With Math.random fixed, a game without memory always starts with the same question.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
});

test('a second game on the same browser does not start with the same question', async ({ page }) => {
  await startGame(page);
  const first = await page.locator('#prompt').innerText();

  await page.reload();
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);

  expect(await page.locator('#prompt').innerText()).not.toBe(first);
});

test('the game still starts when storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  });
  await startGame(page);
  await expect(page.locator('#prompt')).not.toBeEmpty();
});
