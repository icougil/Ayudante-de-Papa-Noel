// Shared by the browser tests. By default they open index.html straight from disk, the way the
// README tells players to; set APN_URL to test a served or published copy instead.
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { expect } = require('@playwright/test');

const GAME_URL = process.env.APN_URL || pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

// The visit counter is an external script the page load would otherwise wait for: answer it with
// an empty script, so the tests never depend on that service being reachable.
const ANALYTICS_SCRIPT = 'https://cloud.umami.is/**';

// Opens the game without clicking anything.
async function openGame(page) {
  await page.route(ANALYTICS_SCRIPT, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.goto(GAME_URL);
}

// Replaces the sound methods that ui.js calls with wrappers that push [method, ...args] to
// window.__soundCalls and still call the original.
async function recordSounds(page) {
  await page.evaluate(() => {
    window.__soundCalls = [];
    for (const method of ['play', 'startMusic', 'stopMusic', 'setTurbo']) {
      const original = globalThis.APN.sound[method];
      globalThis.APN.sound[method] = function (...args) {
        window.__soundCalls.push([method, ...args]);
        return original.apply(this, args);
      };
    }
  });
}

async function startGame(page) {
  await openGame(page);
  await page.locator('#button-start').click();
  await expect(page.locator('#options button')).toHaveCount(4);
}

// Clicks the right answer, or the first wrong one, of the question on screen.
async function answer(page, right) {
  const prompt = await page.locator('#prompt').textContent();
  const correctText = await page.evaluate((text) => {
    const question = globalThis.APN.QUESTIONS.find((q) => globalThis.APN.plainText(q.prompt) === text);
    return question.options[question.correct];
  }, prompt);
  const buttons = page.locator('#options button');
  const texts = await buttons.allTextContents();
  const index = right ? texts.indexOf(correctText) : texts.findIndex((text) => text !== correctText);
  await buttons.nth(index).click();
}

async function pageScrolls(page) {
  return page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight);
}

module.exports = { openGame, recordSounds, startGame, answer, pageScrolls };
