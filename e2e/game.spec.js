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

// Advances the fake clock until Santa circles over the city (the waiting notice is shown).
async function waitForArrival(page) {
  const waiting = page.locator('#notice .notice-waiting');
  for (let i = 0; i < 40 && !(await waiting.isVisible()); i++) {
    await page.clock.runFor(1000);
  }
  await expect(waiting).toBeVisible();
}

// Plays the six cities: a right answer is given at once (an express delivery), a wrong one is
// followed by "Seguir".
// With `lates` (needs page.clock.install() before the page loads), the answer of a city whose entry
// is true waits until Santa has reached the city (not an express delivery); the flight is made
// fast by advancing the fake clock.
async function playGame(page, rights, lates = []) {
  for (let city = 1; city <= rights.length; city++) {
    await expect(page.locator('#scoreboard-city')).toContainText('Ciudad ' + city + '/6');
    await expect(page.locator('#options button:enabled')).toHaveCount(4);
    if (lates[city - 1]) {
      await waitForArrival(page);
    }
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

// The late answers need the fake clock, installed before the page loads. The pauses and notices
// after an answer are fast-forwarded too.
async function playWithClock(page, rights, lates) {
  await page.clock.install();
  await startGame(page);
  await playGame(page, rights, lates);
  for (let i = 0; i < 40 && !(await page.locator('#screen-result').isVisible()); i++) {
    await page.clock.runFor(1000);
  }
  await expect(page.locator('#screen-result')).toBeVisible();
}

test('a full run with no express deliveries ends with three stars and the way to the fourth', async ({ page }) => {
  await playWithClock(page, SIX_RIGHT, SIX_RIGHT);

  await expect(page.locator('#result-stars')).toHaveText('⭐⭐⭐☆☆');
  await expect(page.locator('#result-stars')).toHaveAttribute('aria-label', '3 de 5 estrellas');
  await expect(page.locator('#result-next-star')).toHaveText('Siguiente estrella: 6 regalos y 3 entregas exprés ⚡.');
  await expect(page.locator('#result-express')).toHaveText('Entregas exprés: 0 ⚡');
});

test('a full run with three express deliveries ends with four stars and the way to the fifth', async ({ page }) => {
  await playWithClock(page, SIX_RIGHT, [false, false, false, true, true, true]);

  await expect(page.locator('#result-stars')).toHaveText('⭐⭐⭐⭐☆');
  await expect(page.locator('#result-stars')).toHaveAttribute('aria-label', '4 de 5 estrellas');
  await expect(page.locator('#result-next-star')).toHaveText('Última estrella: ¡las 6 entregas exprés ⚡!');
  await expect(page.locator('#result-express')).toHaveText('Entregas exprés: 3 ⚡');
});
