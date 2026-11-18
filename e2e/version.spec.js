// The release stamp: opened from disk the game shows no version; a copy stamped the way the
// deploy job does it shows the short version on the cover and logs the full one.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');
const { openGame } = require('./helpers');
const { stampRelease } = require('../scripts/stamp-release');

const ROOT = path.join(__dirname, '..');
const COMMIT = 'e8db89f0123456789abcdef0123456789abcdef0';
let stampedDir;
let stampedUrl;

test.beforeAll(() => {
  stampedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apn-stamped-'));
  fs.cpSync(path.join(ROOT, 'css'), path.join(stampedDir, 'css'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'js'), path.join(stampedDir, 'js'), { recursive: true });
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  fs.writeFileSync(path.join(stampedDir, 'index.html'),
    stampRelease(html, COMMIT, new Date('2026-11-18T20:47:00Z')));
  stampedUrl = pathToFileURL(path.join(stampedDir, 'index.html')).href;
});

test.afterAll(() => {
  fs.rmSync(stampedDir, { recursive: true, force: true });
});

async function openStamped(page) {
  await page.route('https://cloud.umami.is/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.goto(stampedUrl);
}

test('opened from disk, the cover shows no version and logs none', async ({ page }) => {
  const messages = [];
  page.on('console', (message) => messages.push(message.text()));
  await openGame(page);
  await expect(page.locator('#screen-start')).toBeVisible();
  await expect(page.locator('#version')).toBeHidden();
  expect(messages.filter((text) => text.includes('versión'))).toEqual([]);
});

test('a stamped copy shows its short version on the cover and logs the full one', async ({ page }) => {
  const messages = [];
  page.on('console', (message) => messages.push(message.text()));
  await openStamped(page);
  const version = page.locator('#version');
  await expect(version).toBeVisible();
  await expect(version).toHaveText('2026-11-18 · e8db89f');
  await expect(version).toHaveAttribute('aria-hidden', 'true');
  expect(messages).toContain('Ayudante de Papá Noel · versión 2026-11-18 21:47 · e8db89f');
  await page.locator('#button-start').click();
  await expect(page.locator('#screen-trip')).toBeVisible();
});

test('on a 360x640 phone the version does not cover the start button', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openStamped(page);
  const version = await page.locator('#version').boundingBox();
  const button = await page.locator('#button-start').boundingBox();
  const apart = version.x + version.width <= button.x || button.x + button.width <= version.x
    || version.y + version.height <= button.y || button.y + button.height <= version.y;
  expect(apart).toBe(true);
  expect(version.x).toBeGreaterThanOrEqual(0);
  expect(version.y + version.height).toBeLessThanOrEqual(640);
});
