const { test, expect } = require('@playwright/test');
const { openGame, recordSounds, startGame, answer, pageScrolls } = require('./helpers');

// Opens the game, collects page errors and taps the title so the browser allows sound.
async function openWithSound(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
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

test('every effect plays without a page error', async ({ page }) => {
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

async function playToResult(page) {
  for (let n = 0; n < 6; n++) {
    await answer(page, true);
    if (n < 5) {
      await expect(page.locator('#scoreboard-city')).toContainText('Ciudad ' + (n + 2) + '/6');
    }
  }
  await expect(page.locator('#screen-result')).toBeVisible();
}

test('the switch is on the cover, the trip and the result screen', async ({ page }) => {
  await openGame(page);
  await expect(toggle(page)).toHaveCount(1);
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);
  await expect(toggle(page)).toHaveCount(1);
  await playToResult(page);
  await expect(toggle(page)).toHaveCount(1);
});

test('tapping the switch turns sound off and says so', async ({ page }) => {
  await openGame(page);
  const button = toggle(page);
  await button.click();
  await expect(button).toHaveText('🔇');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button).toHaveAttribute('aria-label', 'Sonido desactivado');
  expect(await page.evaluate(() => globalThis.APN.sound.isOn())).toBe(false);
  await button.click();
  await expect(button).toHaveText('🔊');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveAttribute('aria-label', 'Sonido activado');
  expect(await page.evaluate(() => globalThis.APN.sound.isOn())).toBe(true);
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

test.describe('on a small phone (360x640)', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('the switch stays inside the scene and the page does not scroll', async ({ page }) => {
    await startGame(page);
    const button = await toggle(page).boundingBox();
    const scene = await page.locator('#scene').boundingBox();
    expect(button.x).toBeGreaterThanOrEqual(scene.x);
    expect(button.y).toBeGreaterThanOrEqual(scene.y);
    expect(button.x + button.width).toBeLessThanOrEqual(scene.x + scene.width);
    expect(button.y + button.height).toBeLessThanOrEqual(scene.y + scene.height);
    expect(button.width).toBeGreaterThanOrEqual(44);
    expect(button.height).toBeGreaterThanOrEqual(44);
    expect(await pageScrolls(page)).toBe(false);
    for (const option of await page.locator('#options button').all()) {
      await expect(option).toBeInViewport({ ratio: 1 });
    }
    // 200 px: the height of #scene at 360x640 during a trip before the switch was added.
    expect(scene.height).toBe(200);
  });
});

// ---------- The sounds of a game ----------

const calls = (page) => page.evaluate(() => window.__soundCalls);

// Opens the game with the sound methods recorded and starts it.
async function recordedStart(page) {
  await openGame(page);
  await recordSounds(page);
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);
}

// Answers the question on screen right and waits for the next city.
async function answerRightAndWaitFor(page, nextCity) {
  await answer(page, true);
  await expect(page.locator('#scoreboard-city')).toContainText('Ciudad ' + nextCity + '/6');
}

// Plays the six cities, all right or all wrong, until the result screen.
async function playSix(page, right) {
  for (let n = 0; n < 6; n++) {
    await answer(page, right);
    if (!right) {
      await page.locator('#button-next').click();
    }
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
  await recordedStart(page);
  await answerRightAndWaitFor(page, 2);
  await answerRightAndWaitFor(page, 3);
  await answerRightAndWaitFor(page, 4);
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
  await recordedStart(page);
  await playSix(page, true);
  expect((await calls(page)).slice(-2)).toEqual([['stopMusic'], ['play', 'pass']]);
});

test('a level that is not passed stops the music and plays the gentle sound', async ({ page }) => {
  await recordedStart(page);
  await playSix(page, false);
  expect((await calls(page)).slice(-2)).toEqual([['stopMusic'], ['play', 'notPassed']]);
});

test('playing again takes off again', async ({ page }) => {
  await recordedStart(page);
  await playSix(page, true);
  const before = (await calls(page)).length;
  await page.locator('#button-again').click();
  await expect(page.locator('#options button')).toHaveCount(4);
  expect((await calls(page)).slice(before, before + 2)).toEqual([
    ['play', 'takeOff'],
    ['startMusic', 1.1],
  ]);
});

test('a whole game with sound on raises no page error', async ({ page }) => {
  const errors = await openWithSound(page);
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);
  await playToResult(page);
  expect(errors).toEqual([]);
});

test('a whole game with sound switched off raises no page error and never plays music', async ({ page }) => {
  const errors = await openWithSound(page);
  await toggle(page).click();
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);
  expect((await state(page)).music).toBe(false);
  for (let n = 0; n < 6; n++) {
    await answer(page, true);
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
  await openGame(page);
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);
  await playToResult(page);
  expect((await state(page)).context).toBe('none');
  expect(errors).toEqual([]);
});
