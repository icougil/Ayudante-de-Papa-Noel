const { test, expect } = require('@playwright/test');
const { openGame, startGame, answer, pageScrolls } = require('./helpers');

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
