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

  test('the five stars fit on one line', async ({ page }) => {
    await startGame(page);
    await playGame(page, SIX_RIGHT);

    await expect(page.locator('#screen-result')).toBeVisible({ timeout: 15_000 });
    const stars = page.locator('#result-stars');
    await expect(stars).toHaveText('⭐⭐⭐⭐⭐');
    const m = await stars.evaluate((node) => {
      const box = node.getBoundingClientRect();
      return {
        height: box.height,
        left: box.left,
        right: box.right,
        fontSize: parseFloat(getComputedStyle(node).fontSize),
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
      };
    });
    expect(m.height).toBeLessThan(2 * m.fontSize);
    expect(m.scrollWidth).toBeLessThanOrEqual(m.clientWidth);
    expect(m.left).toBeGreaterThanOrEqual(0);
    expect(m.right).toBeLessThanOrEqual(360);
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

// Plays the six cities: a right answer is given at once (an express delivery), a wrong one is
// followed by "Seguir".
async function playGame(page, rights) {
  for (let city = 1; city <= rights.length; city++) {
    await expect(page.locator('#scoreboard-city')).toContainText('Ciudad ' + city + '/6');
    await expect(page.locator('#options button:enabled')).toHaveCount(4);
    await answer(page, rights[city - 1]);
    if (!rights[city - 1]) {
      await page.locator('#button-next').click();
    }
  }
}

const SIX_RIGHT = [true, true, true, true, true, true];

test('a game with six express deliveries ends with five stars and no script errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await startGame(page);

  await playGame(page, SIX_RIGHT);

  await expect(page.locator('#screen-result')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#result-title')).toHaveText('¡Nivel superado!');
  await expect(page.locator('#result-stars')).toHaveText('⭐⭐⭐⭐⭐');
  await expect(page.locator('#result-stars')).toHaveAttribute('aria-label', '5 de 5 estrellas');
  await expect(page.locator('#result-next-star')).toHaveText('¡Puntuación perfecta!');
  await expect(page.locator('#result-gifts')).toHaveText('Has entregado 6 de 6 regalos.');
  expect(errors).toEqual([]);
});

test('a game with four gifts ends with one star and the way to the next one', async ({ page }) => {
  await startGame(page);

  await playGame(page, [false, false, true, true, true, true]);

  await expect(page.locator('#screen-result')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#result-stars')).toHaveText('⭐☆☆☆☆');
  await expect(page.locator('#result-stars')).toHaveAttribute('aria-label', '1 de 5 estrellas');
  await expect(page.locator('#result-next-star')).toHaveText('Siguiente estrella: entrega más regalos.');
});

test('a failed game after a passed one shows no stars and no next-star text', async ({ page }) => {
  await startGame(page);
  await playGame(page, SIX_RIGHT);
  await expect(page.locator('#screen-result')).toBeVisible({ timeout: 15_000 });
  await page.locator('#button-again').click();
  await expect(page.locator('#options button')).toHaveCount(4);

  await playGame(page, [false, false, false, false, false, false]);

  await expect(page.locator('#screen-result')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#result-stars')).toBeHidden();
  await expect(page.locator('#result-next-star')).toBeHidden();
});
