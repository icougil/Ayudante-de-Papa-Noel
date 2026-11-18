# Version Stamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every published release loads fresh scripts and styles and shows which version it is.

**Architecture:** A Node script (`scripts/stamp-release.js`) rewrites the published copy of
`index.html` in the deploy job: it appends `?v=<commit>` to the local script and stylesheet
references and fills an empty `<meta name="version">`. The game reads that meta tag at start-up,
logs the version and shows a tiny short version on the cover. The repository's `index.html` keeps
the meta tag empty, so opened from disk nothing changes.

**Tech Stack:** Plain JavaScript (no build, no dependency), Node 24 `node:test` for unit tests,
Playwright for browser tests, GitHub Actions.

**Spec:** `docs/specs/2026-11-18-version-stamp-design.md`

## Global Constraints

- No new dependency; the game keeps working when `index.html` is opened from disk.
- Code, identifiers, test names and comments in English; text the player reads in Spanish.
- Full version format: `YYYY-MM-DD HH:MM · <commit7>` (separator is space, U+00B7 `·`, space),
  date and time in the `Europe/Madrid` time zone.
- Short version (cover): `YYYY-MM-DD · <commit7>`.
- Cache key appended to references: `?v=<commit7>`.
- Console line: `Ayudante de Papá Noel · versión <full version>`.
- Cover text: about 10 px, around half opacity, bottom-right of the cover screen,
  `aria-hidden="true"`, absent when the meta tag is empty.
- The Umami script (`https://cloud.umami.is/script.js`) is never stamped.

## Review Focus

- A script or stylesheet added to `index.html` later must be stamped too, not silently left
  cacheable → the stamp covers every local `.js`/`.css` reference, and a unit test stamps the real
  `index.html` and finds no local reference without `?v=` (Task 1).
- Someone edits `index.html` and drops or fills the meta tag → the unit test on the real
  `index.html` fails in CI before any deploy (Task 1).
- Deploys around midnight and on daylight-saving days must show Barcelona's date and time, not
  UTC's → unit tests at 23:30 UTC on 31 December and in summer (Task 1).
- `GITHUB_SHA` missing or malformed must stop the deploy, not publish `?v=undefined` → unit test of
  the commit check (Task 1).
- On a 360×640 phone the version text must not cover the "¡A repartir!" button → browser test
  (Task 2).

---

### Task 1: The stamp script and the deploy step

**Files:**
- Create: `scripts/stamp-release.js`
- Create: `tests/stamp-release.test.js`
- Modify: `index.html` (add `<meta name="version" content="">` in `<head>`)
- Modify: `.github/workflows/ci.yml` (deploy job)

**Interfaces:**
- Produces (CommonJS exports of `scripts/stamp-release.js`):
  - `formatVersion(date: Date, commit: string) -> string` — full version, e.g.
    `formatVersion(new Date('2026-11-18T20:47:00Z'), 'e8db89f0123…')` → `'2026-11-18 21:47 · e8db89f'`.
    Uses `Intl.DateTimeFormat` with `timeZone: 'Europe/Madrid'`, 24-hour clock.
  - `stampRelease(html: string, commit: string, date: Date) -> string` — returns the stamped
    HTML. Appends `?v=<commit7>` to every `src="…"`/`href="…"` value that is a relative path
    ending in `.js` or `.css` (not starting with `http:`, `https:`, `//` or `/`); sets the
    meta tag's content to `formatVersion(date, commit)`.
  - Errors (thrown `Error`, exact messages):
    - commit not matching `/^[0-9a-f]{7,40}$/`: `Commit must be 7 to 40 hexadecimal characters, got "<commit>"`
    - meta tag `<meta name="version" content="">` not present: `Missing <meta name="version" content=""> in the page`
    - no local reference found: `No local script or stylesheet reference found in the page`
  - CLI: `node scripts/stamp-release.js <path>` reads the file, stamps it with
    `process.env.GITHUB_SHA` and `new Date()`, writes it back, prints
    `Stamped <path> as <full version>`. Without a path: prints
    `Usage: node scripts/stamp-release.js <path/to/index.html>` and exits 1. Any thrown error:
    prints its message to stderr and exits 1. The CLI runs only when `require.main === module`.

- [ ] **Step 1: Write the failing tests** in `tests/stamp-release.test.js`:
  - `formatVersion uses Barcelona time in winter` — `2026-11-18T20:47:00Z` → `2026-11-18 21:47 · e8db89f`.
  - `formatVersion uses Barcelona time in summer` — `2026-07-01T10:05:00Z` → `2026-07-01 12:05 · e8db89f`.
  - `formatVersion moves to the next day after midnight in Barcelona` — `2026-12-31T23:30:00Z` → `2027-01-01 00:30 · e8db89f`.
  - `stampRelease adds the commit to local scripts and stylesheets only` — on a small HTML with
    `css/styles.css`, `js/ui.js` and the Umami script: the first two end in `?v=e8db89f`, the
    Umami `src` is unchanged.
  - `stampRelease fills the version meta tag` — content equals the full version.
  - `stampRelease rejects a missing or malformed commit` — `''`, `'undefined'`, `'xyz1234'` each
    throw the commit message.
  - `stampRelease rejects a page without the empty version meta tag` — throws the meta message.
  - `stampRelease rejects a page without local references` — throws the reference message.
  - `the real index.html can be stamped and leaves no local reference unstamped` — reads
    `index.html`, stamps it, asserts the five references (`css/styles.css`, `js/data-level-1.js`,
    `js/game-logic.js`, `js/sound.js`, `js/ui.js`) each carry `?v=e8db89f`, that no
    `src`/`href` ending in `.js` or `.css` without `?v=` remains apart from the Umami script, and
    that the meta tag is filled.

- [ ] **Step 2: Run** `node --test tests/stamp-release.test.js` — expected: FAIL, cannot find
  module `../scripts/stamp-release.js`.

- [ ] **Step 3: Implement** `scripts/stamp-release.js` per the Interfaces block, and add
  `<meta name="version" content="">` to `index.html`'s `<head>` (after the viewport meta).

- [ ] **Step 4: Run** `npm test` — expected: all unit tests pass, the new ones included.

- [ ] **Step 5: Deploy step.** In the `deploy` job of `.github/workflows/ci.yml`, after
  "Collect the game files" and before `upload-pages-artifact`, add `actions/setup-node@v7` with
  `node-version: 24` and a step named `Stamp the release with its version` running
  `node scripts/stamp-release.js _site/index.html` (`GITHUB_SHA` is set by Actions). `scripts/`
  is not copied into `_site`.

- [ ] **Step 6: Check the CLI by hand** — copy `index.html` to the scratch area and run
  `GITHUB_SHA=e8db89f0000000000000000000000000000000000 node scripts/stamp-release.js <copy>`:
  prints `Stamped <copy> as <today> <time> · e8db89f`; running without `GITHUB_SHA` exits 1 with
  the commit message.

- [ ] **Step 7: Commit** — `scripts/stamp-release.js`, `tests/stamp-release.test.js`,
  `index.html`, `.github/workflows/ci.yml`, plus the already-pending `.gitignore`, `BACKLOG.md`,
  the spec and this plan. Message: `Stamp each release with its date and commit so browsers load fresh files`.

### Task 2: Show the version in the game

**Files:**
- Modify: `index.html` (version element in `#screen-start`)
- Modify: `js/ui.js` (start-up section)
- Modify: `css/styles.css`
- Create: `e2e/version.spec.js`

**Interfaces:**
- Consumes: `<meta name="version" content="…">` from Task 1 (empty in the repository).
- Produces: `<p id="version" class="version" aria-hidden="true" hidden></p>` inside
  `#screen-start`; at start-up `ui.js` reads the meta content and, only if it is non-empty,
  calls `console.info('Ayudante de Papá Noel · versión ' + version)`, sets `#version`'s text to
  the short version (the full version without its ` HH:MM` part) and removes `hidden`.

- [ ] **Step 1: Write the failing browser tests** in `e2e/version.spec.js` (desktop project).
  For the stamped case, build a temporary copy: copy `css/` and `js/` into a fresh temp dir and
  write `stampRelease(<index.html>, 'e8db89f…', new Date('2026-11-18T20:47:00Z'))` there as
  `index.html`, then open it by `file://` URL (route the Umami script as `e2e/helpers.js` does):
  - `opened from disk, the cover shows no version and logs none` — `#version` is hidden and no
    console message contains `versión`.
  - `a stamped copy shows its short version on the cover and logs the full one` — `#version` is
    visible with text `2026-11-18 · e8db89f`, has `aria-hidden="true"`, and the console has
    `Ayudante de Papá Noel · versión 2026-11-18 21:47 · e8db89f`; the game still starts
    (clicking "¡A repartir!" shows `#screen-trip`), proving the `?v=` references load.
  - `on a 360x640 phone the version does not cover the start button` — stamped copy at that
    viewport: the bounding boxes of `#version` and `#button-start` do not intersect, and
    `#version` is in the viewport.

- [ ] **Step 2: Run** `npx playwright test e2e/version.spec.js --project=desktop` — expected:
  FAIL, `#version` not found.

- [ ] **Step 3: Implement** the element, the start-up code in `ui.js` (start-up section, next to
  `renderSoundToggles()`), and `.version` in `styles.css`: about 10 px, around half opacity,
  bottom-right of the start screen, not intercepting taps (`pointer-events: none`).

- [ ] **Step 4: Run** `npm test` and `npx playwright test` — expected: all pass on both
  projects.

- [ ] **Step 5: Commit** — the four files. Message: `Show the release version faintly on the cover and in the console`.

### Task 3: Documentation

**Files:**
- Modify: `README.md` (tests/publishing section and the folder table)
- Modify: `BACKLOG.md`

- [ ] **Step 1:** README: after the sentence that the game is published only from `main`, add
  that the deploy stamps the published copy with its date, time (Barcelona) and commit, so
  browsers load fresh files and the version shows faintly at the bottom of the cover and in the
  console; opened from disk, no version is shown. Add `scripts/` to the folder table:
  `Release tooling run by CI (the version stamp)`. Update the `tests/` row to mention the
  version stamp.
- [ ] **Step 2:** BACKLOG: tick "Stamp a version into each published release" and replace its
  "Needs deciding" sentence with what was decided (query string with the commit, version on
  the cover and in the console).
- [ ] **Step 3: Run** `npm test` — expected: pass (README not tested; sanity only).
- [ ] **Step 4: Commit** — `README.md`, `BACKLOG.md`. Message: `Describe the release version stamp`.
