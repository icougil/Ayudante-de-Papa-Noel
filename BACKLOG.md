# Backlog

Work that is agreed to be worth doing but not started. Each item is taken one at a time: design
it, implement it, tick it. An item holds enough context to be picked up without the conversation
it came from.

## Questions

- [ ] **Grow the question bank a lot, across varied topics.** Part 1 is done: the questions live
  in one file per subject (`questions/*.json`), each with a language label, topics, difficulty and
  references, and the bank holds about 60 questions. Part 2 is built (a scheduled job that adds
  10 questions every 3 days as a pull request, see `docs/specs/2026-11-24-question-batch-job-design.md`);
  it is done once the first batch is merged. Still to do: the rest of part 3 (remembering the player); see
  `docs/specs/2026-11-18-question-bank-design.md`. Targets for the job: at least 15 questions in
  every pool (each of the six cities and each general subject: maths, science, language, english,
  catalan), about 11 batches of 10. Fill the pools furthest below 15 first: general catalan (3),
  language (5), english (6), and every city (5). Cities also lack subjects: sports in Santiago,
  Sevilla and Zaragoza (1 each in Barcelona, Bilbao and Madrid), history in Barcelona, Bilbao and
  Madrid. City questions are almost all difficulty 1, so add harder ones too.
- [ ] **Get questions from an external source instead of writing them by hand.** Part 1 is done
  (subject files, labels, about 60 questions written from the reading list in the spec, each with a
  reference). Part 2 (a scheduled job writing the questions itself, reviewed by the owner in a pull
  request) is built and part 3 (remembering the player) remains; see
  `docs/specs/2026-11-18-question-bank-design.md`.
- [x] **The owner reviews the 60 current questions** in `questions/*.json` for correctness and
  tone. Done: four city questions were too specialised for ages 10 to 12 (the Guggenheim's
  architect, the sierra between Madrid and Castilla y León, the river that forms the ría de Bilbao
  with the Ibaizábal, the Aljafería's century) and were replaced by easier ones on the same city
  and subject. The tests cannot judge whether a question suits the age, so a person must keep
  checking that for every new batch.
- [ ] **Ask general questions about Catalonia, not only at the Barcelona stop.** The players are
  in Catalonia (cicle superior), yet Catalan places, history and traditions only come up at the
  Barcelona stop (5 questions, one per game), plus 3 Catalan-language questions. Geography,
  history and culture questions are always tied to one of the 6 cities, and the picker's general
  turns only draw maths, science, language, english and catalan (see *The picker* in
  `docs/specs/2026-11-18-question-bank-design.md`). Wanted: questions about Catalonia (e.g.
  Montserrat, the Pyrenees, the Ebre delta, castells, Sant Jordi, caga tió) that can come up on a
  general turn, in Spanish or Catalan, suited to ages 10 to 12. Needs a design step first:
  how they are marked (a new place like `catalunya`, or a topic), how often a game may ask them,
  and how they fit the picker's rules and the two-`ca`-questions cap.
- [ ] **Let the first stop (Barcelona) have more than 5 questions without breaking a test.** The
  test `pickQuestions repeats the least recently seen city question when city and general are all
  seen` in `tests/game-logic.test.js` assumes the first stop has exactly 5 questions, so it fails
  when the Barcelona pool grows to 6. The first batch (PR #17) had to drop its Barcelona question
  because of it, so Barcelona stays at 5 while the other pools grow. Fix the test so it does not
  depend on the pool size, then let the batch job fill Barcelona too.

## Cities

- [ ] **Rotate the cities: a pool of about 10, 6 per trip.** Agreed with the owner on 2026-11-24
  instead of adding a 7th stop. A 7th stop was turned down because the stars are built around 6
  (3 gifts to pass, 6 express for the fifth star), it makes the game about 15% longer, and
  "longer games" is an anti-goal in `docs/specs/2026-11-16-five-stars-design.md`. A trip keeps
  6 stops, the "Ciudad N/6" scoreboard and the stars. Each game takes its stops from a larger
  pool, so repeat players see new places. Wait until the 6 current city pools reach about 10
  questions each (they are at 5 or 6). Before that, rotating would only spread the repeats
  around. Depends on the item "Let the first stop (Barcelona) have more than 5 questions".
  Proposed, to settle in the design step:
  - Pool: the 6 current cities plus Valencia (Ciudad de las Artes y las Ciencias), Granada
    (Alhambra), Tenerife (El Teide; chosen by the owner over Palma for its volcanic geography
    and the Teide national park) and, last and optional, A Coruña (Torre de Hércules, a Roman
    lighthouse and World Heritage site; chosen by the owner over Málaga, which would have been
    the third city in Andalusia; it is the second city in Galicia, about 70 km from Santiago,
    so the two can share a route). The stop is
    named `Tenerife`, not `Santa Cruz de Tenerife`: its questions cover the whole island, and a
    long name risks the narrow-screen scoreboard wrap noted below.
  - Route: Barcelona is always first. The other 5 are drawn at random and sorted by a fixed
    ring order around the peninsula (Barcelona, Zaragoza, Bilbao, A Coruña, Santiago, Madrid,
    Sevilla, Granada, Valencia, Tenerife), so every route makes sense on a map. Tenerife is off
    the mainland, so it is last in the ring and always the last stop when drawn. A new pure
    `APN.pickRoute(level, rng)` feeds `pickQuestions` a route in place of the level.
  - Each new city needs a landmark SVG in `js/ui.js` and at least 6 questions (geography,
    history, sports and culture, difficulty 1 and 2) before it joins the pool. The question
    build checks that minimum. The city's pull request can hold those questions, then the
    batch job grows its pool.
  - Order: the test fix above, then the current city pools to about 10, then the rotation code
    with the current 6 cities (same game, ring order), then one pull request per new city.

## Sound

- [x] **Add music and sound effects, with a way to turn them on and off.** The game is silent
  and feels flat. Wanted: background music while flying, and sound effects for the events of a
  game (a right answer and its delivery, an express delivery, turbo, each mishap, arriving at a
  city, the result screen). The player must be able to switch sound on and off, and the choice
  should be remembered between games. Needs deciding: whether music and effects have separate
  switches; where the sounds come from and their licence (recorded files, or generated in the
  browser with the Web Audio API so there are no assets); and how it starts, since browsers
  block sound until the player's first tap (the "¡A repartir!" button is the natural moment).
- [ ] **Check the sound on a real iPhone (waiting for someone with an iPhone).** The sound has
  been checked by ear only on a computer and an Android phone. On an iPhone, Safari can leave the
  Web Audio context "interrupted" after the phone is locked and unlocked mid-trip. The game
  already resumes the context when the page becomes visible again and before every sound
  (`js/sound.js`), so this is a confirmation, not a known bug. To check: start a trip with sound
  on, lock the phone for a few seconds, unlock it, answer one question; music and effects must
  play again.

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
- [x] **Publish a playable preview of each pull request.** Today a change can only be played
  from a local checkout (`index.html` on the computer) or after merging, so checks on a real
  phone (see "Check the sound on a real iPhone") and a child trying a change both wait for the
  merge. Wanted: every pull request gets a link that plays its branch; the live site keeps
  working and keeps its version stamp. Decided: each pull request description carries a
  `Play this branch` link to htmlpreview.github.io, which loads the pull request's last push
  from GitHub through `refs/pull/<number>/head`, so it stays playable after the merge (rule in
  `CLAUDE.md`); nothing changes in the deploy or the Pages settings. The preview has no
  version stamp, and Umami does not count it. Not adopted: previews from a `gh-pages` branch
  with `rossjrw/pr-preview-action`, which would move the live deploy to that branch; kept as the
  fallback if htmlpreview.github.io goes away; if it is ever used, pin third-party actions to a
  commit; other candidates were `access-nri/pr-preview-action` and `peaceiris/actions-gh-pages`
  plus a comment step; previews of PRs from forks are not needed; previews are public like the
  repository.
- [x] **Let the owner redeploy `main` by hand from the Actions tab.** On 2026-11-23 the deploy of
  the merged PR failed three times in a row: `deploy-pages` found 0 artifacts right after a
  successful upload (open GitHub bug actions/deploy-pages#451, worse in the last days), and
  re-running only the failed job uploaded a second `github-pages` artifact, so retries then failed
  with "Multiple artifacts named github-pages". Done: the upload now runs in its own job, before
  the deploy job (the layout of GitHub's other Pages starters, which the bug does not hit), and
  the workflow has a `workflow_dispatch` trigger that deploys `main`. The README says to re-run
  the whole workflow after a failed deploy. Check after the first merge to `main`; if the bug
  still hits, retry the lookup in a step or deploy by artifact id once actions/deploy-pages#399
  is merged.

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
