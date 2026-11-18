const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { formatVersion, stampRelease } = require('../scripts/stamp-release.js');

const COMMIT = 'e8db89f0123456789abcdef0123456789abcdef0';
const WINTER = new Date('2026-11-18T20:47:00Z');

const SMALL_PAGE = [
  '<head>',
  '<meta name="version" content="">',
  '<link rel="stylesheet" href="css/styles.css">',
  '<script defer src="https://cloud.umami.is/script.js" data-website-id="x"></script>',
  '</head>',
  '<body><script src="js/ui.js"></script></body>'
].join('\n');

test('formatVersion uses Barcelona time in winter', () => {
  assert.equal(formatVersion(WINTER, COMMIT), '2026-11-18 21:47 · e8db89f');
});

test('formatVersion uses Barcelona time in summer', () => {
  assert.equal(formatVersion(new Date('2026-07-01T10:05:00Z'), COMMIT), '2026-07-01 12:05 · e8db89f');
});

test('formatVersion moves to the next day after midnight in Barcelona', () => {
  assert.equal(formatVersion(new Date('2026-12-31T23:30:00Z'), COMMIT), '2027-01-01 00:30 · e8db89f');
});

test('stampRelease adds the commit to local scripts and stylesheets only', () => {
  const html = stampRelease(SMALL_PAGE, COMMIT, WINTER);
  assert.ok(html.includes('href="css/styles.css?v=e8db89f"'));
  assert.ok(html.includes('src="js/ui.js?v=e8db89f"'));
  assert.ok(html.includes('src="https://cloud.umami.is/script.js"'));
});

test('stampRelease fills the version meta tag', () => {
  const html = stampRelease(SMALL_PAGE, COMMIT, WINTER);
  assert.ok(html.includes('<meta name="version" content="2026-11-18 21:47 · e8db89f">'));
});

test('stampRelease rejects a missing or malformed commit', () => {
  for (const commit of ['', 'undefined', 'xyz1234']) {
    assert.throws(() => stampRelease(SMALL_PAGE, commit, WINTER), {
      message: `Commit must be 7 to 40 hexadecimal characters, got "${commit}"`
    });
  }
});

test('stampRelease rejects a page without the empty version meta tag', () => {
  const page = SMALL_PAGE.replace('<meta name="version" content="">', '');
  assert.throws(() => stampRelease(page, COMMIT, WINTER), {
    message: 'Missing <meta name="version" content=""> in the page'
  });
});

test('stampRelease rejects a page without local references', () => {
  const page = '<meta name="version" content="">\n<script src="https://example.com/a.js"></script>';
  assert.throws(() => stampRelease(page, COMMIT, WINTER), {
    message: 'No local script or stylesheet reference found in the page'
  });
});

test('the real index.html can be stamped and leaves no local reference unstamped', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const html = stampRelease(source, COMMIT, WINTER);
  for (const file of ['css/styles.css', 'js/data-level-1.js', 'js/game-logic.js', 'js/sound.js', 'js/ui.js']) {
    assert.ok(html.includes(`${file}?v=e8db89f"`), `${file} is not stamped`);
  }
  const unstamped = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) => m[1]);
  assert.deepEqual(unstamped, ['https://cloud.umami.is/script.js']);
  assert.ok(html.includes('<meta name="version" content="2026-11-18 21:47 · e8db89f">'));
});
