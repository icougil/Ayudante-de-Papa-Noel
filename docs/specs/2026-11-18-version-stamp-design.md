# Version stamp for releases — design

Date: 2026-11-18. Approved by the owner in conversation on the same day.

## Intent

After the sound was merged, the owner heard no sound on the published site. GitHub Pages sends
`cache-control: max-age=600`, so for up to 10 minutes after a release a browser can mix the new
`index.html` with old scripts and styles from its cache. Each release must load fresh scripts and
styles, and the owner (or a player reporting a problem) must be able to see which version is live.

Points the owner did not decide are marked **(designer's call)**.

## Goals, non-goals, anti-goals

- Goal: every published release references its stylesheet and scripts with a version that changes
  on each release, so the browser fetches them fresh.
- Goal: the published page carries its version (date, time in Barcelona, and commit), readable in
  the page source, in the browser console and, very discreetly, on the cover.
- Goal: opening `index.html` from disk keeps working, unchanged.
- Non-goal: the 10-minute cache on `index.html` itself. GitHub Pages does not allow changing that
  header; a visitor may still get the previous release, whole and consistent, for a few minutes.
- Anti-goal: a version text that disturbs the player. It must be tiny and faint.
- Anti-goal: a release published without its stamp because a reference in `index.html` changed
  and nothing noticed.

## Approaches

1. **A Node script in the repository, run by the deploy job — chosen.** It rewrites the published
   copy only and has unit tests, so a broken stamp fails before anything is published. Node is
   already used by the tests; no dependency is added.
2. `sed` commands inside `ci.yml`: no new file, but untested; if a reference in `index.html`
   changes, the stamp silently stops applying. Rejected.
3. A `version.js` file generated at deploy time and loaded by the page: that file would itself be
   cached for 10 minutes, which is the problem being solved. Rejected.

## Design

### Version format

- Full version: `YYYY-MM-DD HH:MM · <commit>`, e.g. `2026-11-18 21:47 · e8db89f`.
  - Date and time are the moment of the deploy in the `Europe/Madrid` time zone (the owner's
    choice: Barcelona time, summer and winter time handled by the zone).
  - `<commit>` is the first 7 characters of the commit being published.
- Short version (cover only): `YYYY-MM-DD · <commit>`, e.g. `2026-11-18 · e8db89f`
  **(designer's call, approved by the owner)**.
- Cache key: `?v=<commit>` appended to the file references.

### The stamp script

- `scripts/stamp-release.js`, run by the deploy job after the game files are copied into `_site/`
  and before `upload-pages-artifact`, on `_site/index.html`.
- It appends `?v=<commit>` to the reference of `css/styles.css` and of the four game scripts
  (`js/data-level-1.js`, `js/game-logic.js`, `js/sound.js`, `js/ui.js`). The Umami script is
  external and left untouched.
- It fills the `content` of `<meta name="version" content="">`, which `index.html` holds empty.
- It fails (non-zero exit, message naming what is missing) if any of the five references or the
  meta tag is not found, so the deploy stops instead of publishing without the stamp.
- The stamping is a pure function of the HTML text, the commit and the date, so it is unit-tested
  in `tests/` like the rest of the logic; the script's entry point only reads the file, the
  environment (commit) and the clock, and writes the result.

### The game

- At start, if the version meta tag has a non-empty `content`:
  - the console shows `Ayudante de Papá Noel · versión <full version>`;
  - the cover shows the short version, about 10 px, faint (around half opacity), at the
    bottom-right, hidden from screen readers (`aria-hidden="true"`).
- If the meta tag is empty (the repository copy, opened from disk), nothing is logged or shown.
- The short version is derived from the full one by dropping the time.

## Left to the builder

- Where exactly the meta tag sits in `index.html`'s `<head>` and the exact CSS values, within the
  limits above.
- How the script receives the commit (`GITHUB_SHA` is available in the deploy job).
