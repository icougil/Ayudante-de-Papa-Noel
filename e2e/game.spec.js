// Drives the real game in desktop Chromium, at the window sizes that used to break the layout.
const { test, expect } = require('@playwright/test');
const { startGame, answer, pageScrolls } = require('./helpers');

test.describe('on a small phone (360x640)', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('the question and its four answers fit without scrolling', async ({ page }) => {
    await startGame(page);

    for (const option of await page.locator('#options button').all()) {
      await expect(option).toBeInViewport({ ratio: 1 });
    }
    expect(await pageScrolls(page)).toBe(false);
  });

  test('the empty notice stays rendered, so screen readers announce what is written into it', async ({ page }) => {
    await startGame(page);

    const notice = page.locator('#notice');
    await expect(notice).toBeEmpty();
    await expect(notice).toHaveAttribute('aria-live', 'polite');
    await expect(notice).not.toHaveCSS('display', 'none');
  });

  test('the longest prompt of the bank still fits without scrolling', async ({ page }) => {
    await startGame(page);

    await page.evaluate(() => {
      const prompts = globalThis.APN.QUESTIONS.map((q) => q.prompt);
      const longest = prompts.reduce((a, b) => (b.length > a.length ? b : a));
      document.getElementById('prompt').textContent = longest;
    });

    await expect(page.locator('#options button').last()).toBeInViewport({ ratio: 1 });
    expect(await pageScrolls(page)).toBe(false);
  });

  test('a wrong answer brings "Seguir" into view, and the next question starts at the top', async ({ page }) => {
    await startGame(page);

    await answer(page, false);
    const next = page.locator('#button-next');
    await expect(next).toBeInViewport({ ratio: 1 });

    await next.click();
    await expect(page.locator('#scoreboard-city')).toContainText('Ciudad 2/6');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator('#options button').last()).toBeInViewport({ ratio: 1 });
  });
});

test.describe('on a small laptop window (900x645)', () => {
  test.use({ viewport: { width: 900, height: 645 } });

  test('a wrong answer leaves "Seguir" in view', async ({ page }) => {
    await startGame(page);

    await answer(page, false);

    await expect(page.locator('#button-next')).toBeInViewport({ ratio: 1 });
  });
});

test('a game with six right answers ends with three stars and no script errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await startGame(page);

  for (let city = 1; city <= 6; city++) {
    await expect(page.locator('#scoreboard-city')).toContainText('Ciudad ' + city + '/6');
    await expect(page.locator('#options button:enabled')).toHaveCount(4);
    await answer(page, true);
  }

  await expect(page.locator('#screen-result')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#result-title')).toHaveText('¡Nivel superado!');
  await expect(page.locator('#result-stars')).toHaveText('⭐⭐⭐');
  await expect(page.locator('#result-gifts')).toHaveText('Has entregado 6 de 6 regalos.');
  expect(errors).toEqual([]);
});
