# Backlog

Work that is agreed to be worth doing but not started. Each item is taken one at a time: design
it, implement it, tick it. An item holds enough context to be picked up without the conversation
it came from.

## Questions

- [ ] **Do not repeat questions a player has already seen.** Part 3 of the question-bank plan
  (remembering the player), see `docs/specs/2026-11-18-question-bank-design.md`. A game picks 6
  questions at random from a bank of 60, so a second game can still repeat some. At the very least
  a game must not ask questions from the player's previous games until the bank runs out. Needs
  deciding: where the seen questions are remembered (the browser's `localStorage` is the only
  option without a server), and what happens when a city has no unseen question left.
- [ ] **Grow the question bank a lot, across varied topics.** Part 1 is done: the questions live
  in one file per subject (`questions/*.json`), each with a language label, topics, difficulty and
  references, and the bank holds about 60 questions. Still to do: part 2 (a scheduled job that
  adds questions) and part 3 (remembering the player); see
  `docs/specs/2026-11-18-question-bank-design.md`.
- [ ] **Get questions from an external source instead of writing them by hand.** Part 1 is done
  (subject files, labels, about 60 questions written from the reading list in the spec, each with a
  reference). Parts 2 (scheduled job) and 3 (remembering the player) remain, with the open
  decisions on the source, its licence and who reviews what comes in; see
  `docs/specs/2026-11-18-question-bank-design.md`.
- [ ] **The owner reviews the 60 current questions** in `questions/*.json` for correctness and
  tone. They have only been checked by the tests (shape and length), not by a person; each now has
  a reference to check the fact against.

## Sound

- [x] **Add music and sound effects, with a way to turn them on and off.** The game is silent
  and feels flat. Wanted: background music while flying, and sound effects for the events of a
  game (a right answer and its delivery, an express delivery, turbo, each mishap, arriving at a
  city, the result screen). The player must be able to switch sound on and off, and the choice
  should be remembered between games. Needs deciding: whether music and effects have separate
  switches; where the sounds come from and their licence (recorded files, or generated in the
  browser with the Web Audio API so there are no assets); and how it starts, since browsers
  block sound until the player's first tap (the "¡A repartir!" button is the natural moment).
- [ ] **Check the sound on a real iPhone.** The sound has been checked by ear only on a computer
  and an Android phone. On an iPhone, Safari can leave the Web Audio context "interrupted" after
  the phone is locked and unlocked mid-trip, so the game could stay silent until it is reloaded.
  To check: start a trip with sound on, lock the phone for a few seconds, unlock it, answer one
  question; music and effects must play again. If they do not, resume the context on the next
  tap as well as on `visibilitychange` (see `js/sound.js`).

## Publishing

- [x] **Stamp a version into each published release.** After the sound was merged, the owner
  heard no sound on the published site: GitHub Pages sends `cache-control: max-age=600`, so a
  visit within 10 minutes of a release can mix old and new files from the browser cache. Wanted:
  the CI deploy job (`.github/workflows/ci.yml`, step `upload-pages-artifact`) stamps a version
  (date and commit) into the published copy, so each release loads fresh scripts and styles and
  the player or the owner can see which version is live. Opening `index.html` from disk must keep
  working. Decided: the deploy adds `?v=<commit>` to the local script and stylesheet references
  and fills the page's version with the date, time (Barcelona) and commit. The version shows
  tiny and faint at the bottom-right of the cover and is logged to the console. Still open:
  `index.html` itself stays cached for up to 10 minutes (GitHub Pages does not allow changing
  that header), so a visitor may get the previous release (usually whole) for a few minutes.
- [ ] **Publish a playable preview of each pull request.** Today a change can only be played
  from a local checkout (`index.html` on the computer) or after merging, so checks on a real
  phone (see "Check the sound on a real iPhone") and a child trying a change both wait for the
  merge. Wanted: every pull request gets its own link on the same GitHub Pages site, posted as a
  PR comment, updated on each push and removed when the PR closes; the live site at the root
  keeps working and keeps its version stamp. Stay on GitHub Pages: no Netlify or Cloudflare
  account. Prefer a widely used, maintained option over a hand-written workflow. Candidates
  found so far: `rossjrw/pr-preview-action` (the most used; previews at
  `/pr-preview/pr-<number>/`), `access-nri/pr-preview-action`, or `peaceiris/actions-gh-pages`
  plus a comment step. GitHub's own preview input on `actions/deploy-pages` is an alpha not open
  to the public. Needs deciding: these actions publish from a `gh-pages` branch, while the site
  is now published from an uploaded artifact (the `deploy` job in `.github/workflows/ci.yml`),
  so the live deploy must move to that branch with the stamp step kept, or another way found;
  pin third-party actions to a commit; previews of PRs from forks are not supported and not
  needed; previews are public like the repository.

## Noted during development

- [ ] **The scoreboard can take three rows on a narrow screen.** At 360 px wide, a long city name
  (`Santiago de Compostela`) plus five delivered gifts (`🎁🎁🎁🎁🎁`) may wrap the scoreboard to a
  third row and push the fourth answer below the fold again. Not reproduced yet; the browser
  tests only cover the first two cities at that size.
- [x] **No favicon.** The published site answers 404 for `favicon.ico`, which shows as an error
  in the browser console. Fixed with an inline 🎅 SVG icon in `index.html`, so no icon file is
  requested.
- [ ] **Screen text is not ready for translation.** The Spanish text the player reads sits in
  `index.html` and `js/ui.js`. Extract it into data so other languages can be added.
- [x] **The README says the tests run on Node.js 18 or later, but only Node 24 is exercised**
  (locally and in CI). Either test the oldest supported version in CI or raise the stated
  minimum. Raised the stated minimum to 24, the version CI uses: Node 18 and 20 are past
  end-of-life.
- [ ] **No independent code review has been run** on level 1.
- [ ] **Revisit the sound of the reindeer mishap.** It is a comic nose-blow (two honks) used
  as a placeholder: the owner was not convinced by any of the generated sneezes tried during the
  design. Options: another generated sound, or one short recorded sneeze with a licence that
  allows it (it would be the game's first asset file).
