# Backlog

Work that is agreed to be worth doing but not started. Each item is taken one at a time: design
it, implement it, tick it. An item holds enough context to be picked up without the conversation
it came from.

## Questions

- [ ] **Do not repeat questions a player has already seen.** Today every game picks 6 questions
  at random from a bank of 30 (3 per city and 12 general), so a second game already repeats
  some. At the very least a game must not ask questions from the player's previous games until
  the bank runs out. Needs deciding: where the seen questions are remembered (the browser's
  `localStorage` is the only option without a server), and what happens when a city has no
  unseen question left.
- [ ] **Grow the question bank a lot, across varied topics.** 30 questions are too few for
  replaying and for the item above to be of any use. The bank has 8 subjects (`geography`,
  `history`, `sports`, `culture`, `maths`, `science`, `language`, `english`); new questions
  should spread over them and may add subjects. The tests in `tests/data.test.js` fix the bank
  at exactly 3 questions per city and 12 general ones, so they change with this item.
- [ ] **Get questions from an external source instead of writing them by hand.** So far every
  question was written during development. Find one or more sources of questions (an open
  trivia dataset or API, school curriculum material) so the bank is varied and does not depend
  on hand-writing. Needs deciding: the source and its licence, whether questions are imported
  once into `js/data-level-1.js` or fetched while playing (the game works offline and from
  `file://` today), how Spanish text and the 10-to-12 age range are guaranteed, and who reviews
  what comes in.
- [ ] **The owner reviews the 30 current questions** in `js/data-level-1.js` for correctness and
  tone. They have only been checked by the tests (shape and length), not by a person.

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
