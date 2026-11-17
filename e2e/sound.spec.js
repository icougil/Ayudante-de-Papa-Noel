const { test, expect } = require('@playwright/test');
const { openGame } = require('./helpers');

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
