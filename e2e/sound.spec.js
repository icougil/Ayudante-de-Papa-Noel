const { test, expect } = require('@playwright/test');
const { openGame, recordSounds, startGame, answer, pageScrolls } = require('./helpers');

// Long enough for the 1.5 s boost and the 2.5 s notice of a right answer.
const ADVANCE_MS = 4_200;

// Opens the game, collects page errors and taps the title so the browser allows sound.
// With `clock`, installs the fake clock before the page loads, so a whole game can skip its pauses.
async function openWithSound(page, { clock = false } = {}) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  if (clock) await page.clock.install();
  await openGame(page);
  await page.locator('h1').click();
  return errors;
}

const state = (page) => page.evaluate(() => globalThis.APN.sound.state());

test('the music starts, speeds up for turbo and stops', async ({ page }) => {
  const errors = await openWithSound(page);
  await page.evaluate(() => globalThis.APN.sound.startMusic(0));
  await expect.poll(() => state(page)).toMatchObject({ music: true, context: 'running' });
  await page.evaluate(() => globalThis.APN.sound.setTurbo(true));
  await expect.poll(() => state(page)).toMatchObject({ turbo: true, music: true });
  await page.evaluate(() => globalThis.APN.sound.stopMusic());
  await expect.poll(() => state(page)).toMatchObject({ music: false });
  expect(errors).toEqual([]);
});

test('starting the music twice still stops with one stop', async ({ page }) => {
  const errors = await openWithSound(page);
  await page.evaluate(() => {
    globalThis.APN.sound.startMusic(0);
    globalThis.APN.sound.startMusic(0);
    globalThis.APN.sound.stopMusic();
  });
  await expect.poll(() => state(page)).toMatchObject({ music: false });
  expect(errors).toEqual([]);
});

test('every effect plays without a page error or a warning', async ({ page }) => {
  const warnings = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  const errors = await openWithSound(page);
  await page.evaluate(() => {
    const { sound, SOUND_NAMES } = globalThis.APN;
    for (const name of SOUND_NAMES) {
      sound.play(name);
      sound.play(name, 0.3);
    }
    sound.play('nope');
  });
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
  expect(warnings).toEqual([]);
});

test('turning sound off stops the music and keeps it off', async ({ page }) => {
  const errors = await openWithSound(page);
  await page.evaluate(() => globalThis.APN.sound.startMusic(0));
  await expect.poll(() => state(page)).toMatchObject({ music: true });
  expect(await page.evaluate(() => globalThis.APN.sound.toggle())).toBe(false);
  expect((await state(page)).music).toBe(false);
  await page.evaluate(() => globalThis.APN.sound.startMusic(0));
  expect((await state(page)).music).toBe(false);
  expect(errors).toEqual([]);
});

test('hiding the page suspends the sound and showing it resumes it', async ({ page }) => {
  const errors = await openWithSound(page);
  await page.evaluate(() => globalThis.APN.sound.startMusic(0));
  await expect.poll(() => state(page)).toMatchObject({ music: true, context: 'running' });
  const setHidden = (hidden) =>
    page.evaluate((value) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  await setHidden(true);
  await expect.poll(() => state(page)).toMatchObject({ context: 'suspended' });
  await setHidden(false);
  await expect.poll(() => state(page)).toMatchObject({ context: 'running' });
  expect(errors).toEqual([]);
});

// ---------- The switch ----------

const toggle = (page) => page.locator('.sound-toggle:visible');

async function playToResult(page, { clock = false } = {}) {
  for (let n = 0; n < 6; n++) {
    await answer(page, true);
    if (clock) await page.clock.runFor(ADVANCE_MS);
    if (n < 5) {
      await expect(page.locator('#scoreboard-city')).toContainText('Ciudad ' + (n + 2) + '/6');
    }
  }
  await expect(page.locator('#screen-result')).toBeVisible();
}

test('the switch is on the cover, the trip and the result screen', async ({ page }) => {
  await page.clock.install();
  await openGame(page);
  await expect(toggle(page)).toHaveCount(1);
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);
  await expect(toggle(page)).toHaveCount(1);
  await playToResult(page, { clock: true });
  await expect(toggle(page)).toHaveCount(1);
});

test('tapping the switch turns sound off and says so', async ({ page }) => {
  await openGame(page);
  const button = toggle(page);
  await button.click();
  await expect(button).toHaveText('🔇');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button).toHaveAttribute('aria-label', 'Sonido');
  expect(await page.evaluate(() => globalThis.APN.sound.isOn())).toBe(false);
  await button.click();
  await expect(button).toHaveText('🔊');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveAttribute('aria-label', 'Sonido');
  expect(await page.evaluate(() => globalThis.APN.sound.isOn())).toBe(true);
});

test('the switch is always called "Sonido"', async ({ page }) => {
  const expectAllNamed = async () => {
    const labels = await page.locator('.sound-toggle').evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute('aria-label')));
    expect(labels).toHaveLength(3);
    expect(labels).toEqual(['Sonido', 'Sonido', 'Sonido']);
  };
  await page.clock.install();
  await openGame(page);
  await expectAllNamed();
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);
  await expectAllNamed();
  await playToResult(page, { clock: true });
  await expectAllNamed();
  await toggle(page).click();
  await expect(toggle(page)).toHaveText('🔇');
  await expectAllNamed();
});

test('on the cover and the result screen the switch is in the top-right corner', async ({ page }) => {
  const expectCorner = async (section) => {
    const box = await toggle(page).boundingBox();
    const screen = await page.locator(section).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(screen.x + screen.width - (box.x + box.width) - 8)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.y - screen.y - 8)).toBeLessThanOrEqual(1);
  };
  await page.clock.install();
  await openGame(page);
  await expectCorner('#screen-start');
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);
  await playToResult(page, { clock: true });
  await expectCorner('#screen-result');
});

test('the sound choice survives a reload', async ({ page }) => {
  await openGame(page);
  await toggle(page).click();
  await page.reload();
  await expect(toggle(page)).toHaveText('🔇');
  expect(await page.evaluate(() => localStorage.getItem('apn.sound'))).toBe('off');
});

test('turning sound on during the trip starts the music', async ({ page }) => {
  await startGame(page);
  const button = toggle(page);
  await button.click();
  await expect.poll(() => state(page)).toMatchObject({ music: false });
  await button.click();
  await expect.poll(() => state(page)).toMatchObject({ music: true });
});

test('on the cover, turning sound off and on again does not start the music', async ({ page }) => {
  await openGame(page);
  const button = toggle(page);
  await button.click();
  await button.click();
  await expect(button).toHaveText('🔊');
  expect((await state(page)).music).toBe(false);
});

test('ten quick taps on the switch leave it in the state of the last tap', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await startGame(page);
  const button = toggle(page);
  for (let n = 0; n < 10; n++) {
    await button.click();
  }
  await expect(button).toHaveText('🔊');
  expect(await page.evaluate(() => globalThis.APN.sound.isOn())).toBe(true);
  await expect.poll(() => state(page)).toMatchObject({ music: true });
  expect(errors).toEqual([]);
});

// The trip's switch sits at the right end of the scoreboard, looks like a score pill, keeps a
// 44x44 tappable area and does not make the scoreboard taller.
async function expectSwitchInScoreboard(page) {
  const button = toggle(page);
  expect(await button.evaluate((node) =>
    node.parentElement.classList.contains('scoreboard') && node.parentElement.lastElementChild === node)).toBe(true);
  const box = await button.boundingBox();
  const scene = await page.locator('#scene').boundingBox();
  const noOverlap = box.x + box.width <= scene.x || box.x >= scene.x + scene.width ||
    box.y + box.height <= scene.y || box.y >= scene.y + scene.height;
  expect(noOverlap).toBe(true);
  const pill = await page.locator('.scoreboard-item').first().boundingBox();
  expect(Math.abs(box.height - pill.height)).toBeLessThanOrEqual(1);
  const viewport = page.viewportSize();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  for (const [dx, dy] of [[-21, -21], [21, -21], [-21, 21], [21, 21]]) {
    const x = cx + dx;
    const y = cy + dy;
    expect(x >= 0 && x < viewport.width && y >= 0 && y < viewport.height).toBe(true);
    const hit = await page.evaluate(([px, py]) => {
      const node = document.elementFromPoint(px, py);
      return Boolean(node && node.closest('.sound-toggle'));
    }, [x, y]);
    expect(hit).toBe(true);
  }
  const withSwitch = (await page.locator('.scoreboard').boundingBox()).height;
  await page.addStyleTag({ content: '.sound-toggle { display: none !important; }' });
  const withoutSwitch = (await page.locator('.scoreboard').boundingBox()).height;
  expect(withSwitch).toBe(withoutSwitch);
}

test.describe('on a small phone (360x640)', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('on the trip the switch is at the right end of the scoreboard and the page does not scroll', async ({ page }) => {
    await startGame(page);
    await expectSwitchInScoreboard(page);
    expect(await pageScrolls(page)).toBe(false);
    for (const option of await page.locator('#options button').all()) {
      await expect(option).toBeInViewport({ ratio: 1 });
    }
    // 200 px: the height of #scene at 360x640 during a trip before the switch was added.
    expect((await page.locator('#scene').boundingBox()).height).toBe(200);
  });
});

test('at 1280x800 the switch does not make the scoreboard taller', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await startGame(page);
  await expectSwitchInScoreboard(page);
});

// ---------- The sounds of a game ----------

const calls = (page) => page.evaluate(() => window.__soundCalls);

// Opens the game with the sound methods recorded and starts it.
async function recordedStart(page, { clock = false } = {}) {
  if (clock) await page.clock.install();
  await openGame(page);
  await recordSounds(page);
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);
}

// Answers the question on screen right and waits for the next city.
async function answerRightAndWaitFor(page, nextCity, { clock = false } = {}) {
  await answer(page, true);
  if (clock) await page.clock.runFor(ADVANCE_MS);
  await expect(page.locator('#scoreboard-city')).toContainText('Ciudad ' + nextCity + '/6');
}

// Plays the six cities, all right or all wrong, until the result screen.
async function playSix(page, right, { clock = false } = {}) {
  for (let n = 0; n < 6; n++) {
    await answer(page, right);
    if (!right) {
      await page.locator('#button-next').click();
    }
    if (clock) await page.clock.runFor(ADVANCE_MS);
    if (n < 5) {
      await expect(page.locator('#scoreboard-city')).toContainText('Ciudad ' + (n + 2) + '/6');
    }
  }
  await expect(page.locator('#screen-result')).toBeVisible();
}

test('starting a game plays the take-off and brings the music in after it', async ({ page }) => {
  await recordedStart(page);
  expect((await calls(page)).slice(0, 3)).toEqual([
    ['play', 'takeOff'],
    ['startMusic', 1.1],
    ['setTurbo', false],
  ]);
});

test('a right answer before arrival sounds like a tap and then an express delivery', async ({ page }) => {
  await recordedStart(page);
  await answer(page, true);
  await expect(page.locator('#notice')).toContainText('¡Correcto! Entrega exprés ⚡🎁');
  const recorded = await calls(page);
  const tap = recorded.findIndex((call) => call[0] === 'play' && call[1] === 'tap');
  expect(tap).toBeGreaterThan(-1);
  expect(recorded[tap + 1]).toEqual(['play', 'express']);
  expect(recorded).not.toContainEqual(['play', 'deliver']);
});

test('a wrong answer sounds like its mishap, never like a delivery', async ({ page }) => {
  await recordedStart(page);
  await answer(page, false);
  await expect(page.locator('#button-next')).toBeVisible();
  const mishapTexts = await page.evaluate(() =>
    Object.fromEntries(globalThis.APN.MISHAPS.map((m) => [m.id, m.text])));
  const notice = await page.locator('.notice-bad').textContent();
  const recorded = await calls(page);
  const mishapCalls = recorded.filter((call) => call[0] === 'play' && call[1] in mishapTexts);
  expect(mishapCalls).toHaveLength(1);
  expect(notice).toContain(mishapTexts[mishapCalls[0][1]]);
  expect(recorded).not.toContainEqual(['play', 'deliver']);
  expect(recorded).not.toContainEqual(['play', 'express']);
  const before = recorded.length;
  await page.locator('#button-next').click();
  expect((await calls(page)).slice(before)).toContainEqual(['play', 'tap']);
});

test('three right answers in a row sound the turbo and speed the music up', async ({ page }) => {
  await recordedStart(page, { clock: true });
  await answerRightAndWaitFor(page, 2, { clock: true });
  await answerRightAndWaitFor(page, 3, { clock: true });
  await answerRightAndWaitFor(page, 4, { clock: true });
  const recorded = await calls(page);
  expect(recorded).toContainEqual(['play', 'turbo', 0.5]);
  expect(recorded.filter((call) => call[0] === 'setTurbo').pop()).toEqual(['setTurbo', true]);
});

test('reaching the city without answering rings the arrival, and the late answer is a plain delivery', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => { globalThis.APN.FLIGHT_SECONDS = 1; });
  await recordSounds(page);
  await page.locator('#button-start').click();
  await expect(page.locator('#notice')).toContainText('Papá Noel da vueltas sobre');
  expect((await calls(page)).filter((call) => call[1] === 'arrive')).toEqual([['play', 'arrive']]);
  await answer(page, true);
  await expect(page.locator('#notice')).toContainText('¡Correcto! Regalo entregado 🎁');
  expect(await calls(page)).toContainEqual(['play', 'deliver']);
});

test('a passed level stops the music and plays the pass sound', async ({ page }) => {
  await recordedStart(page, { clock: true });
  await playSix(page, true, { clock: true });
  expect((await calls(page)).slice(-2)).toEqual([['stopMusic'], ['play', 'pass']]);
});

test('a level that is not passed stops the music and plays the gentle sound', async ({ page }) => {
  await recordedStart(page);
  await playSix(page, false);
  expect((await calls(page)).slice(-2)).toEqual([['stopMusic'], ['play', 'notPassed']]);
});

test('playing again takes off again', async ({ page }) => {
  await recordedStart(page, { clock: true });
  await playSix(page, true, { clock: true });
  const before = (await calls(page)).length;
  await page.locator('#button-again').click();
  await expect(page.locator('#options button')).toHaveCount(4);
  expect((await calls(page)).slice(before, before + 2)).toEqual([
    ['play', 'takeOff'],
    ['startMusic', 1.1],
  ]);
});

test('a whole game with sound on raises no page error', async ({ page }) => {
  const errors = await openWithSound(page, { clock: true });
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);
  await playToResult(page, { clock: true });
  expect(errors).toEqual([]);
});

test('a whole game with sound switched off raises no page error and never plays music', async ({ page }) => {
  const errors = await openWithSound(page, { clock: true });
  await toggle(page).click();
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);
  expect((await state(page)).music).toBe(false);
  for (let n = 0; n < 6; n++) {
    await answer(page, true);
    await page.clock.runFor(ADVANCE_MS);
    expect((await state(page)).music).toBe(false);
    if (n < 5) {
      await expect(page.locator('#scoreboard-city')).toContainText('Ciudad ' + (n + 2) + '/6');
    }
  }
  await expect(page.locator('#screen-result')).toBeVisible();
  expect((await state(page)).music).toBe(false);
  expect(errors).toEqual([]);
});

test('a whole game without AudioContext raises no page error', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    delete window.AudioContext;
    delete window.webkitAudioContext;
  });
  await page.clock.install();
  await openGame(page);
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);
  await playToResult(page, { clock: true });
  expect((await state(page)).context).toBe('none');
  expect(errors).toEqual([]);
});
